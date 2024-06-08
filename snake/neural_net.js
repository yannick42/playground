
export function computeOutput(g, inputs) {

    const temp = {
        'I_1': inputs.wallW,
        'I_2': inputs.wallN,
        'I_3': inputs.wallE,
        'I_4': inputs.wallS,
        'I_5': inputs.size
    }; // cumulate computations

    const neuronsPerLayer = [5, 3, 3];
    let j = 0, i = 0;
    const activationDone = [];

    g.toposort.forEach((neuron) => {
        //console.log(`Calculating ${neuron} linked to ${g.adj[neuron] ?? 'no'} neurons`);

        // outputs
        if(!g.adj[neuron]) {
            temp[neuron] = Math.tanh(temp[neuron]);
            //console.error(`${neuron} > after activation : ${temp[neuron]}`);
        }

        // accumulate weights additions into temp[nextNeuron]
        g.adj[neuron]?.forEach(nextNeuron => {
            const link = neuron+"-"+nextNeuron;
            const weight = g.getWeight(link); // weight of the link
            //console.log(`(${link}) weight: ${weight}`)

            if(!temp[nextNeuron]) temp[nextNeuron] = 0;
            temp[nextNeuron] += temp[neuron] * weight;
            
            //console.log(`accumulate ${neuron} ${nextNeuron} ${temp[nextNeuron]}`);

            if(i >= neuronsPerLayer[j] * neuronsPerLayer[j+1] && !activationDone.includes(neuron)) {
                activationDone.push(neuron);
                //console.log("i:", i);
                // accumulation finish -> apply activation function (to add non-linearity)
                temp[neuron] = Math.tanh(temp[neuron]);
                //console.warn(`${neuron} > after activation : ${temp[neuron]}`);
            }

            if(i >= neuronsPerLayer[j] * neuronsPerLayer[j+1] + neuronsPerLayer[j+1] * neuronsPerLayer[j+2]) {
                j += 1; // pass to next "layer"
                i = 0; // reinitialize the count of neurons ?
            }

            i += 1;
        });
    });

    const outputs = [temp['O_1'], temp['O_2'] , temp['O_3']];
    //console.warn("outputs:", outputs);
    const proba = softmax(outputs);
    //console.warn("proba:", proba);

    return proba;
}

export function softmax(arr) {
    // Calculate the exponential of each value
    const expValues = arr.map(value => Math.exp(value));
    
    // Calculate the sum of the exponential values
    const sumExpValues = expValues.reduce((acc, value) => acc + value, 0);
    
    // Divide each exponential value by the sum to get the softmax values
    const softmaxValues = expValues.map(value => value / sumExpValues);
    
    return softmaxValues;
}

export function argmax(arr) {
    if (arr.length === 0) {
        throw new Error("The array cannot be empty");
    }

    let maxIndex = 0;
    let maxValue = arr[0];

    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > maxValue) {
            maxIndex = i;
            maxValue = arr[i];
        }
    }

    return maxIndex;
}
