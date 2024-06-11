import { Snake } from './snake.js';
import { Board, LEFT, UP, RIGHT, DOWN } from './board.js';
import { computeOutput, argmax } from './neural_net.js';
import { setUpCanvas, drawGrid, fillShape } from './canvas.helper.js';
import { randInt, choice } from './helper.js'
import { Graph, dfs, createDAG, nb_params } from '../common/graph.js';
import { crossover, mutate } from './genetic_algorithm.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext('2d');

//
// DOM elements
//
const debug = document.querySelector("#debug");
const messageDiv = document.querySelector("#message");
const nbDags = document.querySelector("#nb_dags");
const mean = document.querySelector("#mean_fitness");
const min = document.querySelector("#min_fitness");
const max = document.querySelector("#max_fitness");
const gaInfo = document.querySelector("#ga_info");
const frameRate = document.querySelector("#frame_rate");
const frameRateSlider = document.querySelector("#frame_rate_value");

//
// Constants
//
const CELL_NB = 30,
    CELL_SIZE = (canvas.width - 1) / CELL_NB,
    SNAKE_INIT_SIZE = 4,
    INIT_NB_APPLES = 30,
    names = ['Python', 'Boa', 'Anaconda', 'Rattlesnake', 'Cobra'],
    colors = ['seagreen', 'orange', 'cyan', 'violet', 'salmon'], // hsla(${hue},${saturation}%,${lightness}%,${alpha})
    NB_PLAYERS = 5,
    MIN_POOL = 40, // start reusing DAG at MIN_POOL
    NEW_DAG_PROBA = 0.2, // if enough elite, at which rate to still create new random graphs ?
    PRUNE_AT = 400, // prune "regularly" to keep only the fittest, for the new generation
    STOP_WHEN_ALONE = false, // to keep earning "fitness" points even if already winner ! (3x slower ?)
    meanHistory = [],
    INIT_METHOD = 'Random Walk', // | 'Random Neural Net'
    //
    // Neural net
    //
    NB_INPUTS = 15, // 2d-position, 4 x walls, 4 x nearest obstacle, 4 x apples + snake length
    NB_HIDDEN_LAYER_1 = 10,
    NB_OUTPUTS = 3,
    //
    // Genetic Algorithm
    //
    CROSSOVER_METHOD = 'two-point',
    CROSSOVER_METHOD_LIST = ['uniform', 'one-point', 'two-point'],
    PERCENT_MUTATION = 0.05, // one-point, two-point
    NORMAL_FRAME_RATE = 24,
    FAST_FRAME_RATE = 0;

//
// Variables
//
let DEBUG = false,
    SHOW_LEADERBOARD = true,
    FRAME_RATE = 24, // Images per second, eg. 1000ms / 24 img. = 41.66 ms
    board, // "singleton" of the game board ...
    intervalId,
    frame = 1,
    move = null, // if not null, a human player has taken control
    currentDAGs = [],
    losers = [],
    bestDAGs = [],
    AIMoves = {},
    nbOfGamesPlayed = 0;


// update web page
frameRate.innerText = FRAME_RATE;
if(!DEBUG) { debug.style.display = 'none'; }
if(!SHOW_LEADERBOARD) { debug.innerHTML = ''; }
document.querySelector("#prune_at").innerText = PRUNE_AT;
document.querySelector("#min_pool").innerText = MIN_POOL;
gaInfo.innerHTML = `&bull; crossover method : ${CROSSOVER_METHOD_LIST.map(method => method == CROSSOVER_METHOD ? `<b><u>${method}</u></b>` : method).join(", ")}`;
gaInfo.innerHTML += `<br/> &bull; mutation percentage : <b>${PERCENT_MUTATION * 100}%</b>`;




frameRateSlider.addEventListener('change', (e) => {
    FRAME_RATE = e.target.value;
    modifyInterval(FRAME_RATE);
});


let populations = [];


