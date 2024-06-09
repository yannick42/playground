import { randInt, randFloat } from './helper.js'
import { createDAG, dfs } from '../common/graph.js'

export function mutate(g, perc=0.2) {
    // mutate by a small amount, around 20% of the weights
    Object.keys(g.customData).forEach(d => {
        //console.log("mutate:", d, g.customData[d]);
        if(Math.random() < perc) { // mutate ?
            g.customData[d] += randFloat(-0.1, 0.1);
        }
    })
    return g;
}

export function crossover(g1, g2, newDAG) {
    // one-point crossover (TODO: multi-point / uniform / Davis’ Order Crossover (OX1) ...)
    const cutPosition = randInt(0 , Object.keys(g1.customData).length - 1);

    const firstKeys = Object.keys(g1.customData).slice(0, cutPosition + 1);
    const secondKeys = Object.keys(g2.customData).slice(cutPosition + 1);

    newDAG.customData = Object.assign({},
        ...firstKeys.map(key => ({[key]: g1.customData[key]})),
        ...secondKeys.map(key => ({[key]: g2.customData[key]})));

    //console.log("crossover:", newDAG);
    
    dfs(newDAG);
    return newDAG;
}
