import { fillShape } from '../common/canvas.helper.js';
import { Board, LEFT, UP, RIGHT, DOWN } from './board.js';
import { convertToRGB, RGBToHSL } from './color.js';

export class Snake {
    // head position
    posX;
    posY;
    board;
    currentDirection;
    color;
    name;
    method; // control method
    
    eaten;
    dead = false;

    body = [];

    constructor(board, posX, posY, color, name = 'player', method='randomWalk') {
        this.board = board;
        this.color = color;
        this.name = name;
        this.method = method;
        this.eaten = 0;
        this.dead = false;
        //console.log("snake created at", posX, posY);
        this.body.push([posX, posY]);
    }

    setMethod(method) {
        this.method = method;
    }

    show() {
        const rgb = convertToRGB(this.color);
        const arr = rgb.substring(1)
            .match(/.{2}/g)
            .map(i => parseInt(i, 16));

        //console.log("arr:", arr);
        const [h, s, l] = RGBToHSL(...arr);
        const bodySize = this.body.length;

        this.body.forEach((pos, i) => {
            //const l = Math.ceil((bodySize - i) / bodySize * 55); // dark to mid-color...
            //const l = Math.ceil(i / bodySize * 50 + 50); // white to mid-color
            const l = Math.ceil(100 - i / bodySize * 50 - 20); // mid-color to almost white
            const sat = this.dead ? 5 : s;
            const color = `hsl(${h},${sat}%,${l}%)`;
            //console.log("color:", color);

            fillShape(this.board.ctx, pos[0], pos[1], 'square', 'lightgrey', this.board.squareSize, 1)
            fillShape(this.board.ctx, pos[0], pos[1], 'square', color, this.board.squareSize, bodySize - 1 === i ? 2 : 3)
        });
    }

    hide() {
        const bodySize = this.body.length;
        this.body.forEach((pos, i) => fillShape(this.board.ctx, pos[0], pos[1], 'square', 'lightgray', this.board.squareSize));
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
                fillShape(this.board.ctx, oldestBodypart[0], oldestBodypart[1], 'square', 'lightgrey', this.board.squareSize, 1)
                this.body.shift(); // removes the first element
            } else {

                if(appleReached) {
                    this.eaten += 1;
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
            fillShape(this.board.ctx, oldestBodypart[0], oldestBodypart[1], 'square', 'lightgrey', this.board.squareSize)
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

        let nearestAppleN = this.board.nbCells,
            nearestAppleS = this.board.nbCells,
            nearestAppleW = this.board.nbCells,
            nearestAppleE = this.board.nbCells,
            obstacleN = this.board.nbCells,
            obstacleS = this.board.nbCells,
            obstacleW = this.board.nbCells,
            obstacleE = this.board.nbCells;
        
        // TODO? : slow ???

        for(let i = head[1]; i >= -1; i--) { // North
            if(this.board.hasApple(i, head[0]) && nearestAppleN === this.board.nbCells) {
                nearestAppleN = head[1] - i;
            }
            if(!this.board.isEmpty(i, head[0]) && obstacleN === this.board.nbCells) {
                obstacleN = head[1] - i;
                break;
            }
        }

        for(let i = head[1]; i < this.board.nbCells + 1; i++) { // South
            if(this.board.hasApple(i, head[0]) && nearestAppleS === this.board.nbCells) {
                nearestAppleS = i;
            }
            if(!this.board.isEmpty(i, head[0]) && obstacleS === this.board.nbCells) {
                obstacleS = i;
                break;
            }
        }

        for(let i = head[0]; i >= -1; i--) { // West
            if(this.board.hasApple(head[1], i) && nearestAppleW === this.board.nbCells) {
                nearestAppleW = head[0] - i;
            }
            if(!this.board.isEmpty(head[1], i) && obstacleW === this.board.nbCells) {
                obstacleW = head[0] - i;
                break;
            }
        }

        for(let i = head[0]; i < this.board.nbCells + 1; i++) { // East
            if(this.board.hasApple(head[1], i) && nearestAppleE === this.board.nbCells) {
                nearestAppleE = i - head[0];
            }
            if(!this.board.isEmpty(head[1], i) && obstacleE === this.board.nbCells) {
                obstacleE = i - head[0];
                break;
            }
        }

        return {
            headX: head[0],
            headY: head[1],
            wallN: 2 * head[1] / this.board.nbCells - 1,
            wallN_unnormalized: head[1],
            wallS: 2 * (this.board.nbCells - head[1]) / this.board.nbCells - 1,
            wallS_unnormalized: this.board.nbCells - head[1],
            wallW: 2 * head[0] / this.board.nbCells - 1,
            wallW_unnormalized: head[0],
            wallE: 2 * (this.board.nbCells - head[0]) / this.board.nbCells - 1,
            wallE_unnormalized: this.board.nbCells - head[0],
            obstacleN: 2 * obstacleN / this.board.nbCells - 1,
            obstacleN_unnormalized: obstacleN,
            obstacleS: 2 * obstacleS / this.board.nbCells - 1,
            obstacleS_unnormalized: obstacleS,
            obstacleW: 2 * obstacleW / this.board.nbCells - 1,
            obstacleW_unnormalized: obstacleW,
            obstacleE: 2 * obstacleE / this.board.nbCells - 1,
            obstacleE_unnormalized: obstacleE,
            appleN: 2 * nearestAppleN / this.board.nbCells - 1,
            appleN_unnormalized: nearestAppleN,
            appleS: 2 * nearestAppleS / this.board.nbCells - 1,
            appleS_unnormalized: nearestAppleS,
            appleW: 2 * nearestAppleW / this.board.nbCells - 1,
            appleW_unnormalized: nearestAppleW,
            appleE: 2 * nearestAppleE / this.board.nbCells - 1,
            appleE_unnormalized: nearestAppleE,
            size: this.body.length / 100,
        }
    }

}
