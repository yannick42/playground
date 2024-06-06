export const LEFT = 0;
export const UP = 1;
export const RIGHT = 2;
export const DOWN = 3;

export class Board {

    ctx;
    squareSize;
    nbCells;
    players = [];

    constructor(ctx, squareSize, nbCells) {
        this.ctx = ctx;
        this.squareSize = squareSize;
        this.nbCells = nbCells;
    }

    addPlayer(player) {
        this.players.push(player);
    }

    isEmpty(posX, posY) {
        const isInsideBoard = posX >= 0 && posX < this.nbCells && posY >= 0 && posY < this.nbCells;
        const noPlayerHere = this.players.every(player => !player.body.map(p => p[0]+"-"+p[1]).includes(posX+'-'+posY));
        //console.log("noPlayerHere:", noPlayerHere);
        return isInsideBoard && noPlayerHere;
    }

}
