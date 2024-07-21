
import { setUpCanvas, drawPointAt, drawArrow } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';
import { Graph } from '../common/graph.js'

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

let g;
let vertices = {};

function main() {
    document.querySelector("#refresh").addEventListener('click', (e) => redraw());


    redraw();
}

function drawLineBetween(v1, v2) {
    const x0 = vertices[v1][0];
    const y0 = vertices[v1][1];
    const x1 = vertices[v2][0];
    const y1 = vertices[v2][1];
    drawArrow(ctx, x0, y0, x1, y1, 'blue', 4, 8);
}

function countOddVertices(graph) {
    let nbOdds = 0;
    Object.keys(graph.V).forEach(vertex => {
        nbOdds += graph.adj[vertex]?.length % 2 !== 0 ? 1 : 0;
    })
    console.log(nbOdds)
    return nbOdds;
}

function isEulerian(graph) {
    return countOddVertices(graph) <= 2
}

function redraw() {

    setUpCanvas(ctx, canvas.width, canvas.height, 'white')

    const names = ["A", "B", "C", "D", "E"];
    g = new Graph(names, {})

    names.forEach(name => {
        const x = randInt(0, canvas.width);
        const y = randInt(0, canvas.height);
        vertices[name] = [x, y];
    })

    const house = [
        ["A", "B"],
        ["A", "C"],
        ["B", "C"],
        ["B", "D"],
        ["C", "E"],
        ["D", "E"],
        ["C", "D"],
        ["B", "E"],
    ];

    house.forEach(edge => {
        g.add(edge[0], edge[1]);
        g.add(edge[1], edge[0]);
        drawLineBetween(edge[0], edge[1])
    });

    Object.keys(vertices).forEach(name => drawPointAt(ctx, vertices[name][0], vertices[name][1], 6, "lightblue"))

    console.log(g)

}

main();
