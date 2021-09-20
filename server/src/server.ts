import express from 'express';
import WebSocket from "ws";
import { Truco } from './components/games/truco/truco';
import { TrucoPlayer } from './components/games/truco/trucoPlayer';
const cors = require('cors');
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const app = express();
app.use(cors());
const port = 3001;

const wrapExpress = async (expressServer: any) => {
    const websocketServer = new WebSocket.Server({
        noServer: true,
        path: "/websockets",
        });
    
        expressServer.on("upgrade", (request: any, socket: any, head: any) => {
            websocketServer.handleUpgrade(request, socket, head, (websocket) => {
                websocketServer.emit("connection", websocket, request);
            });
        });
    
    const truco = new Truco([new TrucoPlayer('nico', 'my_url'), new TrucoPlayer('chiri', 'my_url')], (p, opts) => {
        return new Promise((resolve) => {
            rl.question(`Player ${p.name} pick an option ${opts}: `, (o: string) => {
                resolve(o)
            });
        })
    });
    const winner = await truco.playGame();
    console.log(winner);
    return websocketServer;
}

const server = app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
})
wrapExpress(server);
