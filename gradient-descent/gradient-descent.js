
import { setUpCanvas, drawPointAt, drawLine, drawAxis, convertToGraphCoords, convertToCanvasCoords } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';
import { matMul, transpose, showShape, round } from '../common/math.helper.js';
import { rejectionSampling, gaussian } from '../common/stats.helper.js';

const SQUARE_SIZE = 25,
    dataPoints = [];

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

let ETA = 0.01; // learning rate
let NB_EPOCHS = 250;
let METHOD = 'BatchGD'; // batch gradient descent
let PROBLEM = 'lr';

const etaEl = document.querySelector("#eta");
const epochsEl = document.querySelector("#epochs");
const methodEl = document.querySelector("#method");
const problemEl = document.querySelector("#problem");

function main() {
    document.querySelector("#refresh").addEventListener('click', (e) => redraw());
    etaEl.addEventListener('change', (e) => ETA = e.target.value);
    epochsEl.addEventListener('change', (e) => NB_EPOCHS = e.target.value);
    methodEl.addEventListener('change', (e) => METHOD = e.target.value);
    problemEl.addEventListener('change', (e) => {
        PROBLEM = e.target.value;
        if(PROBLEM == 'log_reg') {
            ETA = 2;
            etaEl.value = 2;
        } else {
            ETA = 0.01;
            etaEl.value = 0.01;
        }
        redraw();
    });

    etaEl.value = ETA;
    epochsEl.value = NB_EPOCHS;
    methodEl.value = METHOD;
    problemEl.value = PROBLEM;

    redraw();
}





/**
 * Batch GD !
 */
function gradientDescent(points) { // points = [[x_1, Y_1], ...] (shape = 1 x m)

    //console.log(points); // [[-5, -0.5], [X value (abscisses), Y value (valeur..)], ...] ???!!!

    const m = points.length;
    document.querySelector("#nbPoints").innerText = m;

    const Xs = points.map(point => [1, point[0]]); // only one feature -> m x 2
    const Ys = [points.map(point => point[1])]; // 1 x m
    //console.log("Ys:", Ys)

    let thetas;
    let gradients;

    if (PROBLEM === 'lr') {
        thetas = [[Math.random() - 0.5], [Math.random() - 0.5]]; // intercept, theta_1 (slope)
        drawSolution([thetas[0][0], thetas[1][0]], 0); // initial state..
    } else {
        thetas = [[Math.random() - 0.5], [Math.random() - 0.5], [Math.random() - 0.5]]; // intercept, theta_1, theta_2
        drawSolution(thetas, 0); // initial state..
    }
    


    for(let epoch = 1; epoch <= NB_EPOCHS; epoch++) {

        let test;
        if (PROBLEM === 'lr') {
            // (X @ thetas - y)
            test = matMul( // m x 1
                Xs, // m x 2
                thetas // 2 x 1
            ).map( // same shape : m x 1
                (res, idx) => {
                    return [res - Ys[0][idx]]; // = error
                }
            );
            // no need to sum anything ...

            //console.log("> test =", test);
            //console.log("matMal( Xs, thetas ) - y");
            //showShape(test);

            // X.T @ (X @ thetas - y)
            gradients = matMul( // 2 x 1
                transpose(Xs), // 2 x m
                test // m x 1
            );
            //console.log("gradient =");
            //showShape(gradients);

            gradients[0][0] *= 2/m;
            gradients[1][0] *= 2/m;
        } else {
            //
            // logistic regression (log-loss ?)
            //

            const concatedX = Xs.map((X, idx) => [1, X[1], Ys[0][idx]]);

            // ([100, 3] x [3 x 1])
            //console.log("concatedX:", concatedX) // 100 x 3
            //console.log("theta:", thetas) // 3 x 1
            test = matMul(
                concatedX,
                thetas
            );
            //console.log("test:", test) // 100 x 1
            test = test.map((res, idx) => [1 / (1 + Math.exp(- res)) - (idx % 2 == 1 ? 0 : 1)])
            //console.log("test:", test) // 100 x 1
            
            //console.log("transpose XS:", transpose(concatedX))
            gradients = matMul( // 3 x 1
                transpose(concatedX), // 3 x m
                test // m x 1
            );
            console.log(gradients);
            gradients[0][0] *= 1/m;
            gradients[1][0] *= 1/m;
            gradients[2][0] *= 1/m;
        }

        //console.log("gradients:", JSON.stringify(gradients));

        //
        // update model parameters
        //
        thetas = thetas.map((theta, i) => ([
            theta[0] - ETA * gradients[i][0]
        ]));

        console.log("thetas (after):", JSON.stringify(thetas)); // 1 x 2

        if(epoch % 10 === 0) {
            drawSolution(thetas, epoch); // draw temporary solution !
        }
    }

    return thetas; // intercept, slope, ...
}


/**
 * Batch GD !
 */
