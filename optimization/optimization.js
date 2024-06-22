
import { drawPointAt, drawLine, drawAxis, convertToGraphCoords, convertToCanvasCoords } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';

const SQUARE_SIZE = 25,
    dataPoints = [];

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

function main() {
    //document.querySelector("#refresh").addEventListener('click', (e) => redraw());

    redraw();
}

function gaussian(x, sigma=1, mean=0) {
    return 1 / (sigma * Math.sqrt(2 * Math.PI)) * Math.exp(-1/2 * Math.pow((x - mean) / sigma, 2));
}

//
// __Rejection sampling__ to get random values following a given probability distribution
//  -> the most basic Monte-Carlo sampler (but less efficient than other methods : MCMCs, SMCs ??)
//  -> it's trivially parallelizable !
// p(x) is a target distribution => here, Gaussian (with mean = 0 and sigma = 1)
// q(x) is the proposal distribution = uniform only in JS ...
//
function rejectionSampling(proposalDist, targetDist) {
    let reject = true; // init.

    let randomX = proposalDist(); // uniform: -0.5 to 0.5 along the x-axis
    let randomY = proposalDist(); // uniform: -0.5 to 0.5 along the y-axis
    //console.log("at:", randomX);
    let y = targetDist(randomX); // true y-value of the target p(x)

    let i = 0;
    while(reject && i < 10) {
        if(randomY > y) {
            // reject, and try again!
            randomX = proposalDist();
            randomY = proposalDist();
            y = targetDist(randomX);
        } else {
            // accept
            reject = false;
        }
        i++;
    }

    return randomY;
}

// standard matrix multiplication
function matMul(A, B) {
    //console.log("matMul:", A, B);

    // the matrices dimensions
    const aRows = A.length;
    const aCols = A[0].length;
    const bCols = B[0].length;

    //console.log("A rows=", aRows, " cols=", aCols, "B cols:", bCols);

    // Initialize the result matrix with zeros
    let result = new Array(aRows);
    for (let i = 0; i < aRows; i++) {
        result[i] = new Array(bCols).fill(0);
    }

    // Perform matrix multiplication
    for (let i = 0; i < aRows; i++) {
        for (let j = 0; j < bCols; j++) {
            for (let k = 0; k < aCols; k++) {
                result[i][j] += A[i][k] * B[k][j];
            }
        }
    }

    //console.log("result:", result, "rows:", result.length, "cols:", result[0].length);
    return result;
}

function transpose(matrix) {
    // matrix dimensions
    const rows = matrix.length;
    const cols = matrix[0].length;

    // Initialize the transposed matrix with switched dimensions
    let transposed = new Array(cols);
    for (let i = 0; i < cols; i++) {
        transposed[i] = new Array(rows);
    }

    // Populate the transposed matrix
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            transposed[j][i] = matrix[i][j];
        }
    }

    return transposed;
}

function showShape(A) {
    console.log("shape:", A.length, " by ", A[0].length);
}

/**
 * Batch GD !
 */
