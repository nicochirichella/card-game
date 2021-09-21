import { stat } from "fs";
import { Deck, shuffle } from "../../deck";
import { Hand } from "../../hand";
import { Card } from "../../card";
import { Suit } from "../../suit";
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
type Notifier = (state: RoundState, gs: TrucoGameState) => void

const cardOrder: Card[][] = [
    [{n: 1, suit: 'ESPADA'}],
    [{n:1, suit: 'BASTO'}],
    [{n: 7, suit: 'ESPADA'}],
    [{n: 7, suit: 'ORO'}],
    [{n: 3, suit: 'ESPADA'}, {n: 3, suit: 'BASTO'}, {n: 3, suit: 'ORO'}, {n: 3, suit: 'COPA'}],
    [{n: 2, suit: 'ESPADA'}, {n: 2, suit: 'BASTO'}, {n: 2, suit: 'ORO'}, {n: 2, suit: 'COPA'}],
    [{n: 1, suit: 'ORO'}, {n: 1, suit: 'COPA'}],
    [{n: 12, suit: 'ESPADA'}, {n: 12, suit: 'BASTO'}, {n: 12, suit: 'ORO'}, {n: 12, suit: 'COPA'}],
    [{n: 11, suit: 'ESPADA'}, {n: 11, suit: 'BASTO'}, {n: 11, suit: 'ORO'}, {n: 11, suit: 'COPA'}],
    [{n: 10, suit: 'ESPADA'}, {n: 10, suit: 'BASTO'}, {n: 10, suit: 'ORO'}, {n: 10, suit: 'COPA'}],
    [{n: 7, suit: 'BASTO'}, {n: 7, suit: 'COPA'}],
    [{n: 6, suit: 'ESPADA'}, {n: 6, suit: 'BASTO'}, {n: 6, suit: 'ORO'}, {n: 6, suit: 'COPA'}],
    [{n: 5, suit: 'ESPADA'}, {n: 5, suit: 'BASTO'}, {n: 5, suit: 'ORO'}, {n: 5, suit: 'COPA'}],
    [{n: 4, suit: 'ESPADA'}, {n: 4, suit: 'BASTO'}, {n: 4, suit: 'ORO'}, {n: 4, suit: 'COPA'}],
]

export class Truco extends TurnBasedGame<TrucoGameState> {
    private deck: Deck;
    private cr: CommandRequester;
    private notifier: Notifier;

    constructor(players: Player[], cr: CommandRequester, notifier: Notifier) {
        super(players);
        this.deck = this.initializeDeck();
        this.cr = cr;
        this.notifier = notifier;
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
        roundState.currentPlayer = this.players[nextIndex] as Player;
    }

    private getOponent(currentPlayer: Player): Player {
        let player =  this.players.find(p => p != currentPlayer) ?? this.players[1];
        return player as Player;
    }

