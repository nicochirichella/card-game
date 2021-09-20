import { Hand } from "../../hand";
import { Player } from "../../player";

const MAX_TRUCO_POINTS = 30;
export class TrucoPlayer extends Player {
    public lastTrucoPlayer: boolean;
    public handsWon: number;
    constructor(name: string, url: string){
        super(name, url);
        this.lastTrucoPlayer = false;
        this.handsWon = 0;
    }

    public async startHand(hand: Hand) {
        this.hand = hand;
        this.playerTurn = false;
        this.lastTrucoPlayer = false;
        this.handsWon = 0;
    }

    public addScore(points: number){
        this.score = Math.min(this.score + points, MAX_TRUCO_POINTS);
    }

    public playCard(cardId: number){
        this.hand.playedCards.push(cardId);
        this.hand.remainingCards = this.hand.remainingCards.filter(c => c != cardId);
    }
}