import { Player } from './player';

type GameState = {
    winner: Player | null
}
const DELAY = 1000; //delay time in ms

export abstract class TurnBasedGame<GS extends GameState> {
    protected players: Player[];

    constructor(players: Player[]) {
        this.players = players;
    }

    async playGame(): Promise<Player> {
        // const validPlayers = await this.startGame();
        // if (validPlayers.length === 1) {
        //     const winner = validPlayers[0]
        //     console.log(`Only 1 player ready to play, declaring ${winner.name} winner by default`);
        //     await this.declarePlayerWinnerByDefault(winner);
        //     return winner;
        // } --------------- NOTIFY GAME STARTED -----------------

        const validPlayers = this.players;

        const randomizedPlayerOrder = validPlayers.sort((a, b) => Math.random() - Math.random());
        const winner = await this.playTurns(randomizedPlayerOrder);
        // await this.endGame(winner);  --------------- NOTIFY GAME ENDED -----------------
        return winner;
    }

    async playTurns(players: Player[]): Promise<Player> {
        let gameState = this.getInitialGameState(players);
        while (gameState.winner === null) {
            gameState = await this.playRound(gameState)
            await this.waitForNextRound();
        }

        return gameState.winner;
    }

    private waitForNextRound(): Promise<void> {
        return new Promise(resolve => setTimeout(() => resolve(), DELAY));
    }

    abstract getInitialGameState(players: Player[]): GS;
    abstract playRound(gameState: GS): Promise<GS>;
}