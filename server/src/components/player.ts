import { Hand } from "./hand";

export abstract class Player {
    public name: string;
    public url: string;
    public hand: Hand;
    public playerTurn: boolean;
    public score: number;

    constructor(name: string, url: string){
        this.name = name;
        this.url = url;
        this.hand = {allCardsInHand: [], playedCards: [], remainingCards: []};
        this.playerTurn = false;
        this.score = 0;
    }

    abstract startHand(hand: Hand): any;
    abstract addScore(points: number): void;
}