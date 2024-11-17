import { Snake } from './snake.js';
import { Board, LEFT, UP, RIGHT, DOWN } from './board.js';
import { computeOutput, argmax } from './neural_net.js';
import { setUpCanvas, drawGrid, fillShape } from '../_common/canvas.helper.js';
import { randInt, choice } from '../_common/common.helper.js'
import { Graph, dfs, createDAG, nb_params } from '../_common/graph.js';
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
const population = document.querySelector("#population");

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
    MIN_POOL = 50, // start reusing DAG at MIN_POOL
    NEW_DAG_PROBA = 0.2, // if enough elite, at which rate to still create new random graphs ?
    PRUNE_AT = 250, // prune "regularly" to keep only the fittest, for the new generation
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
    MUTATION_DELTA = 0.1, // ???
    ELITISM = 0.15,
    NORMAL_FRAME_RATE = 24,
    FAST_FRAME_RATE = 1000;

const moveNames = ['LEFT', 'UP', 'RIGHT', 'DOWN'];

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
gaInfo.innerHTML += `<br/> &bull; mutation rate : <b>${PERCENT_MUTATION * 100}%</b>`;
gaInfo.innerHTML += `<br/> &bull; elitism rate : <b>${ELITISM * 100}%</b>`;



frameRateSlider.addEventListener('change', (e) => {
    FRAME_RATE = e.target.value;
    modifyInterval(FRAME_RATE);
});

let populations = JSON.parse(localStorage.getItem("saved_population") ?? '[]');
populations.map(DAG => {
    let newDAG = createDAG([NB_INPUTS, NB_HIDDEN_LAYER_1, NB_OUTPUTS]);
    newDAG.customData = DAG.customData;
    newDAG.toposort = DAG.toposort;
    return newDAG;
});
population.innerHTML = populations.length;
console.log("init pop:", populations);