// TODO: move to "board.js" -> `board.start();`
function startNewGame(bestDAG=null, init_method='Random Neural Net') {

    console.warn("startNewGame():", performance.memory.usedJSHeapSize);

    // creating new board
    board = new Board(ctx, CELL_SIZE, CELL_NB);
    //console.log("board:", board);

    // add apples
    if(frame % 1000 == 0) {
        //board.spawnApple(INIT_NB_APPLES, true);
    } else {
        board.spawnApple(INIT_NB_APPLES);
    }
    
    move = null; // remove human player (if user used keyboard)
    FRAME_RATE = init_method == 'Random Neural Net' && !bestDAG ? FAST_FRAME_RATE : NORMAL_FRAME_RATE;
    currentDAGs = []; // reinit. NN players (can be null if Random Walk, ...)

    nbDags.innerText = bestDAGs.length;
    const meanFitness = bestDAGs.length ? bestDAGs.reduce((acc, d) => acc + d.fitness, 0) / bestDAGs.length : 0;
    mean.innerText = Math.round(meanFitness * 100) / 100;
    const fitnesses = bestDAGs.map(d => d.fitness);
    //console.log("fitnesses : ", fitnesses);
    
    const maxFitness = fitnesses.length ? Math.max(...fitnesses) : 0;
    max.innerText = Math.round(maxFitness * 100) / 100;
    const minFitness = fitnesses.length ? Math.min(...fitnesses) : 0;
    min.innerText = Math.round(minFitness * 100) / 100;
    //console.log(minFitness, maxFitness);

    // Prune
    if(bestDAGs.length >= PRUNE_AT) {
        bestDAGs.sort((a, b) => a.fitness > b.fitness ? -1 : 1); // in-place sort
        //console.log("PRUNE:", bestDAGs.map(d => d.fitness));
        bestDAGs = bestDAGs.filter((dag, i) => i < MIN_POOL); // keep only the best/elite

        console.log("(re)initialize the population");
        // save new population
        populations = bestDAGs; // already pruned at PRUNE_AT (previous game)
        bestDAGs = []; // ready for new winners
        document.querySelector("#population").innerHTML = populations.length;
    
        const lastMean = meanHistory[meanHistory.length - 1];
        const diff = lastMean ? Math.round((meanFitness - lastMean)*100)/100 : null;

        const currentTime = Date.now() - startTime;

        const time = currentTime < 60*1000 ? `${Math.round(currentTime / 100)/10} sec.` : `${Math.floor(currentTime / 1000 / 60)} min. ${Math.floor(currentTime / 1000) % 60} s.`;
        document.querySelector("#fitness").innerHTML += `&bull; game ${nbOfGamesPlayed}
            <span class="tag">${time}</span> :
            min=<b>${minFitness}</b>,
            mean=<b>${Math.round(meanFitness*100)/100}</b>${diff !== null ? (diff == 0 ? ' <mark class="dropped">[stalled]</mark>' : ` (<mark ${diff<0?' class="stalled"':''}>δ: ${diff>0?'+':''}${diff}</mark>)`) : ''},
            max=<b>${maxFitness}</b><br/>`;
        meanHistory.push(meanFitness);
        window.scrollTo(0, document.body.scrollHeight);
    }

    let method;
    for(let n = 0; n < NB_PLAYERS; n++)
    {
        if(bestDAG) { // to showcase the best NN
            method = n == 0 ? 'Random Neural Net' : 'Random Walk';
        } else {
            method = init_method;
        }
        const snake = new Snake(
            board,
            randInt(0, CELL_NB - 1),
            randInt(0, CELL_NB - 1),
            colors[n % colors.length],
            names[n],
            method
        );
        //NB_INPUTS = Object.keys(snake.getSensorData()).length;

        if(snake.method == 'Random Neural Net') {

            let DAG;

            if(bestDAG) { // reuse best DAG to "showcase" (to see its performance)
                DAG = createDAG([NB_INPUTS, NB_HIDDEN_LAYER_1, NB_OUTPUTS]);

                // copy weights used by newly created player
                DAG.customData = bestDAG.customData;
                DAG.toposort = bestDAG.toposort;

                currentDAGs.push(DAG);
            } else {

                //console.log(populations.length, bestDAGs.length);
                // if enough elite DAGs pool, reuse one of the best (modified)... **half of the time** (to allow new "genes")
                if(populations.length) {

                    if(Math.random() < NEW_DAG_PROBA) { // for diversity
                        DAG = createDAG([NB_INPUTS, NB_HIDDEN_LAYER_1, NB_OUTPUTS]); // random DAG
                    } else {
                        // crossover between 2 of the bests
                        
                        // random but will be filled by parents
                        const newDAG = createDAG([NB_INPUTS, NB_HIDDEN_LAYER_1, NB_OUTPUTS]);

                        const index = randInt(0, populations.length - 1); // pick 2 random one
                        const index2 = randInt(0, populations.length - 1);

                        DAG = crossover(populations[index], populations[index2], newDAG, CROSSOVER_METHOD);
                        DAG = mutate(DAG, PERCENT_MUTATION, 0.2);
                    }
                } else { // to initialize a pool of genes
                    DAG = createDAG([NB_INPUTS, NB_HIDDEN_LAYER_1, NB_OUTPUTS]); // create a new random neural net
                }

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

    //console.log("Number of players:", board.players.length);

    //document.querySelector("#message").innerHTML = '';
    document.querySelector("#message").className = '';

    nbOfGamesPlayed += 1; // ...

    run(); // start game loop
}


let eventsAdded = false;
function addEvents() {
    //
    // add event listeners
    //
    document.querySelector("#reload_page").addEventListener('click', () => {
        location.reload(true);
    })
    document.querySelector("#restart_training").addEventListener('click', (e) => {
        clearInterval(intervalId);
        FRAME_RATE = FAST_FRAME_RATE;
        frameRate.innerText = FRAME_RATE;
        main('Random Neural Net');
    });
    document.querySelector("#pause").addEventListener('click', (e) => {
        if(e.target.innerText == 'Pause') {
            clearInterval(intervalId);
            document.querySelector("#pause").innerText = 'Resume';
        } else {
            startTime = Date.now(); // reset start time ...
            run();
            document.querySelector("#pause").innerText = 'Pause';
        }
    });
    document.querySelector("#use_best").addEventListener('click', () => {
        clearInterval(intervalId);

        FRAME_RATE = NORMAL_FRAME_RATE;
        frameRate.innerText = FRAME_RATE;
        const bestFitness = Math.max(...bestDAGs.map(o => o.fitness));
        const bestDAG = bestDAGs.find(d => d.fitness == bestFitness);
        //console.log("reusing best DAG with fitness : ", bestFitness, bestDAG);

        setUpCanvas(ctx, canvas.width, canvas.height);
        drawGrid(ctx, canvas.width, canvas.height, CELL_SIZE);
    
        startNewGame(bestDAG);
    });
    
    document.querySelector("#show_leaderboard").addEventListener('change', function(e) {
        SHOW_LEADERBOARD = this.checked;
        if(!SHOW_LEADERBOARD) { // empty content
            messageDiv.innerHTML = '';
        } else {
            showLeaderboard(board);
        }
    });
    
    document.querySelector("#show_debug").addEventListener('change', function(e) {
        DEBUG = this.checked;
        if(!DEBUG) { // empty content
            debug.innerHTML = '';
            debug.style.display = 'none'; // 
        } else {
            debug.style.display = 'block'; // 
        }
    });
    
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
            board.getPlayer('python')?.setMethod('human'); // can be already dead (= null) TODO: take an other one ?
            FRAME_RATE = NORMAL_FRAME_RATE;
            frameRate.innerText = FRAME_RATE;
        }
    });

    eventsAdded = true;
    console.log("Event listeners added !");
}