function stochasticGradientDescent(points) { // points = [[x_1, Y_1], ...] (shape = 1 x m)

    //console.log(points); // [[-5, -0.5], [X value (abscisses), Y value (valeur..)], ...] ???!!!

    const m = points.length;
    document.querySelector("#nbPoints").innerText = m;

    const Xs = points.map(point => [1, point[0]]); // only one feature -> m x 2
    const Ys = [points.map(point => point[1])]; // 1 x m
    //console.log("Ys:", Ys)
    
    let thetas = PROBLEM == 'lr' ? [[Math.random() - 0.5], [Math.random() - 0.5]]
     : [[Math.random() - 0.5], [Math.random() - 0.5], [Math.random() - 0.5]]; // intercept, theta_1 (slope)
    
    drawSolution(thetas, 0); // initial state..

    let gradients;

    for(let epoch = 1; epoch <= NB_EPOCHS; epoch++) {

        for(let i = 0; i < m; i++) {

            const randomIndex = randInt(0, m - 1);

            const X = [Xs[randomIndex]]; // 1 x 2
            const Y = [[Ys[0][randomIndex]]]; // 1 x 1

            let test;
            if (PROBLEM === 'lr') {
                // (X @ thetas - y)
                test = matMul( // m x 1
                    X, // m x 2
                    thetas // 2 x 1
                ).map( // same shape : m x 1
                    (res, idx) => [res - Y[0][idx]] // = error
                );
                // no need to sum anything ...

                //console.log("> test =", test);
                //console.log("matMal( Xs, thetas ) - y");
                //showShape(test);

                // X.T @ (X @ thetas - y)
                gradients = matMul( // 2 x 1
                    transpose(X), // 2 x m
                    test // m x 1
                );
                //console.log("gradient =");
                //showShape(gradients);

                gradients[0][0] *= (2 / m);
                gradients[1][0] *= (2 / m);

                //console.log("gradients:", JSON.stringify(gradients));

            } else {
                //
                // logistic regression (log-loss ?)
                //

                const concatedX = Xs.map((X, idx) => [1, X[1], Ys[0][idx]]);

                // ([100, 3] x [3 x 1])
                //console.log("concatXY:", concatXY) // 100 x 3
                //console.log("theta:", thetas) // 3 x 1
                test = matMul(
                    concatedX,
                    thetas
                );
                //console.log("test:", test) // 100 x 1
                test = test.map((res, idx) => [1 / (1 + Math.exp(- res)) - (idx % 2 == 1 ? 0 : 1)])
                //console.log("test:", test) // 100 x 1
                
                //console.log("transpose XS:", transpose(concatedX))
                gradients = matMul( // 3 x 1
                    transpose(concatedX), // 3 x m
                    test // m x 1
                );
                //console.log(gradients)
                gradients[0][0] *= (1 / m);
                gradients[1][0] *= (1 / m);
                gradients[2][0] *= (1 / m);
            }

            // update model parameters
            thetas = thetas.map((theta, i) => ([
                theta[0] - ETA * gradients[i][0]
            ]));

            //console.log("thetas (after):", JSON.stringify(thetas)); // 1 x 2

        }

        if(epoch % 10 === 0) {
            drawSolution(thetas, epoch); // draw temporary solution !
        }
    }

    return thetas; // intercept, slope, ...
}

function generateLRPoints(nb_points) {
    console.log("generating " + nb_points + " points");
    dataPoints.splice(0, dataPoints.length); // erase points

    // true parameters to retrieve...
    const a = 0.7; // ax + b (line)
    const b = 3;

    const MEAN = 0, SIGMA = 1;

    const from = -5;
    const to = 15;
    const step = (to - from) / (nb_points - 0.5); // why 0.5... ?
    for (let i = from; i < to; i += step) {

        const randX = rejectionSampling((min=-6, max=6) => Math.random() * (max - min) + min, (x) => gaussian(x, SIGMA, MEAN));
        const randY = rejectionSampling((min=-6, max=6) => Math.random() * (max - min) + min, (x) => gaussian(x, SIGMA, MEAN));
        //console.warn("rand X, Y: ", randX, randY);

        // in graph-coordinates
        const valueX = i + randX;
        const valueY = a * i + b + randY;

        const [pixelX, pixelY] = convertToCanvasCoords(canvas, valueX, valueY, SQUARE_SIZE);
        //console.warn("pixel X, Y: ", pixelX, pixelY);
        
        // to draw point around the origin (in pixel coordinates)
        //const [zeroX, zeroY] = convertToCanvasCoords(canvas, 0, 0, SQUARE_SIZE);
        drawPointAt(ctx, pixelX, pixelY, 3, 'grey');

        //console.error(valueX, valueY, pixelX, pixelY);
        // to graph coordinates
        dataPoints.push([valueX, valueY]);
    }
}

