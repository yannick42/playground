import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { TicTacToe } from './games/tic-tac-toe';
import { Connect4 } from './games/connect4';
import { MiniMax } from './minimax';
//import { GameInterface } from './games/game.interface';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  title = 'minimax';
	game: TicTacToe;
	game2: Connect4;
	minimax;
	message = '<span style="color: blue;">Your turn</span>';
	debug: string[] = [];
	debug2: string = '';
	use_alpha_beta = true;
	start_with_ai = false;
	console_log = false;

	connect4_row = 4;
	connect4_col = 5;
	connect4_streak = 3;
	depth;

	constructor() {
	 	this.depth = 4*5 - (this.start_with_ai ? 0 : 1);
		this.game = new TicTacToe();
		this.game2 = new Connect4(this.connect4_row, this.connect4_col, this.connect4_streak);
		this.minimax = new MiniMax(this.depth);
	}

	ngOnInit() { }

	restart() {

		this.debug = [];
		this.debug2 = '';

		// RESTART
	 	this.depth = 4*5 - (this.start_with_ai ? 0 : 1);
		this.game = new TicTacToe();
		this.game2 = new Connect4(this.connect4_row, this.connect4_col, this.connect4_streak);
		this.minimax = new MiniMax(this.depth);

		//this.game2.test();
		
		if(!this.start_with_ai) {
			this.message = '<span style="color: blue;">Your turn</span>';
		} else {
			this.game.switchUser();
			this.playAI(this.game);
			this.game2.switchUser();
			this.playAI(this.game2);
		}
		
	}

	selectTicTacToe(row: number, col: number) {
	
		if(this.game.currentPlayer == 'Human' && this.game.hasWinner() === -1)
		{
			const value = this.game.play(row, col);
			if(!value) return; // can't play this ?
			this.debug.push("<hr/><b>you played</b> : ("+row+", "+col+")<hr/>");

			if(value === 0) {
				this.message = '<span style="color: green;">You win 😁!</span>';
				return;
			} else {
				// no winner yet ?
		
				// change user
				this.game.playerIndex = this.game.playerIndex === 0 ? 1 : 0;			

				this.message = '...thinking...'
			}

			//
			// AI plays
			//


			setTimeout(() => {
				this.playAI(this.game);
			});

			/*
			setTimeout(() => {

				const start = window.performance.now();
				const [value2, move, nbMovePondered, skipped] = this.minimax.minimax(this.game, this.use_alpha_beta, this.console_log);
				
				const end = window.performance.now();
				const time = end - start;
				
				// change user
				this.game.playerIndex = this.game.playerIndex === 0 ? 1 : 0;			
	
				if (value2 === 1) {
					this.message = '<span style="color: red;">Minimax wins 🥲</span>';
					return;
				} else {
					// no winner yet
					if(nbMovePondered) {
						this.debug.push("<b>" + nbMovePondered + "</b> moves analyzed and " + skipped + " skipped because of endgame and not &alpha;-&beta; pruning (in " + Math.round(time) + " ms) -- AI played ("+move[0]+", "+move[1]+")");
						this.debug2 = this.debug.join('<br/>');
						this.message = '<span style="color: blue;">Your turn</span>';
						
					} else {
						this.message = '<span style="color: blue;">Draw!</span>';
					}
				}
			});
			*/


		} else {
			// not your turn !
			console.log("/!\\ current user is", this.game.currentPlayer);
		}
	}

	selectColumn(col: number) {
		
		if(this.game2.currentPlayer == 'Human' && this.game2.hasWinner() === -1)
		{
		
			const value = this.game2.play(0, col);
			if(value === false) return; // can't play this ?
			this.debug.push("you played column "+(col + 1)+"th");

			console.log("value:", value);

			if(value === 0) {
				this.message = '<span style="color: green;">You win! 😁</span>';
				return;
			} else {
				// no winner yet ?
		
				// change user
				this.game2.playerIndex = this.game2.playerIndex === 0 ? 1 : 0;			

				this.message = '...thinking...'
			}

			//
			// AI plays
			//

			setTimeout(() => {
				this.playAI(this.game2);
			});


		} else {
			// not your turn !
			console.log("/!\\ current user is", this.game2.currentPlayer);
		}


		
	}

	playAI(game: TicTacToe|Connect4) {

		const start = window.performance.now();
		const [move, nbMovePondered, skipped] = this.minimax.minimax(game, this.use_alpha_beta, this.console_log);

		const move0 = (move as number[])[0] ?? null;
		const move1 = (move as number[])[1] ?? null;
		const nbMovePondered_ = (nbMovePondered as number) ?? 0;
		const skipped_ = (skipped as number) ?? 0;

		let value2;
		if(move0 !== null && move1 !== null) value2 = game.play(move0, move1)
		
		console.warn(value2, move, nbMovePondered);
		
		const end = window.performance.now();
		const time = end - start;
		
		game.switchUser();
		
		if (value2 === 1)
		{
			this.message = '<span style="color: red;">Minimax wins 🥲</span>';
			return;
		}
		else
		{
			// no winner yet ? -> value2 = -1
			if(nbMovePondered)
			{
				this.debug.push("<b>" + nbMovePondered + "</b> moves analyzed and " + skipped + " skipped because of endgame and not &alpha;-&beta; pruning (in " + Math.round(time) + " ms) -- AI played ("+move0+", "+move1+")");
				this.debug.push("<mark>" + (nbMovePondered_ + skipped_) + " moves</mark>");
				this.debug2 = this.debug.join('<br/>');
				
				this.message = '<span style="color: blue;">Your turn</span>';
			} else {
				this.message = '<span style="color: blue;">Draw!</span>';
			}
		}
	}

}
