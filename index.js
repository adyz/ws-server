const { Server: WSServer } = require('ws');
const express = require('express');

const PORT = process.env.PORT || 3007;
const INDEX = '/index.html';

let wws;

const server = express()
    .post('/publish', (req, res) => {
        console.log('Publish request received');
        if (wss && wss.clients) {
            console.log('Publishing to clients', { wss })
            wss.clients.forEach(function each(client) {
                console.log('Publishing to client', {client})
                if (client.readyState === 1) {
                    client.send('Ok Published', { binary: false });
                }
            });
        } else {
            console.log('No wss clients', { wss })
        }
        res.send('ok published');
    })
    .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

wss = new WSServer({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('close', () => console.log('Client disconnected'));
    ws.on('message', function message(data, isBinary) {
        console.log('Client received message');
        wss.clients.forEach(function each(client) {
            if (client.readyState === 1) {
                client.send(data, { binary: isBinary });
            }
        });
    });
});