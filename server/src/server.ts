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
    }, (s, gs) => {
        let p1 = gs.players[0];
        let p2 = gs.players[1];
        const h = [p1.hand, p2.hand];
        console.log("SCORE " + [p1.score, p2.score]);
        if (gs.winner){
            console.log("WE HAVE A NEW WINNER: CONGRATS ", gs.winner.name, "!!!");
        } else {
            console.log(h[0].remainingCards.map(c => h[0].allCardsInHand[c]));
            console.log(h[0].playedCards.map(c => h[0].allCardsInHand[c]));
            // if (s.lastToPlay ) console.log(s.lastToPlay.name, ": ", s.lastToPlay.lastState);
            // if (s.envido) {
            //     const lastPlayerAnswer = s.envido.oponentPoints ? `${s.envido.oponentPoints} son mejores` : "son buenas";
            //     if(p1.startedPlaying) {
            //         console.log("p1: ", s.envido.currentPlayerPoints);
            //         console.log("p2: ", lastPlayerAnswer);
            //     } else {
            //         console.log("p1: ", lastPlayerAnswer);
            //         console.log("p2: ", s.envido.currentPlayerPoints);
            //     }
            // }
            console.log(h[1].playedCards.map(c => h[1].allCardsInHand[c]));
            console.log(h[1].remainingCards.map(c => h[1].allCardsInHand[c]));
        }
    }
    );
    const winner = await truco.playGame();
    console.log(winner);
    return websocketServer;
}

const server = app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
})
wrapExpress(server);
