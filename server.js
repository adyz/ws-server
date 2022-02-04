const { Server: WSServer } = require('ws');
const express = require('express');
const e = require('express');

const PORT = process.env.PORT || 3007;
const INDEX = '/index.html';

let wws;
let rooms = {}

const server = express()
    .use(express.json())
    .post('/publish', (req, res) => {
        const {key, message, id, email} = req.body;

        const roomKey = encodeURIComponent('/'+key);
        console.log({
            roomKey,
            keys: Object.keys(rooms)
        })
        if(!roomKey) {

            res.status(404).send({
                ok: false
            })
        }
        console.log('Publish request received', {roomKey});
        if (wss && wss.clients) {
            console.log(JSON.stringify({a: rooms[roomKey].clients.length}, null, 2))
            if(rooms[roomKey] && rooms[roomKey].clients && rooms[roomKey].clients.length > 0) {
                rooms[roomKey].clients.forEach(function each(client) {
                    console.log('Publishing to client')
                    if (client.readyState === 1) {
                        client.send(JSON.stringify({
                            message, id, email
                        }, { binary: false }));
                    } else {
                        console.log('not ready');
                    }
                });
            } else {
                console.log('No active clients')
            }

        } else {
            console.log('No wss clients', { wss })
        }
        res.send('ok published');
    })
    .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

wss = new WSServer({ server });

wss.on('connection', (ws, req) => {
    const roomKey = encodeURIComponent(req.url) // 'cucu' // req.url;
    console.log('Client connected', {roomKey});
    

    if(rooms[roomKey] && Array.isArray(rooms[roomKey].clients)) {
        rooms[roomKey].clients.push(ws);
    } else {
        if(rooms[roomKey]) {
            rooms[roomKey].clients = [ws]
        } else {
            rooms[roomKey] = {
                clients: [ws]
            }
        }
    }

    ws.on('close', () => {
        console.log('Closed connection, will remove client', {len: JSON.stringify(rooms[roomKey]?.clients?.length)})
        const restClients = rooms[roomKey]?.clients ? rooms[roomKey].clients.filter((client) => client !== ws) : [];
        rooms[roomKey].clients = restClients;
        console.log('Done removing', {len: JSON.stringify(rooms[roomKey]?.clients?.length)})
    });

    ws.on('message', function message(data, isBinary) {
        console.log('Client received message');
        rooms[roomKey].clients.forEach(function each(client) {
            console.log('I will send this this to client', client);
            if (client.readyState === 1) {
                client.send(data, { binary: isBinary });
            }
        });
    });
});