function generateLogRegPoints(nb_points) {
console.log("generating " + nb_points + " points");
    dataPoints.splice(0, dataPoints.length); // erase points

    // two classes
    const x1 = 2, y1 = 3;
    const x2 = 10, y2 = 8;

    const MEAN = 0, SIGMA = 1;

    for (let i = 0; i < nb_points / 2; i += 1) {

        const randX = rejectionSampling((min=-6, max=6) => Math.random() * (max - min) + min, (x) => gaussian(x, SIGMA, MEAN));
        const randY = rejectionSampling((min=-6, max=6) => Math.random() * (max - min) + min, (x) => gaussian(x, SIGMA, MEAN));

        // in graph-coordinates
        const valueX = x1 + randX;
        const valueY = y1 + randY;

        const [pixelX, pixelY] = convertToCanvasCoords(canvas, valueX, valueY, SQUARE_SIZE);

        // to draw point around the origin (in pixel coordinates)
        //const [zeroX, zeroY] = convertToCanvasCoords(canvas, 0, 0, SQUARE_SIZE);
        drawPointAt(ctx, pixelX, pixelY, 3, 'red');

        //console.error(valueX, valueY, pixelX, pixelY);
        // to graph coordinates
        dataPoints.push([valueX, valueY]);


        //
        // point in the other class
        //
        const randX2 = rejectionSampling((min=-6, max=6) => Math.random() * (max - min) + min, (x) => gaussian(x, SIGMA, MEAN));
        const randY2 = rejectionSampling((min=-6, max=6) => Math.random() * (max - min) + min, (x) => gaussian(x, SIGMA, MEAN));

        // in graph-coordinates
        const valueX2 = x2 + randX2;
        const valueY2 = y2 + randY2;

        const [pixelX2, pixelY2] = convertToCanvasCoords(canvas, valueX2, valueY2, SQUARE_SIZE);
        
        // to draw point around the origin (in pixel coordinates)
        //const [zeroX, zeroY] = convertToCanvasCoords(canvas, 0, 0, SQUARE_SIZE);
        drawPointAt(ctx, pixelX2, pixelY2, 3, 'blue');

        //console.error(valueX, valueY, pixelX, pixelY);
        // to graph coordinates
        dataPoints.push([valueX2, valueY2]);
    }
}


function redraw() {

    setUpCanvas(ctx, canvas.width, canvas.height, 'white');
    drawAxis(canvas, SQUARE_SIZE /* square size */);

    const nb_points = 100;
    if (PROBLEM == 'lr') {
        generateLRPoints(nb_points) // nb of points to generate
    } else {
        // log_reg
        generateLogRegPoints(nb_points); // in 2 classes
    }
    //console.log(dataPoints);

    const t0 = performance.now();
    let theta;
    if(METHOD == 'BatchGD') {
        theta = gradientDescent(dataPoints);
    } else if (METHOD == 'SGD') {
        theta = stochasticGradientDescent(dataPoints);
    }
    const t1 = performance.now();

    console.error(theta)
    const intercept = PROBLEM == 'lr' ? theta[0][0] : - (theta[0][0] / theta[2][0]),
        slope = PROBLEM == 'lr' ? theta[1][0] : -(theta[1][0] / theta[2][0]);

    document.querySelector("#intercept").innerText = round(intercept, 4);
    document.querySelector("#slope").innerText = round(slope, 4);

    document.querySelector("#timings").innerHTML = `<b>${METHOD}</b> finished in ${round(t1 - t0, 0)} ms.`;

    drawSolution(theta, null); // final linear model solution
}

// solution lines
const colors = ['gray'];

function drawSolution(theta, epoch=null) {

    //console.log("intercept:", intercept);
    //console.log("slope:", slope);

    const intercept = PROBLEM == 'lr' ? theta[0][0] : -(theta[0][0] / theta[2][0]),
        slope = PROBLEM == 'lr' ? theta[1][0] : -(theta[1][0] / theta[2][0]);

    const point1X = -5;
    const point1Y = slope * point1X + intercept;
    const point2X = 15;
    const point2Y = slope * point2X + intercept;

    // from graph-coordinate to pixel/canvas-coordinates
    const [pt1X , pt1Y] = convertToCanvasCoords(canvas, point1X, point1Y, SQUARE_SIZE);
    const [pt2X , pt2Y] = convertToCanvasCoords(canvas, point2X, point2Y, SQUARE_SIZE);
    //console.log(pt1X, pt1Y, pt2X, pt2Y)

    // offset ?!
    //const [zeroX, zeroY] = convertToCanvasCoords(canvas, 0, 0, SQUARE_SIZE);
    //console.log("zeros:", zeroX, zeroY);
    //console.log(">>>>", pt1X, zeroY - pt1Y, pt2X, zeroY - pt2Y)

    const size = epoch == null ? 2.5 : 0.33;
    const color = epoch == null ? "red" : colors[epoch % colors.length];

    drawLine(
        ctx,
        pt1X, // left point x
        pt1Y, // left point y
        //zeroY - pt1Y,
        pt2X, // right x
        pt2Y, // right y
        //zeroY - pt2Y,
        size,
        color
    );
}

main();
