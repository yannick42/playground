import { Value } from './value.js';
import { randFloat } from '../common/common.helper.js';

export class Neuron {

    constructor(nIn) {
        this.w = Array.from({ length: nIn }).map(() => new Value(randFloat(-1, 1)));
        this.b = new Value(randFloat(-1, 1));
    }

    call(x) {
        // w * x + b
        const act = (x.map((x_, i) => this.w[i].mul(x_)).reduce((acc, value) => acc.add(value))).add(this.b);
        const out = act.tanh()
        return out;
    }

    parameters() {
        return [...this.w, this.b];
    }

}
