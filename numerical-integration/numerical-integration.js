
import { setUpCanvas, drawPointAt, drawArrow, drawLine, drawAxis, convertToGraphCoords, convertToCanvasCoords } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';
import { round } from '../common/math.helper.js';
import { gaussian } from '../common/stats.helper.js';

const canvas = document.getElementById("error");
const ctx = canvas.getContext("2d");
const fnCanvas = document.getElementById("function");
const fnCtx = fnCanvas.getContext("2d");

const debugEl = document.getElementById('debug');
const fnEl = document.getElementById('fn');
const fromEl = document.getElementById('from');
const toEl = document.getElementById('to');
const nEl = document.getElementById('n');

const methods = {
    rectangle: {
        name: 'Rectangle/midpoint rule',
        color: 'DarkSlateGray',
    },
    trapezoidal: {
        name: 'Trapezoidal method',
        color: 'MediumOrchid',
    },
    'simpson-1-3': {
        name: "Simpson's rule 1/3",
        color: 'Tomato',
    },
    'simpson-3-8': {
        name: "Simpson's rule 3/8",
        color: 'DarkTurquoise',
    },
    'boole': {
        name: "Boole's rule (1860 ?)",
        color: 'DeepSkyBlue',
    },
    'romberg': {
        name: "<a href='https://en.wikipedia.org/wiki/Romberg%27s_method'>Romberg's method</a> (1955)",
        //color: 'CadetBlue',
        info: 'applies Richardson extrapolation to accelerate?'
    },
    'gaussian-quad': {
        name: '(n=2)-point Gaussian quadrature rule',
        color: 'red',
        info: 'Gauss (1814). Reformulated by Jacobi (1826) using orthogonal polynomials. In this method, points are no longer equally spaced.'
    },
    'clenshaw': {
        name: 'Clenshaw-Curtis quadrature (1960)',
        //color: 'orange',
        info: 'uses Chebyshev nodes/polynomial, DCT, cosine series, FFT'
    }
};

const nb_methods = Object.keys(methods).length;

function main() {
    document.querySelector("#refresh").addEventListener('click', (e) => redraw());

    redraw();
}

function integrate(method, f, a, b, N=2) {

    // uniform spacing of xs
    const h = (b - a) / N;
    let sum;

    switch(method) {
        case "rectangle":

            sum = 0;
            for(let k = 1; k <= N; k++) {
                sum += f(a + h*k) * h;
            }

            break;
        case "trapezoidal":

            sum = 0;
            for(let k = 1; k <= N; k++) {
                sum += (f(a + h*(k-1)) + f(a + h*k)) * h / 2;
            }

            break;

        case "simpson-1-3": // composite "version" (n>2)
            // faster convergence the trapezoidal in general
            // based on quadratic interpolation ?
            if((N+1) % 2 !== 0) return;

            sum = f(a) + f(b); // x_0=a / x_n=b
            for(let k = 1; k <= N - 1; k++) {
                const x_k = a + h*k
                sum += (k % 2 === 0 ? 2 : 4) * f(x_k)
            }
            sum *= 1/3 * h;

            break;
        
        case "simpson-3-8": // composite "version" (n>2)
            // based on cubic interpolation ?
            if((N+1) % 2 !== 0) return;

            sum = f(a) + f(b); // x_0=a / x_n=b
            for(let k = 1; k <= N - 1; k++) {
                const x_k = a + h*k
                sum += (k % 3 === 0 ? 2 : 3) * f(x_k)
            }
            sum *= 3/8 * h;

            break;
        
        case "boole": // composite version : https://en.wikipedia.org/wiki/Boole%27s_rule

            if(N % 4 !== 0) { // only i
                sum = undefined;
            } else {

                sum = 0;
                for(let k = 0; k <= N; k++) {
                    const x_k = a + h*k;
                    let term;

                    if(k === 0 || k === N) {
                        term = 7 * f(x_k)
                    } else if(k % 2 === 1) { // k is odd: 1, ..., N-1
                        term = 32 * f(x_k)
                    } else if((k % 4 - 2) === 0) { // k=2, 6, 10, ..., N-2
                        term = 12 * f(x_k)
                    } else if (k % 4 === 0) { // k=4, 8, 12, ..., N-4
                        term = 14 * f(x_k)
                    } else {
                        // impossible
                    }

                    sum += term
                }
                sum *= 2*h/45;
            }
            break;
        
        case "gaussian-quad":
            //
            // see Section 4.6 of Numerical Recipes (2007)
            //
            const xs = [
                0.1488743389816312,
                0.4333953941292472,
                0.6794095682990244,
                0.8650633666889845,
                0.9739065285171717
            ];

            const ws = [
                0.2955242247147529,
                0.2692667193099963,
                0.2190863625159821,
                0.1494513491505806,
                0.0666713443086881
            ];

            const xm = (b+a)/2,
                  xr = (b-a)/2;
            
            sum = 0;
            for(let j = 0; j < 5; j++) {
                const dx = xr * xs[j];
                sum += ws[j] * (f(xm+dx) + f(xm-dx));
            }
            sum *= xr; // scale the result to the range of integration

            //console.log("sum:", sum); // TODO: n-points !
            break;
        default:
            return;
    }
    return sum;
}

const SQUARE_SIZE_1 = 35;

