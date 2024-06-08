import { fillSquare } from './canvas.helper.js';
import { Board, LEFT, UP, RIGHT, DOWN } from './board.js';

export class Snake {
    // head position
    posX;
    posY;
    board;
    currentDirection;
    color;
    name;
    method; // control method

    body = [];

    constructor(board, posX, posY, color, name = 'player', method='randomWalk') {
        this.board = board;
        this.color = color;
        this.name = name;
        this.method = method;
        //console.log("snake created at", posX, posY);
        this.body.push([posX, posY]);
    }

    setMethod(method) {
        this.method = method;
    }

    show() {
        // TODO: if moved (and no eat) hide last part of the body ?
        const bodySize = this.body.length;
        this.body.forEach((pos, i) => fillSquare(this.board.ctx, pos[0], pos[1], i == bodySize-1 ? 'dark'+this.color : this.color, this.board.squareSize));
    }

    hide() {
        const bodySize = this.body.length;
        this.body.forEach((pos, i) => fillSquare(this.board.ctx, pos[0], pos[1], 'lightgray', this.board.squareSize));
    }

    head() {
        return this.body[this.body.length - 1];
    }

    shouldGrowAgainBy = 0;
    move(dir) {
        const oldestBodypart = this.body[0];
        const isMovePossible = this.grow(dir);
        if(isMovePossible) {
            
            const newestBodypart = this.head();
            const appleReached = this.board.apples.map(p => p[0]+'-'+p[1]).includes(newestBodypart[0]+'-'+newestBodypart[1]);

            if(
                this.shouldGrowAgainBy == 0 // if != 0 -> do not erase yet (continue growth of the snake)
                &&
                ! appleReached
            ) {
                // erase oldest body part ...
                fillSquare(this.board.ctx, oldestBodypart[0], oldestBodypart[1], 'lightgrey', this.board.squareSize, 1)
                this.body.shift(); // removes the first element
            } else {

                if(appleReached) {
                    // remove it
                    this.board.apples = this.board.apples.filter(apple => apple[0] !== newestBodypart[0] && apple[1] !== newestBodypart[1]);
                    this.board.spawnApple(); // & replace by a new one !
                }
                
                if(this.shouldGrowAgainBy == 0) {
                    this.shouldGrowAgainBy = 1; // 1 = growth of +2 ...
                } else {
                    this.shouldGrowAgainBy -= 1;
                }
            }

            return true;
        } else {
            return false;
        } 
    }

    moveAhead() {
        const oldestBodypart = this.body[0];
        const isMovePossible = this.grow(this.currentDirection);
        if(isMovePossible) {
            fillSquare(this.board.ctx, oldestBodypart[0], oldestBodypart[1], 'lightgrey', this.board.squareSize)
            this.body.shift(); // removes the first element
            return true;
        } else {
            return false;
        } 
    }

    _getDelta(dir) {
        let deltaX = 0,
            deltaY = 0;
        switch(dir) {
            case LEFT:
                deltaX = -1;
                break;
            case UP:
                deltaY = -1;
                break;
            case RIGHT:
                deltaX = 1;
                break;
            case DOWN:
                deltaY = 1;
                break;
        }
        return [deltaX, deltaY];
    }

    grow(dir) {
        this.currentDirection = dir;
        // add a body part from the head to the adjacent cell in direction dir (if available...)

        const [headX, headY] = this.body[this.body.length - 1];
        const [deltaX, deltaY] = this._getDelta(dir);
        const posX = headX + deltaX;
        const posY = headY + deltaY;

        if(this.board.isEmpty(posX, posY)) {
           this.body.push([posX, posY]);
           //console.log("added :", posX, posY);
           return true;
        } else {
            // unable to add anything in this direction
            //console.error("unable to add anything in this direction:", dir);
            return false;
        }
    }

    possibleDirs() {
        return [LEFT, UP, RIGHT, DOWN].filter(dir => {
            const [headX, headY] = this.body[this.body.length - 1];
            const [deltaX, deltaY] = this._getDelta(dir);
            const posX = headX + deltaX;
            const posY = headY + deltaY;
            return this.board.isEmpty(posX, posY);
        })
    }

    /**
     * get:
     * - normalized distance (-1 to 1) to walls (N to S, E to W ?)
     * - body size
     * - ?
     */
    getSensorData() {

        const head = this.head();

        return {
            wallW: 2 * head[0] / this.board.nbCells - 1,
            wallN: 2 * head[1] / this.board.nbCells - 1,
            wallE: 2 * (this.board.nbCells - head[0]) / this.board.nbCells - 1,
            wallS: 2 * (this.board.nbCells - head[1]) / this.board.nbCells - 1,
            size: this.body.length / 100,
        }
    }

}
