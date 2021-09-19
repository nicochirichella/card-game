import { stat } from "fs";
import { Deck, shuffle } from "../../deck";
import { Hand } from "../../hand";
import { TurnBasedGame } from "../../turn_based_game";
import { TrucoPlayer as Player } from './trucoPlayer';
import { RoundState } from './types/roundState';
import { isEnvidoState, 
    addEnvidoPointsToState,
    getEnvidoOptions,
    getEnvidoWinner} from './envidoFunctions';

type TrucoGameState = {
    players: Player[],
    roundNumber: number,
    winner: Player | null
}

type CommandRequester = (p: Player, options: string[]) => Promise<string>

export class Truco extends TurnBasedGame<TrucoGameState> {
    private deck: Deck;
    private cr: CommandRequester;

    constructor(players: Player[], cr: CommandRequester) {
        super(players);
        this.deck = this.initializeDeck();
        this.cr = cr;
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

    private async getPlayerCommand(player: Player, options: string[]): Promise<string> {
        const selectedOption = await this.cr(player, options);
        if (options.includes(selectedOption)) {
            return selectedOption;
        }

        return 'mazo';
    }

    private nextPlayer(roundState: RoundState){
        const nextIndex = (this.players.indexOf(roundState.currentPlayer) + 1) % this.players.length;
        roundState.currentPlayer = this.players[nextIndex];
    }

    private getOponent(currentPlayer: Player): Player {
        return this.players.find(p => p != currentPlayer) ?? this.players[1];
    }
   
    private async handleEnvido(roundState: RoundState) {
        roundState.envidoAvailable = false;
        addEnvidoPointsToState(roundState, roundState.envidoStates[roundState.envidoStates.length-1]);
        roundState.envidoStates.push(roundState.state);
        this.nextPlayer(roundState);

        const envidoOptions = getEnvidoOptions(roundState.envidoStates, roundState.state);
        roundState.state = await this.getPlayerCommand(roundState.currentPlayer, envidoOptions);

        if(['quiero', 'noQuiero'].includes(roundState.state)) {
            let envidoWinner: Player;
            if (roundState.state === 'quiero') {
                addEnvidoPointsToState(roundState, roundState.envidoStates[roundState.envidoStates.length-1]);
                envidoWinner = getEnvidoWinner(roundState.startedHandPlayer, this.getOponent(roundState.startedHandPlayer));
            } else {
                envidoWinner = this.getOponent(roundState.currentPlayer);
            } 
            
            envidoWinner.addScore(roundState.envidoPoints);
            console.log(envidoWinner);
            roundState.envidoPoints = 0;
            if (!roundState.playerPendingTrucoResponse) {
                roundState.state = 'playCard';
            } else {
                roundState.state = 'truco';
            }
        }
    }


    async playRound(gameState: TrucoGameState): Promise<TrucoGameState> {
        const firstPlayerIndex = gameState.roundNumber % this.players.length;
        const roundState: RoundState = {
            state: 'playCard',
            trucoPoints: 1,
            envidoPoints: 1,
            envidoStates: [],
            envidoAvailable: true,
            playerPendingTrucoResponse: undefined,
            lastToPlay: undefined,
            currentPlayer: this.players[firstPlayerIndex] as Player,
            startedHandPlayer: this.players[firstPlayerIndex] as Player
        }; 
        gameState.roundNumber++;
        roundState.state = 'playCard';

        await this.startHand(firstPlayerIndex);

        console.log(roundState.currentPlayer.score);
        console.log(this.getOponent(roundState.currentPlayer).score);

        while (roundState.state != 'endHand') {
            switch(roundState.state){
                case 'playCard': 
                    console.log('play card state');
                    roundState.state = await this.getPlayerCommand(roundState.currentPlayer, ['envido', 'truco', 'mazo']);
                    break;
                case isEnvidoState(roundState.state):
                    await this.handleEnvido(roundState);
                    break;
                case 'truco':
                    console.log('truco state');
                    roundState.state = 'endHand';
                    break;
                
                case 'mazo':
                    this.nextPlayer(roundState);
                    roundState.currentPlayer.addScore(roundState.trucoPoints + roundState.envidoPoints);
                    roundState.state = 'endHand';
                    console.log('mazo');
                    break;
                default:
                    console.log('bla')
            }
        }


        let playerWinning = this.players.find(p => p.score === Math.max(this.players[0].score, this.players[1].score)) || this.players[0];
        if (playerWinning.score === 30){
            gameState.winner = playerWinning;
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
