import { Hand } from "../../hand";
import { Player } from "../../player";

const MAX_TRUCO_POINTS = 30;
export class TrucoPlayer extends Player {
    constructor(name: string, url: string){
        super(name, url);
    }

    public async startHand(hand: Hand) {
        this.hand = hand;
        this.playerTurn = false;
    }

    public addScore(points: number){
        this.score = Math.min(this.score + points, MAX_TRUCO_POINTS);
    }
}