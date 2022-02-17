const { Server: WSServer } = require('ws');
const express = require('express');
var cors = require('cors')

const PORT = process.env.PORT || 3007;
const INDEX = '/index.html';

let wss;
let rooms = {}

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
    .post('/publish/:roomKey', (req, res) => {
        const {roomKey} = req.params;
        const body = req.body;

        console.log('Publish request received', { roomKey, req });

        console.log({
            roomKey,
            keys: Object.keys(rooms)
        })
        if (!roomKey) {

            res.status(404).send({
                ok: false
            })
        }
        console.log('Publish request received', { roomKey });

        if(rooms[roomKey] && rooms[roomKey].chat) {
            rooms[roomKey].chat.push(body)
        } else {
            rooms[roomKey] = {
                chat: [body]
            }
        }

        if (rooms[roomKey] && rooms[roomKey].clients && rooms[roomKey].clients.length > 0) {
            rooms[roomKey].clients.forEach(function each(client) {
                console.log('Publishing to client')
                if (client.readyState === 1) {
                    client.send(JSON.stringify({
                        ...body
                    }, { binary: false }));
                } else {
                    console.log('Client not ready');
                }
            });
        } else {
            console.log('No active clients')
        }
        res.send('ok published');
    })
    .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

wss = new WSServer({ server });

wss.on('connection', (ws, req) => {
    const roomKey = encodeURIComponent(req.url);
    console.log('Client connected', { roomKey });


    if (rooms[roomKey] && Array.isArray(rooms[roomKey].clients)) {
        rooms[roomKey].clients.push(ws);
    } else {
        if (rooms[roomKey]) {
            rooms[roomKey].clients = [ws]
        } else {
            rooms[roomKey] = {
                clients: [ws]
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