import { Hand } from "./hand";

export abstract class Player {
    protected name: string;
    protected url: string;
    protected hand: Hand;

    constructor(name: string, url: string){
        this.name = name;
        this.url = url;
        this.hand = {allCardsInHand: [], playedCards: [], remainingCards: []};
    }
}