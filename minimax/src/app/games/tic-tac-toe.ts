import { GameInterface } from './game.interface';

//export type BoardIndex = 1|2|3;

export class TicTacToe implements GameInterface {

	name = 'TicTacToe';

	players: string[] = ['Human', 'AI'];
	playerIndex: number = 0;
	marks: string[] = ['O', 'x'];
	board: string[][] = [
		['', '', ''],
		['', '', ''],
		['', '', ''],
	];

	get position() {
		return this.board.map(row => row.join()).join('|');
	}

	get currentPlayer() {
		return this.players[this.playerIndex];
	}

	isMovePossible(row: number, col: number): boolean {
		return this.getMoves().find([row, col]) !== -1;
	}

	won(playerIndex: number) {
		const winnerIndex = this.hasWinner();
		//console.log("won:", winnerIndex);

		if(winnerIndex === -1) {
			return 0;
		}
		
		return winnerIndex === playerIndex ? 1 : -1;
	}

	switchUser() {
		this.playerIndex = this.playerIndex === 0 ? 1 : 0;
	}

	/**
	 * Search if a line is done
	 * @return winner index (or -1 if no winner yet or at all)
	 */
	hasWinner(): number {

		// horizontal lines
		if(this.board[0][0] !== '' && this.board[0][0] === this.board[0][1] && this.board[0][1] === this.board[0][2]) return this.marks.indexOf(this.board[0][0])
		if(this.board[1][0] !== '' && this.board[1][0] === this.board[1][1] && this.board[1][1] === this.board[1][2]) return this.marks.indexOf(this.board[1][0])
		if(this.board[2][0] !== '' && this.board[2][0] === this.board[2][1] && this.board[2][1] === this.board[2][2]) return this.marks.indexOf(this.board[2][0])

		// vertical lines
		if(this.board[0][0] !== '' && this.board[0][0] === this.board[1][0] && this.board[1][0] === this.board[2][0]) return this.marks.indexOf(this.board[0][0])
		if(this.board[0][1] !== '' && this.board[0][1] === this.board[1][1] && this.board[1][1] === this.board[2][1]) return this.marks.indexOf(this.board[0][1])
		if(this.board[0][2] !== '' && this.board[0][2] === this.board[1][2] && this.board[1][2] === this.board[2][2]) return this.marks.indexOf(this.board[0][2])

		// 2 diagonales
		if(this.board[0][0] !== '' && this.board[0][0] === this.board[1][1] && this.board[1][1] === this.board[2][2]) return this.marks.indexOf(this.board[0][0])
		if(this.board[0][2] !== '' && this.board[0][2] === this.board[1][1] && this.board[1][1] === this.board[2][0]) return this.marks.indexOf(this.board[0][2])

		return -1;
	}

	play(row: number, col: number) {
		if(this.board[row-1][col-1] === '') { // empty: OK
			// add user's mark to the board
			this.board[row-1][col-1] = this.marks[this.playerIndex];

			// check if any winner
			const value = this.hasWinner();

			return value;
		} else {
			console.log("Error: place already taken !");
		}
		return false;
	}

	unplay(row: number, col: number) {
		this.board[row-1][col-1] = '';
	}

	getMoves() {
		const availableMoves: any = [];
		this.board.forEach((row, i) => {
			row.forEach((value, j) => {
				if(value === '') {
					availableMoves.push([i+1, j+1]);
				}
			});
		});
		return availableMoves;
	}

	getRandomMove() {
		const availableMoves = this.getMoves();
		return availableMoves[Math.floor(Math.random()*availableMoves.length)];
	}

}
