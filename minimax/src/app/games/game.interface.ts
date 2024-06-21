
export interface GameInterface {

	hasWinner(): number; // playerIndex = 0, 1

	isMovePossible(row: number, col: number): boolean;

	switchUser(): void;

}
