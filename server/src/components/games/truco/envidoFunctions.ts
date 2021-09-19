import { Hand } from '../../hand';
import { Player } from '../../player';
import { RoundState } from './types/roundState';

export const isEnvidoState = function (state: string): string {
    if (state.toLowerCase().includes('envido')) return state;
    return '';
}

export const getEnvidoOptions = function(envidoStates: string[], lastState: string): string[] {
    const envidoOrder = ['envido','realEnvido','faltaEnvido','quiero','noQuiero'];
    const ammountOfCantos = envidoStates.length;
    if ((ammountOfCantos === 1 && lastState === 'envido'))
        return envidoOrder;
    return envidoOrder.slice(envidoOrder.indexOf(lastState) + 1 , envidoOrder.length);
}

const getFaltaEnvidoPoints = function(): number {
    return 30;
}

const getPointsForDifferentsEnvidoCantos = function(envidoCanto: string){
    return envidoCanto === 'envido' ? 2
            : envidoCanto === 'realEnvido' ? 3
            : envidoCanto === 'faltaEnvido' ? getFaltaEnvidoPoints()
            : 0;
}

export const addEnvidoPointsToState = function(roundState: RoundState, lastState: string){
    let pointsToAdd = getPointsForDifferentsEnvidoCantos(lastState);
    if (roundState.envidoStates.length === 0) { roundState.envidoPoints= 1; } //first *envido
    else if (roundState.envidoPoints === 1 || lastState === 'faltaEnvido') {
        roundState.envidoPoints = pointsToAdd;
    } else {
        roundState.envidoPoints+= pointsToAdd;
    }
}

const countEnvido = function(hand: Hand): number {
    const suits: {
        [key: string]: number[];
      } = {
        'ORO': [],
        'COPA': [],
        'ESPADA': [],
        'BASTO': [],
    }
    let highestValueCard = 0;
    let envidoSuit = ''
    hand.allCardsInHand.forEach(c => {
        const n = c.n < 10 ? c.n : 0
        if (suits[c.suit].length === 0) {
            suits[c.suit].push(n);
        } else {
            if (n >= suits[c.suit][0]) {
                suits[c.suit].unshift(n);
            } else if (n <= suits[c.suit][suits[c.suit].length - 1]) {
                suits[c.suit].push(n);
            } else {
                suits[c.suit].splice(1, 0, n);
            }
        }
        if (suits[c.suit].length >= 2) {
            envidoSuit = c.suit;
        }
        if (c.n < 10 && c.n > highestValueCard) {
            highestValueCard = c.n;
        }
    });

    if (envidoSuit === '') {
        return highestValueCard;
    }

    return suits[envidoSuit][0] + suits[envidoSuit][1] + 20;
}

const compareEnvido = function(hand1: Hand, hand2: Hand): number {
    const pts1 = countEnvido(hand1);
    const pts2 = countEnvido(hand2);
    return pts1 - pts2;
}

export const getEnvidoWinner = function(firstHandPlayer: Player, secondHandPlayer: Player) : Player {
    return compareEnvido(firstHandPlayer.hand, secondHandPlayer.hand) >= 0 ? firstHandPlayer : secondHandPlayer;  
}