    private getPlayCardOptions(roundState: RoundState) {
        let options = ['mazo'];
        if (roundState.envidoAvailable) {
            options = options.concat(['envido', 'realEnvido', 'faltaEnvido'])
        }

        options = options.concat(roundState.currentPlayer.hand.remainingCards.map(c => `play${c}`));
        if (!roundState.currentPlayer.lastTrucoPlayer) {
            switch(roundState.trucoPoints) {
                case 1:
                    options.push('truco')
                    break;
                case 2:
                    options.push('retruco')
                    break;
                case 3:
                    options.push('valeCuatro')
                    break;
                }
        }

        return options;
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
                envidoWinner = getEnvidoWinner(roundState.startedHandPlayer, this.getOponent(roundState.startedHandPlayer)) as Player;
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

    private decideHandWinner(currentPlayer: Player, oponent: Player, handNum: number) {
        const hand1 = currentPlayer.hand;
        const hand2 = oponent.hand;
        const card1 = hand1.allCardsInHand[hand1.playedCards[handNum]];
        const card2 = hand2.allCardsInHand[hand2.playedCards[handNum]];
        const card1Position = cardOrder.findIndex(a => a.find(c => c.n === card1.n && c.suit === card1.suit));
        const card2Position = cardOrder.findIndex(a => a.find(c => c.n === card2.n && c.suit === card2.suit));
        return card1Position - card2Position;
    }

    private playerWonTrucoRound(player: Player, roundState: RoundState){
        player.addScore(roundState.trucoPoints);
        roundState.state = 'finalPlayAction';
    }

    private setNextCardPlayer(player: Player, roundState: RoundState){
        roundState.state = 'playCard';
        roundState.nextCardPlayer = player;
    }

    private async playCard(roundState: RoundState) {
        const cardIx = parseInt(roundState.state.replace('play', ''));
        let currentPlayer = roundState.currentPlayer;
        currentPlayer.playCard(cardIx);
        let oponent = this.getOponent(currentPlayer);
        this.setNextCardPlayer(oponent, roundState);

        if (currentPlayer.hand.playedCards.length === oponent.hand.playedCards.length) {
            const handDiff = this.decideHandWinner(currentPlayer, oponent, roundState.handNum);
            if (handDiff < 0) {
                currentPlayer.handsWon++;
                if (roundState.handNum > 0 && currentPlayer.handsWon > oponent.handsWon) {
                    this.playerWonTrucoRound(currentPlayer, roundState);
                } else {
                    this.setNextCardPlayer(currentPlayer, roundState);
                }
            } else if (handDiff > 0) {
                oponent.handsWon++;
                if (roundState.handNum > 0 && oponent.handsWon > currentPlayer.handsWon) {
                    this.playerWonTrucoRound(oponent, roundState);
                } else {
                    this.setNextCardPlayer(oponent, roundState);
                }
            } else {
                if (roundState.handNum === 0) {
                    this.setNextCardPlayer(roundState.startedHandPlayer, roundState);
                } else if (roundState.handNum === 1) {
                    if (currentPlayer.handsWon > oponent.handsWon) {
                        this.playerWonTrucoRound(currentPlayer, roundState);
                    } else if (currentPlayer.handsWon < oponent.handsWon) {
                        this.playerWonTrucoRound(oponent, roundState);
                    } else {
                        this.setNextCardPlayer(roundState.startedHandPlayer, roundState);
                    }
                } else {
                    roundState.state = 'finalPlayAction';
                    const firstHandWinner = this.decideHandWinner(currentPlayer, oponent, 0);
                    if (firstHandWinner < 0) {
                        currentPlayer.addScore(roundState.trucoPoints);
                    } else if (firstHandWinner > 0) {
                        oponent.addScore(roundState.trucoPoints);
                    } else {
                        roundState.startedHandPlayer.addScore(roundState.trucoPoints);
                    }
                }
            }
            roundState.handNum++;
            roundState.envidoAvailable = false;
        } 
    }

    private async handleTrucoResponse(roundState: RoundState, trucoPoints: number){
        if (roundState.state === 'quiero') {
            roundState.trucoPoints = trucoPoints;
            roundState.state = 'playCard';
        } else if (roundState.state === 'noQuiero') {
            this.getOponent(roundState.currentPlayer).addScore(roundState.trucoPoints);
            roundState.state = 'finalPlayAction';
        }
    }

    private async setLastTrucoPlayer(roundState: RoundState){
        let oponent = this.getOponent(roundState.currentPlayer);
        roundState.currentPlayer.lastTrucoPlayer = false;
        oponent.lastTrucoPlayer = true;
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
            nextCardPlayer: this.players[firstPlayerIndex] as Player,
            currentPlayer: this.players[firstPlayerIndex] as Player,
            startedHandPlayer: this.players[firstPlayerIndex] as Player,
            handNum: 0
        }; 
        let options: string[];
        gameState.roundNumber++;
        roundState.state = 'playCard';

        await this.startHand(firstPlayerIndex);

        while (roundState.state != 'endHand') {
            await this.notifier(roundState, gameState);
            switch(roundState.state){
                case 'playCard': 
                    roundState.currentPlayer = roundState.nextCardPlayer;
                    options = this.getPlayCardOptions(roundState);
                    roundState.state = await this.getPlayerCommand(roundState.currentPlayer, options);
                    break;
                case isEnvidoState(roundState.state):
                    await this.handleEnvido(roundState);
                    break;
                case 'play0':
                case 'play1':
                case 'play2':
                    await this.playCard(roundState)
                    break;
                case 'truco':
                    if (!roundState.playerPendingTrucoResponse || roundState.playerPendingTrucoResponse !== roundState.currentPlayer){
                        this.nextPlayer(roundState);
                    }
                    
                    this.setLastTrucoPlayer(roundState);

                    options = ['quiero', 'noQuiero', 'retruco', 'mazo'];
                    if (roundState.envidoAvailable && roundState.currentPlayer.hand.playedCards.length === 0) {
                        options = options.concat(['envido','realEnvido','faltaEnvido']);
                    }

                    roundState.envidoAvailable = false;
                    roundState.state = await this.getPlayerCommand(roundState.currentPlayer, options);
                    if(isEnvidoState(roundState.state) === roundState.state) {
                        roundState.playerPendingTrucoResponse = roundState.currentPlayer;
                    } else {
                        this.handleTrucoResponse(roundState, 2);
                    }
                    break;
                case 'retruco':
                    this.nextPlayer(roundState);
                    roundState.trucoPoints = 2;
                    this.setLastTrucoPlayer(roundState);
                    options = ['quiero', 'noQuiero', 'valeCuatro', 'mazo'];
                    roundState.state = await this.getPlayerCommand(roundState.currentPlayer, options);
                    this.handleTrucoResponse(roundState, 3);
                    break;
                case 'valecuatro':
                    this.nextPlayer(roundState);
                    roundState.trucoPoints = 3;
                    this.setLastTrucoPlayer(roundState);
                    options = ['quiero', 'noQuiero', 'mazo'];
                    roundState.state = await this.getPlayerCommand(roundState.currentPlayer, options);
                    this.handleTrucoResponse(roundState, 4);
                    break;    
                case 'mazo':
                    this.nextPlayer(roundState);
                    roundState.currentPlayer.addScore(roundState.trucoPoints + roundState.envidoPoints);
                    roundState.state = 'endHand';
                    console.log('mazo');
                    break;
                case 'finalPlayAction':
                    roundState.state = 'endHand';
                    break;
                default:
                    console.log('bla')
            }
        }


        let playerWinning = this.players.find(p => p.score === Math.max(this.players[0].score, this.players[1].score)) || this.players[0];
        if (playerWinning.score === 30){
            gameState.winner = playerWinning as Player;
        }
        return gameState;
    }

    private initializeDeck(): Deck{
        let deck: Deck = { cards: [] };
        for (let i = 1; i < 12 ; i++){
            if (i !== 8 && i!== 9) {
                deck.cards.push({n: i, suit: 'ORO'});
                deck.cards.push({n: i, suit: 'COPA'});
                deck.cards.push({n: i, suit: 'ESPADA'});
                deck.cards.push({n: i, suit: 'BASTO'});
            }
        }
        return deck;
    }

}
