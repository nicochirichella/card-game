import { Card } from "./card";

export type Hand = {
    allCardsInHand: Card[]
    playedCards: number[]
    remainingCards: number[]
}