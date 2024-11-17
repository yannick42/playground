import { randInt, randFloat } from '../_common/common.helper.js'
import { createDAG, dfs } from '../_common/graph.js'

export function mutate(g, perc=0.2, delta=0.1) {
    // mutate the weights by a small delta
    Object.keys(g.customData).forEach(d => {
        if(Math.random() < perc) { // but only 20% of the time...
            g.customData[d] += randFloat(-delta, delta); // mutation !
        }
    })
    return g;
}

export function crossover(g1, g2, newDAG, scheme='single-point') {
    // one-point crossover (TODO: multi-point / uniform / Davis’ Order Crossover (OX1) ...)

    switch(scheme) {
        case 'single-point':
            const cutPosition = randInt(0 , Object.keys(g1.customData).length - 1);

            const firstKeys = Object.keys(g1.customData).slice(0, cutPosition + 1);
            const secondKeys = Object.keys(g2.customData).slice(cutPosition + 1);
            newDAG.customData = Object.assign({},
                ...firstKeys.map(key => ({[key]: g1.customData[key]})),
                ...secondKeys.map(key => ({[key]: g2.customData[key]})));

            break;
        case 'two-point':
            const point_1 = randInt(0 , Object.keys(g1.customData).length - 2);
            const point_2 = randInt(point_1, Object.keys(g1.customData).length - 1);

            const firstKeys_ = Object.keys(g1.customData).slice(0, point_1 + 1);
            const secondKeys_ = Object.keys(g2.customData).slice(point_1 + 1, point_2 + 1);
            const thirdKeys_ = Object.keys(g1.customData).slice(point_2 + 1);

            newDAG.customData = Object.assign({},
                ...firstKeys_.map(key => ({[key]: g1.customData[key]})),
                ...secondKeys_.map(key => ({[key]: g2.customData[key]})),
                ...thirdKeys_.map(key => ({[key]: g1.customData[key]}))
            );

            break;
        case 'uniform':

            newDAG.customData = Object.assign({},
                ...Object.keys(g1.customData).map(key => Math.random() > 0.5 ? g1.customData[key] : g2.customData[key])
            );

            break;
    }
    //console.log("crossover:", newDAG);
    
    dfs(newDAG);
    return newDAG;
}
