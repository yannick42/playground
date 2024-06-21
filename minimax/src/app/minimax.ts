import { factorialize } from './utility.functions';
import { Tree, TreeNode } from './tree';

export class MiniMax {

	depth;

	constructor(depth = 0) {
		this.depth = depth;
	}

	minimax(game: any, use_alpha_beta=true, console_log=false) {
	
		let value;
		let a = 0; // number 
		let skipped = 0;

		function minmax(moves: [], depth: number, alpha: number, beta: number, maximizingPlayer: boolean) {

			const DEBUG = console_log;

			if(DEBUG) { console.log("depth:", depth, "-", game.position); }

			if(a % 10000 === 0) {
				console.log("a:", a);
			}

			if(depth === 0 || [0, 1].includes(game.hasWinner())) {

				a += 1; // count only leafs (and terminal nodes = ended games)
			
				const skip = depth ? factorialize(depth - 1) : 0; // if depth != 0 -> all other impossible moves because game finished before that...

				if(depth != 0) {
					if(DEBUG) console.error(skip + " skipped at depth=", depth, " : ", game.position);
				}
				skipped += skip;
				
				if(DEBUG) { console.log("game.hasWinner():", game.hasWinner(), "depth", depth, "currentPlayer:", game.currentPlayer, game.won(game.playerIndex)); }
				
				let val = game.won(game.playerIndex);
				if(
					(game.hasWinner() === 1 && game.playerIndex === 0)
				) {
					val *= -1; // invert as AI wins : +1 (maximization for AI player)
				}

				if(DEBUG) {
					console.log("depth:", depth, "currentPlayer:", game.currentPlayer, game.position, val);
				}

				// stop
				return [val, []];
				
			}
			
			if(maximizingPlayer) {
				let maxEval = -Infinity;
				let maxMove: number[] = [];

				moves.every((move, index) => {
						
					game.play(move[0], move[1]); // Apply move (virtually)
					game.switchUser();		

					const pos = game.position;
					//const parentKey = game.position;
					//searchTree.insert(parentKey, pos, '0');
					const moves_ = game.getMoves();
						
					const t = minmax(moves_, depth - 1, alpha, beta, false)
						
					const eval_ = t[0] as number;
					const bestMove = t[1] as number[];
					//const node = searchTree.find(pos);
					//if(node) node.value = eval_.toString();
						
					game.unplay(move[0], move[1]); // UNDO
					game.switchUser();
						
					if(maxEval < eval_) {
						maxEval = eval_;
						maxMove = move;
						alpha = Math.max(alpha, maxEval)
					}

					if(use_alpha_beta) {
						if(beta <= maxEval) {
							const remainingNodes = moves.length-1-index;
							const skip = remainingNodes * factorialize(depth - 1);
							if(DEBUG) console.log("alpha-beta pruning at depth=", depth, "->", moves.length-1 - index, "! = ", skip);
							//skipped += skip;
							//a += skip;
							return false;
						}
					}
					return true;
				});
				if(DEBUG) {
					console.warn("maximizing", game.currentPlayer, "at depth", depth, "maxEval:", maxEval, maxMove);
				}
				return [maxEval, maxMove];
					
			} else {
				let minEval = Infinity,
						minMove: number[] = [];

				moves.every((move, index) => {
						
					game.play(move[0], move[1]); // Apply move (virtually)
					game.switchUser();		

					const pos = game.position;

					//const parentKey = game.position;
					//searchTree.insert(parentKey, pos, '0');
	
					const moves_ = game.getMoves();
					const [eval_, bestMove] = minmax(moves_, depth - 1, alpha, beta, true)
						
					//const node = searchTree.find(pos);
					//if(node) node.value = eval_.toString();
					
					game.unplay(move[0], move[1]); // UNDO
					game.switchUser();		

					if(minEval > eval_) {
						minEval = eval_;
						minMove = move;
						beta = Math.min(beta, minEval)
					}

					if(use_alpha_beta) {
						if(minEval <= alpha) {
							const remainingNodes = moves.length-1-index;
							const skip = remainingNodes * factorialize(depth - 1); // TODO: le skip doit dépendre du branching factor de chaque depth "b" ...... pas juste "m" (dans O(b^m))
							if(DEBUG) console.log("alpha-beta pruning at depth=", depth, "->", moves.length-1 - index, "! = ", skip);
							//skipped += skip;
							//a += skip;
							return false; // stop forEach
						}
					}
					return true; // Ok, next
				});
				if(DEBUG) {
					console.warn("minimizing", game.currentPlayer, "at depth", depth, "minEval:", minEval, minMove);
				}
				return [minEval, minMove];
			}
		}

		//const searchTree = new Tree(game.position, '0');
		//const parent = searchTree.root;

		const moves = game.getMoves();
		console.log("moves:", moves);
		
		console.time('minimax');
		const connect4Depth = this.depth; //game.nbRows * game.nbCols - game.filledSquares +1;
		console.warn("connect4Depth:", connect4Depth);
		const depth = game.name === 'TicTacToe' ? moves.length /* 8... */ : connect4Depth;
		let [eval_, bestMove] = minmax(moves, depth, -Infinity, Infinity, true);
		console.timeEnd('minimax');

		console.log("found : ", bestMove);
		console.log("EVAL = ", eval_);

		if(bestMove[0] === undefined) {
			console.log("No move possible : choose one randomly !");
			const moves_ = game.getMoves();
			bestMove = moves_[Math.floor(Math.random() * moves_.length)];
		}

		//console.log(searchTree);
		console.log(a, "minimax calls");
		console.log("bestMove:", bestMove[0], bestMove[1], "among:", game.getMoves())

		value = bestMove as number[];

		if(value.length) {
			return [value, a, skipped];
		} else {
			console.log("NO MOVE AVAILABLE ?!");
		}

		return [null, null, null];
	}

}