function gradientDescent(points) {

    const eta = 0.025; // learning rate
    const NB_EPOCHS = 5;
    const m = points.length;
    console.log(`eta: ${eta} \t epochs: ${NB_EPOCHS} \t m: ${m}`);

    console.log(points); // [[-5, -0.5], [X value (abscisses), Y value (valeur..)], ...] ???!!!

    const Xs = points.map(point => [point[0]]); // only one feature -> 500 x 2
    const Ys = points.map(point => point[1]); // array size = 500

    //console.log("Ys:", Ys)

    //let thetas = [[Math.random(), Math.random()]]; // intercept, theta_1 (slope)
    let thetas = [[-2, -1]];
    drawSolution(thetas[0][0], thetas[0][1], 0); // initial state..

    let gradients;

    for(let epoch = 1; epoch <= NB_EPOCHS; epoch++) {

        let test = matMul(
            Xs, // 500 x 1
            thetas // 1 x 2
            // -> 500 x 2
        ).map( // same shape : 500 x 2
            (res, idx) => {
                return [res[0] - Ys[idx], res[1] * thetas[0][1] - Ys[idx]]; // error
            }
        );

        //console.log(">", test);
        console.log("matMal( Xs, thetas ) - y");
        showShape(test);

        gradients = matMul( // 1 x 2
            transpose(Xs), // 1 x 500
            test // 500 x 2
        ).map(value => value.map(v => {
            //console.log(">>", v)
            return 2 / m * v;
        })); // same : 1 x 2 (should be transpose ?! not important..)

        console.log("matMal( Xs.T, 2/m* __ )");
        showShape(gradients)

        console.log("gradients:", JSON.stringify(gradients));
        //console.log("thetas (before):", JSON.stringify(thetas));

        // update model parameters
        thetas = thetas.map((theta, i) => ([
            theta[0] - eta * gradients[0][0],
            theta[1] - eta * gradients[0][1]
        ]));
        //console.log("thetas (after):", JSON.stringify(thetas)); // 1 x 2

        drawSolution(thetas[0][0], thetas[0][1], epoch); // draw temporary solution !
    }

    return [thetas[0][0], thetas[0][1]]; // intercept, slope
}





function redraw() {

    // true parameters to retrieve...
    const a = 0.7; // ax + b (line)
    const b = 3;

    drawAxis(canvas, SQUARE_SIZE /* square size */);

    const MEAN = 0, SIGMA = 1;

    const nb_points = 100; // nb of points to generate
    const from = -5;
    const to = 15;
    const step = (to - from) / nb_points;
    for (let i = from; i < to; i += step) {

        //const randX = rejectionSampling((min=-4, max=4) => Math.random() * (max - min) + min, (x) => gaussian(x, SIGMA, MEAN));
        const randY = rejectionSampling((min=-4, max=4) => Math.random() * (max - min) + min, (x) => gaussian(x, SIGMA, MEAN));
        //console.warn(randX, randY);

        const valueX = i; // + randX;
        const valueY = a * i + b + randY; // * 2;

        const [pixelX, pixelY] = convertToCanvasCoords(canvas, valueX, valueY, SQUARE_SIZE);
        
        // to draw point around the origin (in pixel coordinates)
        //const [zeroX, zeroY] = convertToCanvasCoords(canvas, 0, 0, SQUARE_SIZE);
        drawPointAt(ctx, pixelX, pixelY, 3, 'black');

        //console.error(valueX, valueY, pixelX, pixelY);
        // to graph coordinates
        dataPoints.push([valueX, valueY]);
    }

    //console.log(dataPoints);

    const [intercept, slope] = gradientDescent(dataPoints);

    drawSolution(intercept, slope); // final linear model solution
}

// solution lines
const colors = ['green', 'yellowgreen', 'orange', 'fuchsia', 'darkorange'];

function drawSolution(intercept, slope, epoch=null) {

    //console.log("intercept:", intercept);
    //console.log("slope:", slope);

    const point1X = -5;
    const point1Y = slope * point1X + intercept;
    const point2X = 15;
    const point2Y = slope * point2X + intercept;

    // from graph-coordinate to pixel/canvas-coordinates
    const [pt1X , pt1Y] = convertToCanvasCoords(canvas, point1X, point1Y, SQUARE_SIZE);
    const [pt2X , pt2Y] = convertToCanvasCoords(canvas, point2X, point2Y, SQUARE_SIZE);
    //console.log(pt1X, pt1Y, pt2X, pt2Y)

    // to ?
    //const [zeroX, zeroY] = convertToCanvasCoords(canvas, 0, 0, SQUARE_SIZE);
    //console.log("zeros:", zeroX, zeroY);
    //console.log(">>>>", pt1X, zeroY - pt1Y, pt2X, zeroY - pt2Y)

    const size = epoch == null ? 2.5 : 0.5;
    const color = epoch == null ? "red" : colors[epoch % colors.length];

    drawLine(
        ctx,
        pt1X, // left point x
        pt1Y, // left point y
        pt2X, // right x
        pt2Y, // right y
        size,
        color
    );
}

main();
