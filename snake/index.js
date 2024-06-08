import { Snake } from './snake.js';
import { Board, LEFT, UP, RIGHT, DOWN } from './board.js';
import { computeOutput, argmax } from './neural_net.js';

import { setUpCanvas, drawGrid } from './canvas.helper.js';
import { randInt, choice } from './helper.js'

import { Graph, dfs } from '../common/graph.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext('2d');

function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

const CELL_NB = 40,
    CELL_SIZE = (canvas.width - 1) / CELL_NB,
    SNAKE_INIT_SIZE = 4,
    INIT_NB_APPLES = 30,
    names = ['Python', 'Boa', 'Anaconda', 'Rattlesnake', 'Cobra'],
    colors = ['seagreen', 'orange', 'cyan', 'violet', 'salmon'],
    NB_PLAYERS = names.length,
    MIN_POOL = 8, // start reusing DAG at MIN_POOL
    PRUNE_AT = 16, // keep only the fittest
    NEW_DAG_PROBA = 0.33; // if enough elite, at which rate to still create new random graphs ?

let board, intervalId;
let frame = 0;

let currentDAGs = [];
let losers = [];
let bestDAGs = [];

const nbDags = document.querySelector("#nb_dags");
const mean = document.querySelector("#mean_fitness");
const min = document.querySelector("#min_fitness");
const max = document.querySelector("#max_fitness");
document.querySelector("#prune_at").innerText = PRUNE_AT;

function startNewGame() {

    // creating new board
    board = new Board(ctx, CELL_SIZE, CELL_NB);
    console.log("board:", board);

    // add apples
    board.spawnApple(INIT_NB_APPLES);
    
    move = null; // remove human player (if user used keyboard)
    currentDAGs = [];

    // prune ?
    if(bestDAGs.length >= PRUNE_AT) {
        bestDAGs.sort((a, b) => a.fitness > b.fitness ? -1 : 1);
        //console.warn("sorted bests:", JSON.stringify(bestDAGs)); // TODO : it doesn't select the bests !!!!!????
        console.log("PRUNE:", bestDAGs.map(d => d.fitness));
        bestDAGs = bestDAGs.filter((dag, i) => i < MIN_POOL); // keep 10 bests ...
    }

    nbDags.innerText = bestDAGs.length;
    const meanFitness = bestDAGs.length ? bestDAGs.reduce((acc, d) => acc + d.fitness, 0) / bestDAGs.length : 0;
    mean.innerText = Math.round(meanFitness * 100) / 100;
    const fitnesses = bestDAGs.map(d => d.fitness);
    console.log("fitnesses : ", fitnesses);
    
    const maxFitness = fitnesses.length ? Math.max(...fitnesses) : 0;
    max.innerText = Math.round(maxFitness * 100) / 100;
    const minFitness = fitnesses.length ? Math.min(...fitnesses) : 0;
    min.innerText = Math.round(minFitness * 100) / 100;
    console.log(minFitness, maxFitness);


    for(let n = 0; n < NB_PLAYERS; n++)
    {
        const snake = new Snake(
            board,
            randInt(0, CELL_NB - 1),
            randInt(0, CELL_NB - 1),
            colors[n % colors.length],
            names[n],
            //n == 0 ? 'Random Neural Net' : 'Random Walk'
            'Random Neural Net'
        );

        if(snake.method == 'Random Neural Net') {
            // if enough elite DAGs pool, reuse one of the best (modified)... **half of the time** (to allow new "genes")
            if(bestDAGs.length >= MIN_POOL && Math.random() > NEW_DAG_PROBA) {
                const index = randInt(0, bestDAGs.length - 1); // pick a random one

                // used by newly created player
                const copy = bestDAGs.slice(index, index+1)[0]; // TODO : ???
                console.log("mutate :", copy);
                const DAG = mutateDAG(copy);
                currentDAGs.push(DAG);

                console.log(`reuse one of the best with fitness = ${DAG.fitness}, and mutate it a bit...`);

            } else {
                const DAG = createDAG([5, 3, 3]); // create a new random neural net (5 inputs and 3 outputs)
                currentDAGs.push(DAG);
            }
        } else {
            currentDAGs.push(null);
        }

        //
        // make it grow a bit (until 4 squares)
        //
        for(let i = 0; i < SNAKE_INIT_SIZE - 1; i++) {
            const success = snake.grow(randInt(0, 3));
            if(!success) i -= 1; // retry
        }

        board.addPlayer(snake);
    }

    console.log("Number of players:", board.players.length);

    //document.querySelector("#message").innerHTML = '';
    document.querySelector("#message").className = '';


    run(); // start game loop
}


function mutateDAG(g, perc=0.2) {

    Object.keys(g.customData).forEach(d => {
        //console.log("mutateDAG:", d, g.customData[d]);
        if(Math.random() < perc) { // mutate ?
            g.customData[d] += getRandomFloat(-0.1, 0.1);
        }
    })

    return g;
}

function main() {
    setUpCanvas(ctx, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height, CELL_SIZE);

    startNewGame();
}

let nb_params = 0;

function createDAG(sizes) {
    const   vertices = [],
            adjacency = {};
    const g = new Graph(vertices, adjacency);

    nb_params = 0;

    // example :
    // 5 input, 3 hidden neurons (in 1 layer), 3 output
    //      => 5*3 + 3*3 = 24 parameters ?

    const nb_input = sizes[0];
    const hiddens = sizes.slice(1, sizes.length - 1);
    const nb_output = sizes[sizes.length - 1];

    // Input to 1st hidden layer
    for(let i = 0; i < nb_input; i++) {
        for(let j = 0; j < hiddens[0]; j++) {
            const from = "I_" + (i + 1);
            const to = "H_" + (j + 1);
            g.add(from, to);
            g.weight(from+"-"+to, Math.random() * 2 - 1);
            nb_params += 1;
        }
    }

    // Hidden layer to output layer
    for(let i = 0; i < nb_output; i++) {
        for(let j = 0; j < hiddens[0]; j++) {
            const from = "H_" + (j + 1);
            const to = "O_" + (i + 1);
            g.add("H_" + (j + 1), "O_" + (i + 1));
            g.weight(from+"-"+to, Math.random() * 2 - 1);
            nb_params += 1;
        }
    }
    
    dfs(g);
    return g;
}

