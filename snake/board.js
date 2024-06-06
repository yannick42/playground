import { randInt } from './helper.js';
import { fillSquare } from './canvas.helper.js';

export const LEFT = 0;
export const UP = 1;
export const RIGHT = 2;
export const DOWN = 3;

export class Board {

    ctx;
    squareSize;
    nbCells;
    players = [];
    apples = [];
    appleColor = 'red';

    constructor(ctx, squareSize, nbCells) {
        this.ctx = ctx;
        this.squareSize = squareSize;
        this.nbCells = nbCells;
    }

    addPlayer(player) {
        this.players.push(player);
    }

    getPlayer(name) {
        return this.players.find(player => player.name == name);
    }

    isEmpty(posX, posY) {
        const isInsideBoard = posX >= 0 && posX < this.nbCells && posY >= 0 && posY < this.nbCells;
        const noPlayerHere = this.players.every(player => !player.body.map(p => p[0]+"-"+p[1]).includes(posX+'-'+posY));
        //console.log("noPlayerHere:", noPlayerHere);
        return isInsideBoard && noPlayerHere;
    }

    getRandomCell() {
        return [randInt(0, this.nbCells - 1), randInt(0, this.nbCells - 1)];
    }

    noApple(X, Y) {
        return this.apples.every(apple => apple[0] !== X && apple[1] !== Y);
    }

    spawnApple(number=1) {
        //console.log("add", number, "apple(s)");
        for(let i = 0; i < number; i++) {
            let attempts = 0;
            let found = false;

            while(!found && attempts < 100) {
                const [X, Y] = this.getRandomCell();
                attempts += 1;

                if(this.isEmpty(X, Y) && this.noApple(X, Y)) { // if no player (and inside board) and no other apples
                    this.apples.push([X, Y]);
                    fillSquare(this.ctx, X, Y, this.appleColor, this.squareSize, 2);
                    found = true;
                }
            }
        }
    }

}
