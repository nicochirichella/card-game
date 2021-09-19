import { TrucoPlayer as Player } from "../trucoPlayer";
export type RoundState = {
    state: string,
    trucoPoints: number,
    envidoPoints: number,
    envidoStates: string[]
    envidoAvailable: boolean,
    playerPendingTrucoResponse?: Player,
    lastToPlay?: Player,
    currentPlayer: Player,
    startedHandPlayer: Player
};