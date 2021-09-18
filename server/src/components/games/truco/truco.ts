import { Deck, shuffle } from "../../deck";
import { Hand } from "../../hand";
import { TurnBasedGame } from "../../turn_based_game";
import { TrucoPlayer as Player } from './trucoPlayer';

type TrucoGameState = {
    players: Player[],
    roundNumber: number,
    winner: Player | null
}

export class Truco extends TurnBasedGame<TrucoGameState> {
    private deck: Deck;

    constructor(players: Player[]) {
        super(players);
        this.deck = this.initializeDeck();
        console.log(this.deck);
    }

    getInitialGameState(players: Player[]): TrucoGameState {
        return {
            players: players,
            roundNumber: 0,
            winner: null
        }
    }

    private async dealCards(): Promise<Hand[]> {
        const shuffleDeck: Deck = shuffle(this.deck);
        const hands: Hand[] = this.players.map(p => {
            return {allCardsInHand: [], playedCards: [], remainingCards: [0,1,2]}
        });

        const numberOfPlayers = this.players.length;
        const cardsInHand = 3;
        for (let i=0; i < numberOfPlayers * cardsInHand; i++){
            hands[i%numberOfPlayers].allCardsInHand.push(shuffleDeck.cards[i]);
        }

        return hands;
    }

    private async startHand(firstPlayerIndex: number) {
        let hands: Hand[] = await this.dealCards();
        await Promise.allSettled(this.players.map((p, index) => p.startHand(hands[index])));
        this.players[firstPlayerIndex].playerTurn = true;

    }

    async playRound(gameState: TrucoGameState): Promise<TrucoGameState> {
        const firstPlayerIndex = gameState.roundNumber % this.players.length;
        gameState.roundNumber++;
        await this.startHand(firstPlayerIndex);
        
        if (gameState.roundNumber === 5){
            gameState.winner = this.players[0];
        }
        return gameState;
    }

    private initializeDeck(): Deck{
        let deck: Deck = { cards: [] };
        for (let i = 0; i < 12 ; i++){
            deck.cards.push({n: i, suit: 'ORO'});
            deck.cards.push({n: i, suit: 'COPA'});
            deck.cards.push({n: i, suit: 'ESPADA'});
            deck.cards.push({n: i, suit: 'BASTO'});
        }
        return deck;
    }

}
