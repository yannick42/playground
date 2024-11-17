
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../_common/canvas.helper.js';
import { randInt } from '../_common/common.helper.js';
import { gaussian, rejectionSampling } from '../_common/stats.helper.js';
import { round } from '../_common/math.helper.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const randomMethodEl = document.getElementById("random_method");
const showCircleEl = document.getElementById("show_circles");
const debugEl = document.getElementById("debug");

function main() {
    document.querySelector("#resample").addEventListener('click', (e) => redraw());
    randomMethodEl.addEventListener('change', (e) => redraw());

    redraw();
}

const WIDTH = 500,
    HEIGHT = 500,
    N = 2, // =2D
    R = 15,
    K = 30,
    CELL_SIZE = R / Math.sqrt(N), // R / 1.41
    BACKGROUND_COLOR = 'transparent',
    POINT_COLOR = 'darkgreen',
    POINT_CIRCLE_COLOR = 'lightgreen',
    POINT_FILL_COLOR = 'transparent',
    GRID_COLOR = 'lightgray',
    DISPLAY_GRID = false;

let activeList = [],
    points = [];

// Initialize HTML Canvas
canvas.width = WIDTH;
canvas.height = HEIGHT;

// size
const X = Math.ceil(WIDTH / CELL_SIZE)
const Y = Math.ceil(HEIGHT / CELL_SIZE)
// generate grid cells containing only 1 circle each
let grid = Array(X).fill(null).map(() => Array(Y).fill(-1));


function addPoint(ctx, x, y, color="green") {
    ctx.fillStyle = color;
    ctx.fillRect(x-1, y-1, 2, 2);
}

function addCircle(ctx, x, y, r, color="green", fillColor="red") {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.arc(x, y, r, 0, 2 * Math.PI); // TODO: why 2.5 and not simply 2 ?
    ctx.stroke();

    ctx.fillStyle = fillColor;
    ctx.fill();
}

const toGridX = (x) => Math.floor(x / CELL_SIZE);
const toGridY = (y) => Math.floor(y / CELL_SIZE);
const dist = (x, y, x2, y2) => Math.sqrt(Math.pow(x2-x, 2) + Math.pow(y2-y, 2));
const isValid = (x, y) => {

    let i = toGridX(x);
    let j = toGridY(y);
    //console.log("isValue:", i, j, "from x:", x, "y:", y, "grid size:", grid.length, grid[0].length);

    let i_1 = i >= 1 && j >= 1? grid[i-1][j-1] : -1;
    let i_2 = i >= 1 ? grid[i-1][j] : -1;
    let i_3 = i >= 1 && j < grid[i].length - 1 ? grid[i-1][j+1] : -1;

    let i_4 = j >= 1 ? grid[i][j-1] : -1;
    let i_5 = j < grid[i].length - 1 ? grid[i][j+1] : -1;

    let i_6 = j >= 1 && i < grid.length - 1 ? grid[i+1][j-1] : -1;
    let i_7 = i < grid.length - 1 ? grid[i+1][j] : -1;
    let i_8 = i < grid.length - 1 && j < grid[i].length - 1 ? grid[i+1][j+1] : -1;

    let neighbors = [i_1, i_2, i_3, i_4, i_5, i_6, i_7, i_8].filter(idx => idx != -1 && idx != undefined);
    //console.log("neighbors", neighbors);
    //console.log("points:", points);

    if(neighbors.length) {
    // calculate if every distance is > to R 
    //for(let i = 0; i < neighbors.length; i++) {
        //console.log(neighbors[i], points[neighbors[i]]);
        //console.log(dist(x, y, points[neighbors[i]][0], points[neighbors[i]][1]));
    //}
    let ret = neighbors.every(neigh => dist(x, y, points[neigh][0], points[neigh][1]) > R);
    //console.log("ret:", ret);
    return ret && grid[i][j] == -1;
    }
    //console.log("no neighbor:", grid[i][j]);

    return grid[i][j] == -1;
}

function findRandomInSphericalAnnulus(x, y, r) {
    // around (x, y)
    let pos = randInt(r, 2*r);
    let angle = randInt(0, 360);

    let pt_x = Math.min(WIDTH-1, Math.max(0, x + Math.floor(pos * Math.cos(angle))));
    let pt_y = Math.min(HEIGHT-1, Math.max(0, y + Math.floor(pos * Math.sin(angle))));

    return [pt_x, pt_y];
}