function redraw() {

    setUpCanvas(ctx, 800, 250, 'white');

    debugEl.innerHTML = '';

    const N_MAX = (nEl.value ?? 30) + 1;

    let fn,
        a = parseFloat(fromEl.value),
        b = parseFloat(toEl.value);

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
        case "gaussian":
            fn = (x) => gaussian(x) // default : mean=0, sigma=1
            break;
    }

    Object.keys(methods).forEach(method => {
        methods[method].values = [];
        if(methods[method].color) {
            for(let n = 2; n <= N_MAX; n++) {
                methods[method].values.push( // stored to show error's evolution with N
                    integrate(method, fn, a, b, n-1)
                );
            }
        }
    });

    // use the current best(?) method
    const trueValue = round(integrate('simpson-3-8', fn, a, b, 10001), 6);

    //
    // Debugging info
    //

    //  (at N=${N_MAX - 1}) ?
    let debugMessage = `<table>
        <thead> <td> Best methods </td> <td> value found </td> <td> error </td> </thead>
    `;
    Object.keys(methods).sort((a, b) => {
        const methodObjA = methods[a];
        const valuesA = methodObjA.values;
        const lastIndexWithDataA = valuesA[valuesA.length - 1] != undefined ? valuesA.length - 1 : valuesA.length - 2;

        const methodObjB = methods[b];
        const valuesB = methodObjB.values;
        const lastIndexWithDataB = valuesB[valuesB.length - 1] != undefined ? valuesB.length - 1 : valuesB.length - 2;
        
        return Math.abs(valuesB[lastIndexWithDataB] - trueValue) > Math.abs(valuesA[lastIndexWithDataA] - trueValue) ? -1 : 1;
    }).forEach(method => {
        const methodObj = methods[method];
        const values = methodObj.values;
        const lastIndexWithData = values[values.length - 1] != undefined ? values.length - 1 : values.length - 2;
        debugMessage += `<tr>
            <td> <b style="color: ${methodObj.color}">${methodObj.name}</b> ${methodObj.info ? ' <span class="info" title="' + methodObj.info + '">🛈</span>' : ''}</td>
            <td> ${methodObj.color ? round(values[lastIndexWithData], 6) : '<mark>TODO...</mark>'} </td>
            <td> ${methodObj.color ?  round(Math.abs(values[lastIndexWithData] - trueValue), 6) : ''} </td>
        </tr>`;
    })
    debugMessage += `
        <tr> <td> <hr/> </td> <td> <hr/> </td> <td> <hr/> </td> </tr>
        <tr> <td> <b><i>True value...</i></b> </td> <td> <span id='true-value'><i>${round(trueValue, 10)}</i></span> </td> </tr>
    </table>`;
    debugEl.innerHTML = debugMessage;

    //
    // draw evolution of the error with growing N values
    //
    // if 25px -> 1 in gradation
	drawAxis(canvas, SQUARE_SIZE_1, 0.66, 0.025); // 0.05 = 5% = 1 square => 15px / width

    const magnifyY = 1; // temp
    const lineWidth = 3;

    Object.keys(methods).forEach((method, index) => {
        const methodObj = methods[method];
        const values = methodObj.values;
        const color = methodObj.color;
        values.forEach((yValue, i) => {
            if(yValue != null) // if null, skip
            {
                const error = trueValue - yValue;
                const [x, y] = convertToCanvasCoords(canvas, i + 2, error * magnifyY, SQUARE_SIZE_1); // shifted by 2 (as 0 => 2)
                drawPointAt(ctx, x, y, 3, color);

                if(i < values.length - 1) {
                    // where is next value ?
                    const ii = values[i+1] !== undefined ? 1 : 2;
                    const nextValue = values[i+ii];
                    if(nextValue != null) {
                        const [x2, y2] = convertToCanvasCoords(
                            canvas,
                            i + 2 + ii,
                            (trueValue - nextValue) * magnifyY,
                            SQUARE_SIZE_1
                        );
                        drawLine(ctx, x, y, x2, y2,
                            lineWidth,
                            `color-mix(in srgb, ${color} 50%, transparent)`);
                    }
                }
            }
        });
    })

    showFunction(fn, a, b)
}

const SQUARE_SIZE = 65;

function showFunction(fn, from, to)
{

    setUpCanvas(fnCtx, 800, 250, 'white');
    drawAxis(fnCanvas, SQUARE_SIZE, 0.5, 0.5); // 0.05 = 5% = 1 square => 15px / width

    const surface = [];

    // Draw interval
    let [x1, y1] = convertToCanvasCoords(fnCanvas, from, fn(from), SQUARE_SIZE);
    let [x2, y2] = convertToCanvasCoords(fnCanvas, from, 0, SQUARE_SIZE);
    drawLine(fnCtx, x1, y1, x2, y2, 2, 'orange');
    surface.push([[x2, y2], [x1, y1]]);

    [x1, y1] = convertToCanvasCoords(fnCanvas, to, fn(to), SQUARE_SIZE);
    [x2, y2] = convertToCanvasCoords(fnCanvas, to, 0, SQUARE_SIZE);
    drawLine(fnCtx, x1, y1, x2, y2, 2, 'orange');

    const from_ = -6;
    const to_ = 6;
    const STEP = (to - from) / 80;
    const values = []
    for(let x = from_; x <= to_; x += STEP) {
        const y = fn(x);
        if (x > from_) {
            const [x_, y_] = convertToCanvasCoords(fnCanvas, x - STEP, values[values.length - 1], SQUARE_SIZE);
            const [x2, y2] = convertToCanvasCoords(fnCanvas, x, y, SQUARE_SIZE);

            if(x >= from && x <= to) {
                surface.push([[x, y_], [x2, y2]]);
            }
            drawLine(fnCtx, x_, y_, x2, y2, 2, 'red');
        }
        values.push(y);
    }

    // close interval
    surface.push([[x1, y1], [x2, y2]]);

    fnCtx.beginPath();
    fnCtx.moveTo(surface[0][0][0], surface[0][0][1]);
    surface.forEach(line => fnCtx.lineTo(line[1][0], line[1][1]));
    fnCtx.fillStyle = 'color-mix(in srgb, orange 40%, transparent)';
    fnCtx.fill();
}

main();
