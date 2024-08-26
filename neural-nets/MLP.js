import { Layer } from './layer.js';

export class MLP {
    constructor(nIn, nOut) {
        const sizes = [nIn].concat(nOut);
        this.layers = Array.from({ length: nOut.length }).map((_, i) => new Layer(sizes[i], sizes[i+1]));
    }

    call(x) {
        this.layers.forEach(l => x = l.call(x));
        return x;
    }

    parameters() {
        return this.layers.flatMap(l => l.parameters());
    }

}
