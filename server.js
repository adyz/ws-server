const { Server: WSServer } = require('ws');
const express = require('express');
var cors = require('cors');
const { generateChatMessage } = require('./mocks');

const PORT = process.env.PORT || 3007;
const INDEX = '/index.html';

let wss;
let rooms = {}


function sendThis(theRoomKey, theBody){
    if (rooms[theRoomKey] && rooms[theRoomKey].clients && rooms[theRoomKey].clients.length > 0) {
        rooms[theRoomKey].clients.forEach(function each(client) {
            console.log('Publishing to client')
            if (client.readyState === 1) {
                client.send(JSON.stringify({
                    ...theBody
                }, { binary: false }));
            } else {
                console.log('Client not ready');
            }
        });
    } else {
        console.log('No active clients')
    }
}

const server = express()
    .use(cors())
    .use(express.json())
    .get('/chat/:roomKey', (req, res) => {
        const {roomKey} = req.params;
        console.log('Get request received', {roomKey})

        if(rooms[roomKey] && rooms[roomKey].chat) {
            res.send({data: rooms[roomKey].chat})
        } else {
            res.send(`not found ${roomKey}`)
        }
        
        
    })
    .get('/spam', (req, res) => {

        setInterval(() => {

            const room = 'robo-dino-5de3b';
            const gen = generateChatMessage(Math.random() * 1000, new Date().getMilliseconds())
            sendThis(room, gen)
        }, 1000);


        res.send({
            ok: true
        })
    })
    .post('/publish/:roomKey', (req, res) => {
        const {roomKey} = req.params;
        const body = req.body;

        console.log('Publish request received', { roomKey });

        if (!roomKey) {
            console.log('No room with this key')
            res.status(404).send({
                ok: false
            })
        } else {
            if(rooms[roomKey] && rooms[roomKey].chat) {
                rooms[roomKey].chat.push(body)
            } else {
                rooms[roomKey] = {
                    chat: [body]
                }
            }
    
            sendThis(roomKey, body)
            res.send('ok published');
        }

    })
    .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

wss = new WSServer({ server });

wss.on('connection', (ws, req) => {
    const roomKey = req.url.replace('/', '');
    console.log('Client connected', { roomKey });


    if (rooms[roomKey] && Array.isArray(rooms[roomKey].clients)) {
        rooms[roomKey].clients.push(ws);
    } else {
        if (rooms[roomKey]) {
            rooms[roomKey].clients = [ws]
            rooms[roomKey].chat = []
        } else {
            rooms[roomKey] = {
                clients: [ws],
                chat: []
            }
        }
    }

    ws.on('close', () => {
        console.log('Closed connection, will remove client', { len: JSON.stringify(rooms[roomKey]?.clients?.length) })
        const restClients = rooms[roomKey]?.clients ? rooms[roomKey].clients.filter((client) => client !== ws) : [];
        rooms[roomKey].clients = restClients;
        console.log('Done removing', { len: JSON.stringify(rooms[roomKey]?.clients?.length) })
    });
});