let startTime;
function main(method=INIT_METHOD) {

    if(!eventsAdded) {
        addEvents();
    }

    setUpCanvas(ctx, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height, CELL_SIZE);

    startTime = Date.now();
    startNewGame(null, method);
}

function finished(winner, fitness=0) {
    if(!winner) {
        //console.log("DRAW!");
    } else {
        //console.log(`FINISHED ! winner is ${winner.name} (fitness=${fitness})`);
        const index = board.players.findIndex(p => p.name == winner.name && p.method == 'Random Neural Net');
        // keep track of this winner DAG
        if(index != -1) {
            const dag = currentDAGs.slice(index, index+1); // make a copy ?
            dag[0].fitness = fitness;
            bestDAGs.push(dag[0]);
        }
        //console.log("number of 'best' DAGs :", bestDAGs.length);
    }

    setUpCanvas(ctx, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height, CELL_SIZE);

    const best = currentDAGs.filter(d => d != null).length == 1 ? currentDAGs.find(d => d != null) : null;
    //console.log("redo best:", best)
    startNewGame(best, !best ? INIT_METHOD : best.method);
}

function showLeaderboard(board) {
    let message = '';
    const players = board.players;
    players.sort((a, b) => a.body.length > b.body.length ? -1 : 1);
    players.forEach(player => {
        message += `<div style="color: ${player.color}"><b ${losers.includes(player) ? 'style="text-decoration: line-through;"': ''}>${player.name}</b> (${player.method}) : ${player.body.length}</div>`;
    })
    message += `<hr/><div style="color: red">Number of apples : ${board.apples.length}</div>`;
    messageDiv.innerHTML = message;
}