// TODO: move to "board.js" -> `board.start();`
function startNewGame(bestDAG=null, init_method='Random Neural Net') {

    console.warn("startNewGame(): usedJSHeapSize =", performance.memory.usedJSHeapSize);
    console.warn("bestDAG:", bestDAG);
    //console.warn("startNewGame(): init_method =", init_method);

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
    
    // Prune
    if(bestDAGs.length >= PRUNE_AT - Math.ceil(MIN_POOL * ELITISM)) {
        bestDAGs.sort((a, b) => a.fitness > b.fitness ? -1 : 1); // in-place sort
        //console.log("PRUNE:", bestDAGs.map(d => d.fitness));

        bestDAGs = bestDAGs.filter((dag, i) => i < MIN_POOL - Math.ceil(MIN_POOL * ELITISM)); // keep only the best/elite

        //console.log("(re)initialize the population");
        // save new population
        const elite = populations.filter((pop, i) => i < Math.ceil(MIN_POOL * ELITISM));
        //console.log("elite:", elite),

        populations = bestDAGs.concat(elite).sort((a, b) => a.fitness > b.fitness ? -1 : 1); // already pruned at PRUNE_AT (previous game)
        //console.log("elite + bestDAG =", populations);

        console.log("Save best population to localStorage");
        localStorage.setItem("saved_population", JSON.stringify(populations));
        bestDAGs = []; // ready for new winners
        population.innerHTML = populations.length;

        const meanFitness = populations.length ? populations.reduce((acc, d) => acc + d.fitness, 0) / populations.length : 0;
        mean.innerText = Math.round(meanFitness * 100) / 100;
        const fitnesses = populations.map(d => d.fitness);
        //console.log("fitnesses : ", fitnesses);

        const maxFitness = fitnesses.length ? Math.max(...fitnesses) : 0;
        max.innerText = Math.round(maxFitness * 100) / 100;
        const minFitness = fitnesses.length ? Math.min(...fitnesses) : 0;
        min.innerText = Math.round(minFitness * 100) / 100;
        //console.log(minFitness, maxFitness);

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

        console.log("player:", n+1, snake.name, snake.method);
        if(snake.method == 'Random Neural Net') {

            let DAG;

            if(bestDAG) { // reuse best DAG to "showcase" (to see its performance)
                DAG = createDAG([NB_INPUTS, NB_HIDDEN_LAYER_1, NB_OUTPUTS]);

                // copy weights used by newly created player
                DAG.customData = bestDAG.customData;
                DAG.toposort = bestDAG.toposort; // ???

                currentDAGs.push(DAG);
            } else {

                //console.log(populations.length, bestDAGs.length);
                // if enough elite DAGs pool, reuse one of the best (modified)... **half of the time** (to allow new "genes")
                if(populations.length > 0) {

                    if(Math.random() < NEW_DAG_PROBA) { // for diversity
                        DAG = createDAG([NB_INPUTS, NB_HIDDEN_LAYER_1, NB_OUTPUTS]); // random DAG
                    } else {
                        // crossover between 2 of the bests
                        
                        // random but will be filled by parents
                        const newDAG = createDAG([NB_INPUTS, NB_HIDDEN_LAYER_1, NB_OUTPUTS]);

                        const index = randInt(0, populations.length - 1); // pick 2 random one
                        const index2 = randInt(0, populations.length - 1);

                        DAG = crossover(populations[index], populations[index2], newDAG, CROSSOVER_METHOD);
                        DAG = mutate(DAG, PERCENT_MUTATION, MUTATION_DELTA);

                        console.error(JSON.stringify(DAG));                        
                    }
                } else { // to initialize a pool of genes
                    DAG = createDAG([NB_INPUTS, NB_HIDDEN_LAYER_1, NB_OUTPUTS]); // create a new random neural net

                    console.error(JSON.stringify(DAG));
                }

                currentDAGs.push(DAG);
            }
        } else {
            currentDAGs.push(null);
        }

        console.log("(startNewGame) currentDAGs:", currentDAGs);

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
        if(e.target.innerText.includes('Pause')) {
            clearInterval(intervalId);
            document.querySelector("#pause").innerHTML = '&#9658; Resume';

            // enable forward button
            document.querySelector("#forward").disabled = false;
        } else {
            startTime = Date.now(); // reset start time ...
            run();
            document.querySelector("#pause").innerHTML = '&#10074;&#10074; Pause';

            // disable forward button
            document.querySelector("#forward").disabled = true;
        }
    });

    document.querySelector("#forward").addEventListener('click', () => {
        setTimeout(gameLoop);
    });

    document.querySelector("#use_best").addEventListener('click', () => {
        clearInterval(intervalId);

        FRAME_RATE = NORMAL_FRAME_RATE;
        frameRate.innerText = FRAME_RATE;
        const bestFitness = Math.max(...populations.map(o => o.fitness));
        const bestDAG = populations.find(d => d.fitness == bestFitness);
        console.log("reusing best DAG with fitness : ", bestFitness, bestDAG);

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
    //console.log("Event listeners added !");
}

let startTime;
function main(method) {
    if(!eventsAdded) {
        addEvents();
    }

    setUpCanvas(ctx, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height, CELL_SIZE);

    startTime = Date.now();
    startNewGame(null, method);
}

function finished(winner, fitness=0) {
    //console.log("finished by winner=", winner);
    let dag = null;
    if(! winner) {
        //console.log("DRAW !?");
    } else {
        console.log(`FINISHED ! winner is ${winner.name} (fitness=${fitness})`);
        const index = board.players.findIndex(p => p.name == winner.name && p.method == 'Random Neural Net');
        console.log(board.players, index);
        // if winner is a NN (keep track of this)
        if(index != -1) {
            console.log("currentDAGs:", currentDAGs);
            dag = currentDAGs.slice(index, index+1); // make a copy ?
            dag[0].fitness = fitness;
            console.log(">", dag[0]);
            bestDAGs.push(dag[0]);
        }
        //console.log("number of 'best' DAGs :", bestDAGs.length);
    }

    setUpCanvas(ctx, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height, CELL_SIZE);

    // LOGS
    const test = currentDAGs.map(o => o?.fitness).filter(value => value);
    console.log("test:", test);
    const bestFitness = Math.max(...test);
    console.log ("bestFitness:", bestFitness);
    const bestDAG = currentDAGs.find(d => d?.fitness == bestFitness);
    console.log("bestDAG:", bestDAG);
    
    startNewGame(null, ! dag ? INIT_METHOD : 'Random Neural Net');
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

function computeFitness(frameNumber, player) {
    return frameNumber + 10 * player.eaten;
}

function gameLoop() {

    let hasLoser = false;

    const currentTotalScore = board.players.reduce((acc, p) => acc += p.body.length, 0);
    if(currentTotalScore !== totalScore) {
        totalScore = currentTotalScore;
        frameLastScoreChange = frame;
    }

    const remainingPlayers = board.players.filter(player => !losers.includes(player));

    // ONLY 1 PLAYER   OR   NO APPLE EATEN !? number of moves (to detect blocks)
    // TODO: why "<="
    if(remainingPlayers.length === 1 && (STOP_WHEN_ALONE || (frame - frameLastScoreChange) > 50)) {
        //console.log("Too long. Loop ?");
        clearInterval(intervalId);

        const lengths = remainingPlayers.map((p, i) => p.body.length);
        const bestLength = Math.max(...lengths);
        const bestPlayer = remainingPlayers.find(p => p.body.length == bestLength);
        
        finished(bestPlayer, computeFitness(frame, bestPlayer));
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

            console.log(i, player.method);
            console.log(i, "currentDAGs:", currentDAGs[i])
            const g = currentDAGs[i];
            const proba = computeOutput(g, player.getSensorData());
            const action = argmax(proba);
            const changeBy = [-1, 0, 1][action];
            const move = ((player.currentDirection + changeBy) + moveNames.length) % moveNames.length;
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
                //console.log(head);
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
        finished(winner, computeFitness(frame, winner));
    }

    // STOP
    //clearInterval(intervalId);
    
    frame += 1;
}

let lastFrame, finish, totalScore, frameLastScoreChange;

function run() {
    AIMoves = {}; // empty previous moves
    losers = []; // no more losers
    frame = 0; // reinit frame count
    lastFrame = 0;
    finish = false;
    totalScore = 0;
    frameLastScoreChange = 0;

    intervalId = setInterval(gameLoop, 1000 / FRAME_RATE);
}


function modifyInterval() {
    frameRate.innerText = FRAME_RATE;
    frameRateSlider.value = FRAME_RATE;
    clearInterval(intervalId);
    run();
}


main(INIT_METHOD);