function finished(winner, fitness=0) {
    if(!winner) {
        console.log("DRAW!");
    } else {
        console.log(`FINISHED ! winner is ${winner.name} (fitness=${fitness})`);
        const index = board.players.findIndex(p => p.name == winner.name);
        // keep track of this winner DAG
        const dag = currentDAGs.slice(index, index+1); // make a copy ?
        dag[0].fitness = fitness;
        bestDAGs.push(dag[0]);
        console.log("number of 'best' DAGs :", bestDAGs.length);
    }

    setUpCanvas(ctx, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height, CELL_SIZE);

    startNewGame();
}

let AIMoves = [];
const debug = document.querySelector("#debug");

function run() {
    AIMoves = [];
    losers = [];
    frame = 0;

    intervalId = setInterval(() => {

        let hasLoser = false;

        //console.log("number of players :", board.players.length);
        board.players.forEach((player, i) => {
            let ok;

            if(losers.includes(player)) return; // skip dead snakes

            const dirs = player.possibleDirs();
            if(player.name == 'python' && move !== null) {
                if(dirs.includes(move)) {
                    ok = player.move(move);
                } else {
                    ok = player.move(player.currentDirection);
                }
            } else if(player.method == 'Random Neural Net') {

                const g = currentDAGs[i];
                const proba = computeOutput(g, player.getSensorData());
                const action = argmax(proba);
                const changeBy = [-1, 0, 1][action];
                const move = ((player.currentDirection + changeBy) + 4) % 4;
                const moveNames = ['LEFT', 'UP', 'RIGHT', 'DOWN'];
                AIMoves.push(moveNames[move]+' (Δ='+changeBy+')');

                //
                // Debug message
                //
                debug.innerHTML = `${Object.keys(g.V).length} neurons (${nb_params} parameters) sorted topologically :\n  ${JSON.stringify(g.toposort)}`;
                debug.innerHTML += "\n\nsensor data:\n" + JSON.stringify(player.getSensorData(), null, '\t');
                debug.innerHTML += '\n\nActions chosen by neural network :\n >>> ' + AIMoves.join(", ");
                debug.innerHTML += '\n\nLatest network output (after softmax, actions=[-1, 0, 1]) : ' + JSON.stringify(proba, null, 2);
                debug.scrollTop = debug.scrollHeight; // auto-scroll to bottom of div

                // if possible move
                //if(dirs.includes(move)) {
                    ok = player.move(move);
                //} else {
                //    ok = player.move(player.currentDirection); // continue in same direction ?
                //}
            }else {
                const chosenDir = choice(dirs);
                ok = player.move(chosenDir);
                //console.log("available dirs:", dirs, "chosen :", chosenDir);
            }
            player.show();

            if(!ok) {
                hasLoser = true;

                losers.push(player); // to keep track of them (as their are removed from the board..)
                //board.removePlayer(player.name);

                if(player.name == 'python') {
                    debug.innerHTML += '\n\nDEAD !';
                    debug.scrollTop = debug.scrollHeight; // auto-scroll to bottom of div
                }

                // add to the losers list
                /*document.querySelector("#losers").className = 'error';
                document.querySelector("#losers").innerHTML = '';
                losers.forEach(loser => {
                    document.querySelector("#losers").innerHTML += `<br/><br/>-> Player <b style="color: ${loser.color}">${loser.name} (${loser.method})</b> lose with <b>${loser.body.length} points</b>!`;
                });*/

            } else {
                if(!hasLoser) {
                    showLeaderboard(board);
                }
            }
        });

        /*
        if(board.players.length - losers.length === 1) { // stop if only 1 player
            showLeaderboard(board);
            clearInterval(intervalId);
        }
        */

        function showLeaderboard(board) {
            let message = '';
            const players = board.players;
            players.sort((a, b) => a.body.length > b.body.length ? -1 : 1);
            players.forEach(player => {
                message += `<div style="color: ${player.color}"><b ${losers.includes(player) ? 'style="text-decoration: line-through;"': ''}>${player.name}</b> (${player.method}) : ${player.body.length}</div>`;
            })
            message += `<hr/><div style="color: red">Number of apples : ${board.apples.length}</div>`;
            document.querySelector("#message").innerHTML = message;
        }
        
        frame += 1;

        console.log(">", losers.length);

        const nbRemainingPlayers = board.players.length - losers.length;
        if(nbRemainingPlayers === 1) {
            const winner = board.players.filter(player => !losers.includes(player))[0];
            finished(winner, frame + 10 * winner.body.length);
            clearInterval(intervalId);
        }
        if(nbRemainingPlayers === 0) {
            finished(null);
            clearInterval(intervalId);
        }

        // STOP
        //clearInterval(intervalId);

    }, 100);
}

document.querySelector("#reload_page").addEventListener('click', () => {
    location.reload(true);
})
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
    if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        if(e.code == 'ArrowUp') {
            move = UP;
        } else if(e.code == 'ArrowDown') {
            move = DOWN;
        } else if(e.code == 'ArrowLeft') {
            move = LEFT;
        } else if(e.code == 'ArrowRight') {
            move = RIGHT;
        }
        board.getPlayer('python')?.setMethod('human'); // can be already dead (= null)
    }
});

main();