function run() {
    AIMoves = {};
    losers = [];
    frame = 0;
    let lastFrame = 0;
    let finish = false;
    let totalScore = 0;
    let frameLastScoreChange = 0;

    intervalId = setInterval(() => {

        let hasLoser = false;

        const currentTotalScore = board.players.reduce((acc, p) => acc += p.body.length, 0);
        if(currentTotalScore !== totalScore) {
            totalScore = currentTotalScore;
            frameLastScoreChange = frame;
        }

        const remainingPlayers = board.players.filter(player => !losers.includes(player));

        // ONLY 1 PLAYER   OR   NO APPLE EATEN !? number of moves (to detect blocks)
        if(remainingPlayers.length <= 1 && STOP_WHEN_ALONE || (frame - frameLastScoreChange) > 50) {
            //console.log("Too long. Loop ?");
            clearInterval(intervalId);

            const lengths = remainingPlayers.map((p, i) => p.body.length);
            const bestLength = Math.max(...lengths);
            const bestPlayer = remainingPlayers.find(p => p.body.length == bestLength);
            
            //
            // FITNESS
            //
            const fitness = frame + bestPlayer.eaten * 10;
            //console.log("current best is", fitness, "=", bestPlayer.name);
            
            finished(bestPlayer, fitness);
        }

        //console.log("number of players :", board.players.length);
        board.players.forEach((player, i) => {
            let ok;

            if(losers.includes(player)) return; // skip dead snakes (no more moves)

            if(! Object.keys(AIMoves).includes(player.name)) {
                AIMoves[player.name] = []; // init. this NN player move list
            }

            const dirs = player.possibleDirs();

            // Manual control ?
            if(player.name == 'python' && move !== null) {
                if(dirs.includes(move)) {
                    ok = player.move(move);
                } else {
                    ok = player.move(player.currentDirection);
                }
            
            // Neural net ?
            } else if(player.method == 'Random Neural Net' && currentDAGs[i]) {

                //console.log(i, player.method);
                //console.log(i, "currentDAGs:", currentDAGs[i])
                const g = currentDAGs[i];
                const proba = computeOutput(g, player.getSensorData());
                const action = argmax(proba);
                const changeBy = [-1, 0, 1][action];
                const move = ((player.currentDirection + changeBy) + 4) % 4;
                const moveNames = ['LEFT', 'UP', 'RIGHT', 'DOWN'];
                AIMoves[player.name].push(moveNames[move]+' (Δ='+changeBy+')');

                //
                // Debug message
                //

                if(DEBUG) {
                    debug.innerHTML = `${Object.keys(g.V).length} neurons (${nb_params} parameters) sorted topologically :\n  ${JSON.stringify(g.toposort)}
                        \n\nsensor data of ${player.name} :\n ${JSON.stringify(player.getSensorData(), null, '\t')}
                        \n\nLatest network output (after softmax, actions=[-1, 0, 1]) : ${JSON.stringify(proba, null, 2)}
                        \n\nActions chosen by neural network from currentDirection = ${moveNames[player.currentDirection]} (${player.currentDirection}) :\n >>> ${AIMoves[player.name].join(", ")}`;
                    
                    debug.scrollTop = debug.scrollHeight; // auto-scroll to bottom of div
                    const head = player.head();
                    console.log(head);
                    //fillShape(ctx, head[0], head[1], 'square', 'black'); // ??? shifted ???
                }
                // if possible move
                //if(dirs.includes(move)) {
                    ok = player.move(move);
                //} else {
                //    ok = player.move(player.currentDirection); // continue in same direction ?
                //}
            } else {
                const chosenDir = choice(dirs);
                ok = player.move(chosenDir);
                //console.log("available dirs:", dirs, "chosen :", chosenDir);
            }
            // this player has just loose ?
            if(!ok) {
                hasLoser = true; // we have a loser => ?

                player.dead = true;
                //console.log(player.name + " is dead !");

                if(board.players.length - losers.length > 1) {
                    losers.push(player); // to keep track of them (as their are removed from the board..)
                    //board.removePlayer(player.name);
                } else {
                    if(!finish) {
                        lastFrame = frame;
                    }
                    finish = true;
                }

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
                if(!hasLoser && SHOW_LEADERBOARD) { // ???
                    showLeaderboard(board);
                }
            }



            //
            // optim. ?
            //

            //if(frame % 1000 == 0) {
                player.show(); // update a snake
            //}
        });

        /*
        if(board.players.length - losers.length === 1) { // stop if only 1 player
            showLeaderboard(board);
            clearInterval(intervalId);
        }
        */

        //console.log(">", losers.length);

        const nbRemainingPlayers = board.players.length - losers.length;
        //console.error(frame - lastFrame);
        if(nbRemainingPlayers <= 1 && (frame - lastFrame) > 15) { // BUG ??
            //console.warn("STOP !");
            clearInterval(intervalId);
            const winner = board.players.filter(player => !losers.includes(player))[0];
            //
            // FITNESS = frame reached
            //
            finished(winner, frame + 10 * winner.eaten);
        }

        // STOP
        //clearInterval(intervalId);
        
        frame += 1;
    }, 1000 / FRAME_RATE);
}


function modifyInterval() {
    frameRate.innerText = FRAME_RATE;
    clearInterval(intervalId);
    run()
}





main();
