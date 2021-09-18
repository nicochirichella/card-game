import { Card } from './card'
export type Deck = {
    cards: Card[]
};

export const shuffle = (deck: Deck): Deck => {
    let currentIndex = deck.cards.length,  randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [deck.cards[currentIndex], deck.cards[randomIndex]] = [
      deck.cards[randomIndex], deck.cards[currentIndex]];
  }

  return deck;
}