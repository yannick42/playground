
import { setUpCanvas, drawPointAt, drawArrow, drawLine, drawAxis, convertToGraphCoords, convertToCanvasCoords } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';
import { round } from '../common/math.helper.js';

const canvas = document.getElementById("error");
const ctx = canvas.getContext("2d");

const debugEl = document.getElementById('debug');
const fnEl = document.getElementById('fn');
const fromEl = document.getElementById('from');
const toEl = document.getElementById('to');
const nEl = document.getElementById('n');

function main() {
    document.querySelector("#refresh").addEventListener('click', (e) => redraw());

    redraw();
}

function integrate(method, f, a, b, N) {

    // uniform spacing of xs
    const h = (b - a) / N;
    let sum;

    switch(method) {
        case "trapezoidal":

            sum = 0;
            for(let k = 1; k <= N; k++) {
                sum += (f(a + h*(k-1)) + f(a + h*k)) * h / 2;
            }

            break;

        case "simpson-1-3": // composite "version" (n>2)
            // faster convergence the trapezoidal in general
            // based on quadratic interpolation ?
            sum = f(a) + f(b); // x_0=a / x_n=b
            for(let k = 1; k <= N - 1; k++) {
                const x_k = a + h*k
                sum += (k % 2 === 0 ? 2 : 4 ) * f(x_k)
            }
            sum *= 1/3 * h;

            break;
        
        case "simpson-3-8": // composite "version" (n>2)
            // based on cubic interpolation ?
            sum = f(a) + f(b); // x_0=a / x_n=b
            for(let k = 1; k <= N - 1; k++) {
                const x_k = a + h*k
                sum += (k % 3 === 0 ? 2 : 3 ) * f(x_k)
            }
            sum *= 3/8 * h;

            break;
    }
    return sum;
}

function redraw() {

    setUpCanvas(ctx, 800, 250, 'white');

    debugEl.innerHTML = '';

    const N_MAX = nEl.value ?? 30;

    let fn,
        a = fromEl.value,
        b = toEl.value;
    switch(fnEl.value) {
        case "sin":
            fn = (x) => Math.sin(x);
            break;
        case "cos":
            fn = (x) => Math.cos(x);
            break;
        case "poly":
            fn = (x) => Math.pow(x, 2) - x + 1
            break;
    }

    let values1 = [], values2 = [], values3 = [];
    for(let n = 2; n <= N_MAX; n++) {
        values1.push(integrate('trapezoidal', fn, a, b, n-1));
        values2.push(integrate('simpson-1-3', fn, a, b, n-1));
        values3.push(integrate('simpson-3-8', fn, a, b, n-1));
    }

    // use best method ?
    const trueValue = integrate('simpson-3-8', fn, a, b, 10000);

    debugEl.innerHTML += `<table>
        <tr> <td> Method </td> <td> value found with n=${N_MAX} </td> </tr>
        <tr> <td> <b style="color: #ff0000">Trapezoidal method</b> :</td> <td> ${round(values1[values1.length - 1], 6)} </td> </tr>
        <tr> <td> <b style="color: #00ff00">Simpson's rule 1/3</b> :</td> <td> ${round(values2[values2.length - 1], 6)} </td> </tr>
        <tr> <td> <b style="color: #0000ff">Simpson's rule 3/8</b> :</td> <td> ${round(values3[values3.length - 1], 6)} </td> </tr>
        <tr> <td> <b>True value</b> :</td> <td> ${round(trueValue, 6)} </td> </tr>
    </table>`;

    // TODO: draw evolution with N in canvas

	drawAxis(canvas, 15, 0.66, 0.025); // 0.05 = 5% = 1 square => 15px / width

    const magnifyY = 1; // temp

    const colors = ['#ff0000', '#00ff00', '#0000ff'];

    ([values1, values2, values3]).forEach((values, index) => {
        console.log(values);
        values.forEach((value, i) => {
            const error = trueValue - value;
            const [x, y] = convertToCanvasCoords(canvas, i + 2, error * magnifyY, 25);
            drawPointAt(ctx, x, y, 3, colors[index]);


            if(i < values.length - 1) {
                const [x2, y2] = convertToCanvasCoords(canvas, i + 3, (trueValue - values[i+1]) * magnifyY, 25);
                drawLine(ctx, x, y, x2, y2, 2, colors[index]);
            }
        });
    })
}

main();
