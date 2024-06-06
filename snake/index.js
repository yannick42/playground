import { Snake } from './snake.js';
import { Board, LEFT, UP, RIGHT, DOWN } from './board.js';
import { setUpCanvas, drawGrid } from './canvas.helper.js';
import { randInt, choice } from './helper.js'

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext('2d');

const CELL_NB = 40;
const CELL_SIZE = (canvas.width - 1) / CELL_NB;
const SNAKE_INIT_SIZE = 4;
const NB_PLAYERS = 4;

let board, intervalId;
let frame = 0;

function main() {
    setUpCanvas(ctx, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height, CELL_SIZE);

    board = new Board(ctx, CELL_SIZE, CELL_NB);
    console.log("board:", board);

    const names = ['python', 'boa', 'anaconda', 'snake'];
    const colors = ['seagreen', 'orange', 'cyan', 'violet'];
    
    for(let n = 0; n < NB_PLAYERS; n++) {
        const snake = new Snake(
            board,
            randInt(0, CELL_NB - 1),
            randInt(0, CELL_NB - 1),
            colors[n],
            names[n],
            'randomWalk'
        );

        // make it grow a bit (until 4 squares)
        for(let i = 0; i < SNAKE_INIT_SIZE - 1; i++) {
            const success = snake.grow(randInt(0, 3));
            if(!success) i -= 1; // retry
        }

        board.addPlayer(snake);
    }

    document.querySelector("#message").innerHTML = '';
    document.querySelector("#message").className = '';

    board.spawnApple(20);

    run();
}

function run() {
    intervalId = setInterval(() => {

        let hasLoser = false;

        board.players.forEach((player, i) => {
            let ok;
            const dirs = player.possibleDirs();
            if(player.name == 'python' && move !== null) {
                if(dirs.includes(move)) {
                    ok = player.move(move);
                } else {
                    ok = player.move(player.currentDirection);
                }
            } else {
                const chosenDir = choice(dirs);
                ok = player.move(chosenDir);
                //console.log("available dirs:", dirs, "chosen :", chosenDir);
            }
            player.show();
            if(!ok) {
                hasLoser = true;
                clearInterval(intervalId);
                console.log(player.name, "lose !");
                document.querySelector("#message").innerHTML += '<br/><br/>-> Player <b style="color: '+player.color+'">'+player.name+'</b> lose !!';
                document.querySelector("#message").className = 'error';
            } else {
                if(!hasLoser) {
                    let message = '';
                    const players = board.players;
                    players.sort((a, b) => a.body.length > b.body.length ? -1 : 1);
                    players.forEach(player => {
                        message += `<div style="color: ${player.color}">${player.name} (${player.method}) : ${player.body.length}</div>`;
                    })
                    message += `<div style="color: black">Number of apples : ${board.apples.length}</div>`;
                    document.querySelector("#message").innerHTML = message;
                }
            }
        });
        
        frame += 1;
    }, 75);
}

document.querySelector("#restart").addEventListener('click', (e) => {
    clearInterval(intervalId);
    main();
});
document.querySelector("#pause").addEventListener('click', (e) => {
    if(e.target.innerText == 'Pause') {
        clearInterval(intervalId);
        document.querySelector("#pause").innerText = 'Resume';
    } else {
        run();
        document.querySelector("#pause").innerText = 'Pause';
    }
});

let move = null;
document.querySelector("body").addEventListener('keydown', (e) => {
    if(e.code == 'ArrowUp') {
        move = UP;
    } else if(e.code == 'ArrowDown') {
        move = DOWN;
    } else if(e.code == 'ArrowLeft') {
        move = LEFT;
    } else if(e.code == 'ArrowRight') {
        move = RIGHT;
    }
    board.getPlayer('python').setMethod('human');
});

main();
