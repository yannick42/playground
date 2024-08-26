import { Neuron } from './neuron.js';

export class Layer {

    constructor(nIn, nOut) {
        this.neurons = Array.from({length: nOut}).map(() => new Neuron(nIn))
    }

    call(x) {
        return this.neurons.map(n => n.call(x));
    }

    parameters() {
        return this.neurons.flatMap(n => n.parameters());
    }

}