
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';
import { round } from '../common/math.helper.js';

import { Value } from './value.js';

import { MLP } from './MLP.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const lossValueEl = document.querySelector("#loss");
const redrawBtnEl = document.querySelector("#redraw");
const lrValueEl = document.querySelector("#lr");

let LR = 0.005;

function makeMoons(nbPoints, noise = 0.1) {
  const points = [];
  const radius = 1;
  const separation = 0.5;
  const half = Math.floor(nbPoints / 2);

  for (let i = 0; i < half; i++) {
    const angle = Math.PI * Math.random(); // 0 to PI
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    points.push([
      x + noise * (Math.random() - 0.5),
      y + noise * (Math.random() - 0.5),
      0 // class label
    ]);
  }

  for (let i = 0; i < nbPoints - half; i++) {
    const angle = Math.PI * Math.random(); // 0 to PI
    const x = radius * Math.cos(angle);
    const y = -radius * Math.sin(angle) + separation;
    points.push([
      x + radius + noise * (Math.random() - 0.5),
      y + noise * (Math.random() - 0.5),
      1 // class label
    ]);
  }

  return points;
}

function main() {
    redrawBtnEl.addEventListener('click', (e) => {
        redraw();
    });

    lrValueEl.addEventListener('change', (e) => LR = e.target.value)

    redraw();
}

function redraw() {
    setUpCanvas(ctx, canvas.width, canvas.height, 'white');
    
    /*
    const   x1 = new Value(-3, 'x1'),
            w1 = new Value(2, 'w1'),
            x2 = new Value(0, 'x2'),
            w2 = new Value(1, 'w2'),
            b = new Value(6.8813735870195432, 'b');
    const x1w1 = x1.mul(w1);
    const x2w2 = x2.mul(w2);
    const x1w1x2w2 = x1w1.add(x2w2).add(b);
    x1w1x2w2.label = 'n';
    const o = x1w1x2w2.tanh();
    o.label = 'o';

    o.backward();
    */



    /*
    const x = [2, 3];
    const n = new Neuron(2);
    console.log(n.call(x));

    const l = new Layer(2, 3);
    console.log(l.call(x));
    */

    const points = makeMoons(80, 0.2);

    const xs = points.map(sample => [sample[0], sample[1]]);
    const ys = points.map(sample => sample[2]); // targets

    const m = new MLP(2, [5, 5, 1]);

    let preds;
    let lastLoss = Math.inf;

    const patience = 10;
    let current_patience = 0,
        maxI = 0;

    const time1 = performance.now();
    for(let i = 0; i < 5000; i++) {
        //
        // Forward pass
        //
        preds = xs.map(xx => m.call(xx));

        // loss
        const loss = (ys.map((ygt, i) => (preds[i][0].sub(ygt)).pow(2)))       // find difference
                        .reduce((acc, value) => acc.add(value), new Value(0)); // sum all
        
        //
        // Backward pass
        //
        for(let p of m.parameters()) {
            p.grad = 0; // zero grad
        }
        loss.backward();
        if(i % 100 == 0) {
            console.log("loss=", loss.data);
            lossValueEl.innerHTML = "Loss value : " + round(loss.data, 3) + " (" + i + " iterations)";
        }

        //
        // Update / Nudge a tiny bit in the opposite of the gradient direction, to lower the loss
        //
        for(let p of m.parameters()) {
            p.data += -LR * p.grad;
        }

        if (Math.abs(lastLoss - loss.data) < 0.001) {
            current_patience++;
            //console.warn(current_patience)
            if(patience <= current_patience) {
                break;
            }
        } else {
            current_patience = 0;
        }

        lastLoss = loss.data;
        maxI = i;
    }
    lossValueEl.innerHTML = "Loss value : " + round(lastLoss, 3) + " (" + (maxI + 1) + " iterations in " + round(performance.now() - time1) + " ms.)";

    preds.map(p => p[0].data);

    for (let x = 0; x < canvas.width; x += 2) {
        for (let y = 0; y < canvas.height; y += 2) {
            const pred = m.call([(x - 200) / 100, - (y - 300) / 150])
            ctx.fillStyle = pred[0].data < 0.5 ? '#ADD8E6' : '#fae2b3';
            ctx.fillRect(x, y, 2, 2);
        } 
    }

    for (const [x, y, label] of points) {
        ctx.beginPath();
        ctx.arc(200 + x * 100, 300 - y * 150, 3, 0, 2 * Math.PI);
        ctx.fillStyle = label === 0 ? 'steelblue' : 'orange';
        ctx.fill();
    }

}

main();
