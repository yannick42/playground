import { GameInterface } from './game.interface';
import { factorialize } from '../utility.functions';

/*
TODO:
=====
- la ligne du haut n'est pas active ?!


*/

export class Connect4 implements GameInterface {

	name = 'Connect4';

	players: string[] = ['Human', 'AI'];
	playerIndex: number = 0;
	marks: string[] = ['o', 'x'];

	nbRows: number;
	nbCols: number;
	winningSize: number;
	
	filledSquares = 0;


	board: string[][] = [];
	height: number[]; // = next available slot/row -> eg. 0=empty & nbRows-1=filled

	constructor(nbRows = 3, nbCols = 3, winningSize = 3) {
		this.nbRows = nbRows;
		this.nbCols = nbCols;
		this.winningSize = winningSize;
		this.height = (new Array(nbCols)).fill(0);
		this.board = Array.from({ length: nbRows }, () => Array(nbCols).fill('-'));
	}

	get position() {
		return this.board.map(row => row.join()).join('|');
	}

	get currentPlayer() {
		return this.players[this.playerIndex];
	}

	get totalMoves() {
		return null; //Math.pow(5, this.nbRows * this.nbCols);
	}

	won(playerIndex: number) {
		const winnerIndex = this.hasWinner();
		//console.log("won:", winnerIndex);

		if(winnerIndex === -1) { // no winner yet
			return 0;
		}

		return (winnerIndex == playerIndex ? +1 : -1) * (this.nbRows * this.nbCols - this.filledSquares)**2;
	}

	switchUser() {
		this.playerIndex = this.playerIndex === 0 ? 1 : 0;	
	}

	test(): void {

		this.board = [
			['o', 'o', '-', '-', '-'],
			['-', 'o', 'o', '-', 'x'],
			['-', '-', '-', 'x', '-'],
			['-', '-', 'x', 'o', 'o']
		];

		console.log(this.hasWinner());
	}

	/**
	 * @return winner index (or -1 if no winner yet or at all)
	 */
	hasWinner(): number /*-1|0|1*/ {

		// detect a "line" of 4 'o' or 'x'

			//
			// vertically
			//
			for(let x = 0; x < this.nbCols; x++) {
				let streakSize = 0;
				let previousMark = '-';
				for(let y = this.nbRows - 1; y >= 0; y--) {
					const mark = this.board[y][x];

					if(mark == '-' || previousMark !== mark) {
						streakSize = 0; // reset...
					}
					
					streakSize += 1;

					// optimization
					//if(y < this.winningSize - 1) {
					//	break; // no need to continue
					//}
					
					if(streakSize === this.winningSize) {
						//console.log("winning vert. streak of", this.winningSize, "by", mark);
						return this.marks.indexOf(mark);
					}
					
					previousMark = mark;
				}
			}

			//
			// horizontally
			//
			for(let x = 0; x < this.nbRows; x++) {
				let streakSize = 0;
				let previousMark = '-';
				for(let y = 0; y < this.nbCols; y++) {
					const mark = this.board[x][y];

					if(mark == '-' || previousMark !== mark) {
						streakSize = 0; // reset...
					}
					streakSize += 1;
						
					// optimization
					//if(this.nbCols-1 - y < this.winningSize) {
					//	break; // no need to continue
					//}

					if(streakSize === this.winningSize) {
						//console.log("winning horiz. streak of", this.winningSize, "by", mark);
						return this.marks.indexOf(mark);
					}

					previousMark = mark;
				}
			}

			// diagonales !
				// up
				for (let x = this.nbRows - this.winningSize; x >= - this.nbRows + this.winningSize - 1; x--) {
					let streakSize = 0;
					let previousMark = '-';
					let a = 0;
					for(let y = 0; y < this.nbCols; y++) {

						if(x+a < 0 || x+a >= this.nbRows) {
							a += 1;
							streakSize = 0;
							continue;
						}
					
						const mark = this.board[x+a][y];
						
						if(mark == '-' || previousMark !== mark) {
							streakSize = 0; // reset
						}

						streakSize += 1;
						
						if(streakSize === this.winningSize) {
							//console.log("winning up diagonal streak of", this.winningSize, "by", mark);
							//console.log(this.position);
							return this.marks.indexOf(mark);
						}

						previousMark = mark;
						a += 1;
					}
				}
			

				// down
				for (let x = this.nbRows - 1 + this.winningSize - 1; x > this.nbRows - this.winningSize; x--) {
					let streakSize = 0;
					let previousMark = '-';
					let a = 0;
					for(let y = 0; y < this.nbCols; y++) {

						if(x+a < 0 || x+a >= this.nbRows) {
							a -= 1;
							streakSize = 0;
							continue;
						}
					
						const mark = this.board[x+a][y];
						
						if(mark == '-' || previousMark !== mark) {
							streakSize = 0; // reset
						}

						streakSize += 1;
						
						if(streakSize === this.winningSize) {
							//console.log("winning down diagonal streak of", this.winningSize, "by", mark);
							//console.log(this.position);
							return this.marks.indexOf(mark);
						}

						previousMark = mark;
						a -= 1;
					}
				}

		return -1;
	}

	/**
	 * GameInterface !
	 * /!\ row is not taken into account
	 */
	isMovePossible(row: number, col: number): boolean {
		return this.height[col] <= this.nbRows - 1;
	}

	/**
	 * /!\ row is not taken into account, it will find right row the based on "gravity"...
	 */
	play(row:number, col: number): boolean|number {

		if(!this.isMovePossible(row, col)) { // check if filled column (row not used...)
			return false;
		} else { // OK

			// add user's mark to the board (with gravity...)
			row = this.height[col]; // into next available row 
			
			//console.log("(PLAY) row:", row, "col:", col);
			
			// increment height... if possible
			this.height[col] += 1;
			this.board[row][col] = this.marks[this.playerIndex];
			this.filledSquares += 1;

			// check if any winner
			const value = this.hasWinner();

			return value;
		}

	}

	unplay(row: number, col: number) {
		const truerow = this.height[col] - 1;
		//console.log("(UNPLAY) row:", row, "true row:", truerow, "col:", col);
		if(truerow >= 0) {
			this.board[truerow][col] = '-';
			this.height[col] = this.height[col] >= 1 ? this.height[col]-1 : 0;
			this.filledSquares -= 1;
		}
	}

	getMoves(): number[][] {
		const moves = [];
		for(let x = 0; x < this.nbCols; x++) {
			if(this.height[x] < this.nbRows) { // if less than 6, the height represent the next available index (max = 5)
				moves.push([this.height[x], x]);
			}
		}
		return moves.sort(() => 0.5 - Math.random());
	}

}