function redraw() {
    // clear all
    setUpCanvas(ctx, WIDTH, HEIGHT, 'lightyellow');

    debugEl.innerHTML = '';

    const t0 = window.performance.now();

    const method = randomMethodEl.value;

    points = [];

    switch(method) {
        
        case "uniform":
            for(let i = 0; i < 800; i++) {
                let randX = randInt(0, WIDTH-1);
                let randY = randInt(0, HEIGHT-1);
                const point = [randX, randY];
                // draw it on canvas
                addPoint(ctx, randX, randY, POINT_COLOR);
                points.push(point);
            }

            debugEl.innerHTML += `${points.length} points generated.`
            break;
        
        case "rejection":
        
            const SIGMA = 1, MEAN = 0;
            let nb_rejections_x = { count: 0 },
                nb_rejections_y = { count: 0 };
            for(let i = 0; i < 800; i++) {

                // x-axis
                const randX = 500 / 10 * rejectionSampling(
                    (min=-5, max=5) => Math.random() * (max - min) + min,
                    (x) => gaussian(x, SIGMA, MEAN),
                    nb_rejections_x
                ) + 250;

                // y-axis
                const randY = 500 / 10 * rejectionSampling(
                    (min=-5, max=5) => Math.random() * (max - min) + min,
                    (x) => gaussian(x, SIGMA, MEAN),
                    nb_rejections_y
                ) + 250;

                //console.log(nb_rejections_x, nb_rejections_y)

                const point = [randX, randY];
                
                // draw it on canvas
                addPoint(ctx, randX, randY, POINT_COLOR);
                
                points.push(point);
            }

            debugEl.innerHTML += `${points.length} points generated with ${points.length * 2 + nb_rejections_x.count + nb_rejections_y.count} calls to the uniform distribution (in each x/y directions) (${nb_rejections_x.count + nb_rejections_y.count} rejections).`
            break;

        case "poisson":

            let randX = randInt(0, WIDTH-1);
            let randY = randInt(0, HEIGHT-1);
    
            grid = Array(X).fill(null).map(() => Array(Y).fill(-1));

            // ?
            grid[toGridX(randX)][toGridY(randY)] = 0;

            // draw it on canvas
            addPoint(ctx, randX, randY, POINT_COLOR);
            if(showCircleEl.checked) {
                addCircle(ctx, randX, randY, R, POINT_CIRCLE_COLOR, POINT_FILL_COLOR);
            }

            activeList = [];

            const point = [randX, randY];
            points.push(point);
            activeList.push(point); // add to active points

            console.clear();

            if(DISPLAY_GRID) {
                for (let i = 0; i <= Math.floor(WIDTH / CELL_SIZE); i++) {
                    ctx.fillStyle = GRID_COLOR;
                    ctx.fillRect(i * CELL_SIZE, 0, 1, HEIGHT);
                }
                for (let i = 0; i <= Math.floor(HEIGHT / CELL_SIZE); i++) {
                    ctx.fillStyle = GRID_COLOR;
                    ctx.fillRect(0, i * CELL_SIZE, WIDTH, 1);
                }
            }


            let it = 0;
            while(activeList.length)
            {
                let failed = 0; // reinit. fail count

                const randomIndex = randInt(1, activeList.length) - 1;
                let xx = activeList[randomIndex][0];
                let yy = activeList[randomIndex][1];

                do
                {
                    let new_point = findRandomInSphericalAnnulus(xx, yy, R);
                    if(
                        isValid(new_point[0], new_point[1])
                    )
                    {
                        let x_ = toGridX(new_point[0]);
                        let y_ = toGridY(new_point[1]);
                        grid[x_][y_] = points.length; // indexed with current "points" array size
                        
                        addPoint(ctx, new_point[0], new_point[1], POINT_COLOR);
                        if(showCircleEl.checked) {
                            addCircle(ctx, new_point[0], new_point[1], R, POINT_CIRCLE_COLOR, POINT_FILL_COLOR);
                        }
                        activeList.push(new_point);
                        points.push(new_point);
                        
                        break; // stop, for now
                    } else {
                        failed++;
                        //let i = grid[toGridX(new_point[0])][toGridY(new_point[1])];
                        //console.log("FAILED ! can't choose:", new_point[0], new_point[1], "i:", i, activeList[i]);
                    }
                    
                    if(failed === K) { // reject
                        activeList.splice(randomIndex, 1); // remove from "queue"
                        
                        if(showCircleEl.checked) { // erase !
                            addPoint(ctx,new_point[0], new_point[1], BACKGROUND_COLOR);
                            addCircle(ctx, new_point[0], new_point[1], R, BACKGROUND_COLOR, POINT_FILL_COLOR);
                        }
                        // console.log("> too much attempts");
                    }
                } while(failed < K);

                it++;

            }

            debugEl.innerHTML += `${points.length} points generated in ${it} iterations.`
        
            break;
        default:
            throw new("Unknown method : " + method);
    }


    debugEl.innerHTML += `<br/> in ${round(window.performance.now() - t0, 1)} ms.`;
}

main();
