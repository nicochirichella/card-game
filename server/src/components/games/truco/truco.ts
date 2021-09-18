import { Deck } from "../../deck";
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

    async playRound(gameState: TrucoGameState): Promise<TrucoGameState> {
        gameState.roundNumber++;
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
