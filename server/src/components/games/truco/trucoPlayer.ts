import { Hand } from "../../hand";
import { Player } from "../../player";

export class TrucoPlayer extends Player {
    constructor(name: string, url: string){
        super(name, url);
    }

    public async startHand(hand: Hand) {
        this.hand = hand;
        this.playerTurn = false;
    }
}