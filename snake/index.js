import { Snake } from './snake.js';
import { Board, LEFT, UP, RIGHT, DOWN } from './board.js';
import { setUpCanvas, drawGrid } from './canvas.helper.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext('2d');

const CELL_NB = 40;
const CELL_SIZE = (canvas.width - 1) / CELL_NB;
const SNAKE_INIT_SIZE = 6;

function randInt(min, max) {
    // Ensure the min and max values are integers
    min = Math.ceil(min);
    max = Math.floor(max);
    // Generate a random integer between min and max (inclusive)
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

let board;

function main() {
    setUpCanvas(ctx, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height, CELL_SIZE);

    board = new Board(ctx, CELL_SIZE, CELL_NB);
    console.log("board:", board);

    const names = ['python', 'boa', 'anaconda', 'snake'];
    const colors = ['green', 'orange', 'red', 'blue'];
    
    for(let n = 0; n < 4; n++) {
        const snake = new Snake(
            board,
            randInt(0, CELL_NB - 1),
            randInt(0, CELL_NB - 1),
            colors[n],
            names[n]
        );

        // make it grow a bit (until 6 squares)
        for(let i = 0; i < SNAKE_INIT_SIZE - 1; i++) {
            const success = snake.grow(randInt(0, 3));
            if(!success) i -= 1; // retry
        }

        board.addPlayer(snake);
    }

    let frame = 0;
    document.querySelector("#message").innerHTML = '';
    document.querySelector("#message").className = '';

    const id = setInterval(() => {

        board.players.forEach(player => {
            const dirs = player.possibleDirs();
            const chosenDir = choice(dirs);
            //console.log("available dirs:", dirs, "chosen :", chosenDir);
            const ok = player.grow(chosenDir); // use .move ?
            player.show();
            if(!ok) {
                clearInterval(id);
                console.log(player.name);
                document.querySelector("#message").innerHTML = 'Player <b style="color: '+player.color+'">'+player.name+'</b> lose !!';
                document.querySelector("#message").className = 'error';
            }
        });
        
        frame += 1;
    }, 75);
}

document.querySelector("#restart").addEventListener('click', (e) => main());

main();
