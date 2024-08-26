
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';

import { Value } from './value.js';
import { Neuron } from './neuron.js';
import { Layer } from './layer.js';
import { MLP } from './MLP.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

function main() {
    //document.querySelector("#refresh").addEventListener('click', (e) => redraw());

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





    const xs = [
        [2, 3, -1],
        [3, -1, 0.5],
        [0.5, 1, 1],
        [1, 1, -1],
    ];
    const ys = [1, -1, -1, 1]; // targets
    const m = new MLP(3, [4, 4, 1]);


    let preds;

    for(let i = 0; i < 200; i++) {
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
        console.log("loss=", loss.data);

        //
        // Update / Nudge a tiny bit in the opposite of the gradient direction, to lower the loss
        //
        for(let p of m.parameters()) {
            p.data += -0.1 * p.grad;
        }
    }

    console.log(preds.map(p => p[0].data));

}

main();
