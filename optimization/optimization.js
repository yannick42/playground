
import { drawPointAt, drawLine, drawAxis, convertToGraphCoords, convertToCanvasCoords } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';

const SQUARE_SIZE = 10,
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

    let randomX = proposalDist(); // uniform: 0 to 1 along the x-axis
    let randomY = proposalDist(); // uniform: 0 to 1 along the y-axis
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


function redraw() {

    // true parameters to retrieve...
    const a = 0.7; // ax + b (line)
    const b = 100;

    drawAxis(canvas, SQUARE_SIZE /* square size */);

    const MEAN = 0, SIGMA = 1;

    for (let i = -130; i < 370; i++) { // 500 points

        const randX = rejectionSampling(() => Math.random() - 0.5, (x) => gaussian(x, SIGMA, MEAN)) * 20;
        const randY = rejectionSampling(() => Math.random() - 0.5, (x) => gaussian(x, SIGMA, MEAN)) * 200; // ???

        const valueX = i + randX;
        const valueY = a * i + b + randY;
        
        // draw point around the origin
        const [zeroX, zeroY] = convertToCanvasCoords(canvas, 0, 0, SQUARE_SIZE);
        drawPointAt(ctx, zeroX + valueX, zeroY - valueY, 2, 'black');

        dataPoints.push(convertToGraphCoords(canvas, zeroX + valueX, zeroY + valueY, SQUARE_SIZE));
    }

    console.log(dataPoints);

}

main();
