import { Snake } from './snake.js';
import { Board, LEFT, UP, RIGHT, DOWN } from './board.js';
import { setUpCanvas, drawGrid } from './canvas.helper.js';
import { randInt, choice } from './helper.js'

import { Graph, dfs, toposort } from '../common/graph.js';

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

    console.log("Creating new board...");
    board = new Board(ctx, CELL_SIZE, CELL_NB);
    console.log("board:", board);

    move = null; // 

    const names = ['python', 'boa', 'anaconda', 'snake'];
    const colors = ['seagreen', 'orange', 'cyan', 'violet'];
    
    for(let n = 0; n < NB_PLAYERS; n++) {
        const snake = new Snake(
            board,
            randInt(0, CELL_NB - 1),
            randInt(0, CELL_NB - 1),
            colors[n],
            names[n],
            n == 0 ? 'Random_Neural_Net' : 'randomWalk'
        );

        // make it grow a bit (until 4 squares)
        for(let i = 0; i < SNAKE_INIT_SIZE - 1; i++) {
            const success = snake.grow(randInt(0, 3));
            if(!success) i -= 1; // retry
        }

        board.addPlayer(snake);
    }

    console.log("Number of players:", board.players.length);

    document.querySelector("#message").innerHTML = '';
    document.querySelector("#message").className = '';

    board.spawnApple(20);

    run();


    createDAG();

}

let g; // DAG
let nb_params = 0;

function createDAG() {
    const vertices = [], adjacency = {};
    g = new Graph(vertices, adjacency);

    // 5 input, 3 hidden neurons (in 1 layer), 3 output
    //      => 5*3 + 3*3 = 24 parameters ?

    const nb_input = 5;
    const hiddens = [3];
    const nb_output = 3;

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
}



function computeOutput(g, inputs) {

    const temp = {
        'I_1': inputs.wallW,
        'I_2': inputs.wallN,
        'I_3': inputs.wallE,
        'I_4': inputs.wallS,
        'I_5': inputs.size
    }; // cumulate computations

    const neuronsPerLayer = [5, 3, 3];
    let j = 0, i = 0;
    const activationDone = [];

    toposort.forEach((neuron) => {
        //console.log(`Calculating ${neuron} linked to ${g.adj[neuron] ?? 'no'} neurons`);

        // outputs
        if(!g.adj[neuron]) {
            temp[neuron] = Math.tanh(temp[neuron]);
            //console.error(`${neuron} > after activation : ${temp[neuron]}`);
        }

        // accumulate weights additions into temp[nextNeuron]
        g.adj[neuron]?.forEach(nextNeuron => {
            const link = neuron+"-"+nextNeuron;
            const weight = g.getWeight(link); // weight of the link
            //console.log(`(${link}) weight: ${weight}`)

            if(!temp[nextNeuron]) temp[nextNeuron] = 0;
            temp[nextNeuron] += temp[neuron] * weight;
            
            //console.log(`accumulate ${neuron} ${nextNeuron} ${temp[nextNeuron]}`);

            if(i >= neuronsPerLayer[j] * neuronsPerLayer[j+1] && !activationDone.includes(neuron)) {
                activationDone.push(neuron);
                //console.log("i:", i);
                // accumulation finish -> apply activation function (to add non-linearity)
                temp[neuron] = Math.tanh(temp[neuron]);
                //console.warn(`${neuron} > after activation : ${temp[neuron]}`);
            }

            if(i >= neuronsPerLayer[j] * neuronsPerLayer[j+1] + neuronsPerLayer[j+1] * neuronsPerLayer[j+2]) {
                j += 1; // pass to next "layer"
                i = 0; // reinitialize the count of neurons ?
            }

            i += 1;
        });
    });

    const outputs = [temp['O_1'], temp['O_2'] , temp['O_3']];
    //console.warn("outputs:", outputs);
    const proba = softmax(outputs);
    //console.warn("proba:", proba);

    return proba;
}

function softmax(arr) {
    // Calculate the exponential of each value
    const expValues = arr.map(value => Math.exp(value));
    
    // Calculate the sum of the exponential values
    const sumExpValues = expValues.reduce((acc, value) => acc + value, 0);
    
    // Divide each exponential value by the sum to get the softmax values
    const softmaxValues = expValues.map(value => value / sumExpValues);
    
    return softmaxValues;
}

function argmax(arr) {
    if (arr.length === 0) {
        throw new Error("The array cannot be empty");
    }

    let maxIndex = 0;
    let maxValue = arr[0];

    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > maxValue) {
            maxIndex = i;
            maxValue = arr[i];
        }
    }

    return maxIndex;
}

let AIMoves = [];
const debug = document.querySelector("#debug");

function run() {
    const losers = [];
    AIMoves = [];
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
            } if(player.method == 'Random_Neural_Net') {

                //console.log(player.currentDirection);

                // show input data
                const proba = computeOutput(g, player.getSensorData());
                const action = argmax(proba);
                const changeBy = [-1, 0, 1][action];
                const move = ((player.currentDirection + changeBy) + 4) % 4;
                const moveNames = ['LEFT', 'UP', 'RIGHT', 'DOWN'];
                AIMoves.push(moveNames[move]+' (Δ='+changeBy+')');

                //
                // Debug message
                //
                debug.innerHTML = `${Object.keys(g.V).length} neurons (${nb_params} parameters) sorted topologically :\n  ${JSON.stringify(toposort)}`;
                debug.innerHTML += "\n\nsensor data:\n" + JSON.stringify(player.getSensorData(), null, '\t');
                debug.innerHTML += '\n\nActions chosen by neural network : ' + AIMoves.join(", ");
                debug.innerHTML += '\n\nLatest network output (after softmax, actions=[-1, 0, 1]) : ' + JSON.stringify(proba, null, 2);
                debug.scrollTop = debug.scrollHeight; // auto-scroll to bottom of div

                ok = player.move(move);
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

                if(board.players.length === 1) { // stop if only 1 player
                    showLeaderboard(board);
                    clearInterval(intervalId);
                }
            } else {
                if(!hasLoser) {
                    showLeaderboard(board);
                }
            }
        });

        function showLeaderboard(board) {
            let message = '';
            const players = board.players;
            players.sort((a, b) => a.body.length > b.body.length ? -1 : 1);
            players.forEach(player => {
                message += `<div style="${losers.includes(player) ? 'text-decoration: line-through;': ''} color: ${player.color}"><b>${player.name}</b> (${player.method}) : ${player.body.length}</div>`;
            })
            message += `<div style="color: black">Number of apples : ${board.apples.length}</div>`;
            document.querySelector("#message").innerHTML = message;
        }
        
        frame += 1;


        // STOP
        //clearInterval(intervalId);

    }, 100);
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
