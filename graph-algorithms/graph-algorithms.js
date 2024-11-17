
import { setUpCanvas, drawPointAt, drawLine, drawArrow } from '../_common/canvas.helper.js';
import { randInt, choice } from '../_common/common.helper.js';
import { Graph } from '../_common/graph.js';
import { Vector2D } from '../_common/vector2D.js';
import { computeBézierCurve, distance } from '../_common/math.helper.js';
import { convertToRGB, RGBToHSL } from '../_common/color.js';
import { UF } from '../_common/union-find.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const algorithmEl = document.getElementById('algorithm');
const newGraphBtn = document.getElementById('new_graph');
const debugEl = document.getElementById("debug");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

let g;
let vertices = {};
const edges = [];

function main() {
    //document.querySelector("#refresh").addEventListener('click', (e) => redraw());
    algorithmEl.addEventListener('change', (e) => {
        redraw();
    });
    newGraphBtn.addEventListener('click', (e) => {
        g = createGraph();
        redraw();
    });

    g = createGraph();

    redraw();
}

function drawLineBetween(v1, v2, color='blue', lineWidth=4, headLen=0) {
    const x0 = vertices[v1].x;
    const y0 = vertices[v1].y;
    const x1 = vertices[v2].x;
    const y1 = vertices[v2].y;
    drawArrow(ctx, x0, y0, x1, y1, color, lineWidth, headLen);
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

function createGraph() {

    const n = 7;
    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const names = ALPHABET.substr(0, n).split('');
    //console.log(names); // ['A', 'B', ...]

    g = new Graph(names, {})

    // initial random placement (centered)
    names.forEach(name => {
        const x = randInt(WIDTH / 2 - 150, WIDTH / 2 + 150);
        const y = randInt(HEIGHT / 2 - 150, HEIGHT / 2 + 150);
        vertices[name] = new Vector2D(x, y);
    })

    /* // debug
    const houseEdges = [
        ["A", "B"],
        ["A", "C"],
        ["B", "C"],
        ["B", "D"],
        ["C", "E"],
        ["D", "E"],
        ["C", "D"],
        ["B", "E"],
    ];
    */

    // create a complete graph K_n
    for(let i = 0; i < n; i++) {
        for(let j = i + 1; j < n; j++) {
            edges.push([ALPHABET[i], ALPHABET[j]]);
        }
    }

    // add it to the graph
    edges.forEach(edge => {
        // added in both directions (= undirected graph)
        g.add(edge[0], edge[1]);
        g.add(edge[1], edge[0]);
    });

    //console.log(edges); // [['A', 'B'], [...], ...]

    //
    // A force-directed graph drawing algorithm by Peter Eades (1984) using SPRINGs and Electrical Forces
    // https://cs.brown.edu/people/rtamassi/gdhandbook/chapters/force-directed.pdf
    // 
    const M = 100,
        // attraction
        c1 = 0.1,   // attraction constant (inverse: greater = less spring "attraction")
        c2 = 100,    // higher = more attraction
        // repulsion
        c3 = 10_000,
        // control updates
        c4 = 0.5; // some kind of damping ?

    const forces = {};

    for(let i = 0; i < M; i++) {

        Object.keys(vertices).forEach(vertex => {
            forces[vertex] = new Vector2D(0, 0); // (re)init force vector
        });

        Object.keys(vertices).forEach(vertex => {

            Object.keys(vertices).forEach(vertex2 => {
                if(vertex === vertex2) return; // for each pairs of vertex

                let force = new Vector2D(0, 0);

                const d = vertices[vertex].sub(vertices[vertex2]);
                const dist = Math.max(d.mag(), 0.1); // avoid division by zero

                //console.log(dist)

                if(g.hasEdge(vertex, vertex2)) // if linked
                {
                    // Spring => Hooke's law but not linear
                    const springForce = d.unit().mul(c1 * Math.log(Math.abs(dist / c2)));
                    force = force.add(springForce)
                }
                
                // the repel forces (even if a link between the node...)
                const repelForce = d.unit().mul(c3 / Math.pow(dist, 2));
                force = force.add(repelForce);
                
                // apply force from this other vertex "vertex2" on this one ("vertex")
                forces[vertex] = forces[vertex].add(force);

            });
        }); // after this, all forces has been computed

        Object.keys(vertices).forEach(vertex => {
            //console.log("vertex:", vertex, forces[vertex].mul(c4))
            vertices[vertex] = vertices[vertex].add(forces[vertex].mul(c4));

            //
            // "wall" constraints
            //
            const MARGIN = 20;

            if(vertices[vertex].x < MARGIN) {
                vertices[vertex].x = MARGIN;
            }
            if(vertices[vertex].y < MARGIN) {
                vertices[vertex].y = MARGIN;
            }
            if(vertices[vertex].x > canvas.width - MARGIN) {
                vertices[vertex].x = canvas.width - MARGIN;
            }
            if(vertices[vertex].y > canvas.height - MARGIN) {
                vertices[vertex].y = canvas.height - MARGIN;
            }
        });
    }

    // compute and store edge weight (based on vertices distance)
    Object.keys(g.adj).forEach(from => {
        g.adj[from].forEach(to => {
            const dist = distance(vertices[from].x, vertices[from].y, vertices[to].x, vertices[to].y);
            g.weight(`${from}-${to}`, dist);
        });
    });

    return g;
}


function redraw() {
    setUpCanvas(ctx, WIDTH, HEIGHT, 'white');
    debugEl.innerHTML = '';

    console.log(g);

    switch(algorithmEl.value) {
        case "hierholzer":
            hierholzer(g);
            break;
        case "kruskal":
            kruskal(g);
            break;
    }



    // vertex dot
    Object.keys(vertices).forEach(name => {
        drawPointAt(ctx, vertices[name].x, vertices[name].y, 5, "blue");
    })

    // vertex names
    Object.keys(vertices).forEach(name => {
        // Text
        ctx.fillStyle = 'blue';
        ctx.font = '15pt monospace';
        ctx.fillText(name, vertices[name].x + 8, vertices[name].y - 8)
    })

    // Draw thin blue lines
    edges.forEach(edge => {
        console.log(edge[0], edge[1]);
        drawLineBetween(edge[0], edge[1], 'blue', 0.5)
    });

}








function hierholzer(g) {

    // TODO: check if Eulerian path is possible

    // get initial vertex (an odd degree vertex if any)
    let initialVertex;
    Object.keys(g.adj).forEach(vertex => {
        if(g.adj[vertex].length % 2 == 1) {
            initialVertex = vertex;
        }
    })
    // else, start with any vertex
    if(! initialVertex) initialVertex = choice(Object.keys(g.V))



    console.log("initial vertex:", initialVertex)


    const visitedEdges = new Set();

    const tour = [initialVertex];

    const NB_VERTICES = Object.keys(g.V).length;

    let current_vertex, index;

    while(visitedEdges.size < g.countEdges()) {

        // in reversed order
        for(let i = tour.length - 1; i >= 0; i--) { // find a vertex with remaining edges

            if((new Set(g.adj[tour[i]].map(toVertex => tour[i]+"-"+toVertex))).difference(visitedEdges).size > 0) {
                current_vertex = tour[i]; // found !
                index = i;
            } else {
                continue; // try "next"
            }
        }

        // find subtour at "vertex"
        if(current_vertex) {
            const new_subtour = []
            let vertex = current_vertex;
            while(vertex) {
                new_subtour.push(vertex); // add it

                // chosen a random "next vertex" among the available paths
                const adjacentVertices = g.adj[vertex];
                const edgesAtVertex = new Set(adjacentVertices.map(toVertex => vertex+"-"+toVertex))
                const unvisited_at_vertex = (edgesAtVertex).difference(visitedEdges);
                
                const chosenVertex = choice([...unvisited_at_vertex].map(v => v.split("-")[1])); // can be null... if no more choice

                if(chosenVertex !== undefined) {
                    // mark its edge as visited (in both directions !)
                    visitedEdges.add(vertex+"-"+chosenVertex);
                    visitedEdges.add(chosenVertex+"-"+vertex);
                }

                vertex = chosenVertex; // use it as the next value
            }

            // append to the "main" tour
            tour.splice(index, 1, ...new_subtour);
            console.log(new_subtour, "added to tour:", tour);

        } else {
            break; // ?!
        }
    }



    // starting color
    const rgb = convertToRGB("tomato").substr(1).match(/.{2}/g);
    console.log(rgb);
    const hsl = RGBToHSL(...rgb.map(value => parseInt(value, 16)));
    console.log(hsl);

    tour.forEach((vertex, i) => {

        if(i > 0) {

            const color = `hsl(${Math.round(hsl[0]+(i*10) % 360)}deg, ${hsl[1]}%, 50%)`;
            console.log(color)

            const lineWidth = 0.25 * (tour.length - i) + 3;

            const pt1 = [vertices[tour[i-1]].x, vertices[tour[i-1]].y];
            const pt2 = [vertices[vertex].x, vertices[vertex].y];

            const arrows = [
                [pt1[0], pt1[1], pt1[0]+randInt(-0, 0), pt1[1]],
                [pt2[0], pt2[1], pt2[0]+randInt(-0, 0), pt2[1]]
            ];

            const curvePoints = computeBézierCurve(ctx, [pt1, pt2], arrows, 1/25);

            // draw curve
            const nbCurvePoints = curvePoints.length;
            curvePoints.forEach((point, i) => {
                if(i + 1 === nbCurvePoints) return; // last point
                drawLine(ctx, point[0], point[1], curvePoints[i+1][0], curvePoints[i+1][1], lineWidth, color);
            });

            // final end : arrow
            drawArrow(
                ctx,
                curvePoints[nbCurvePoints-2][0],
                curvePoints[nbCurvePoints-2][1],
                curvePoints[nbCurvePoints-1][0],
                curvePoints[nbCurvePoints-1][1],
                color,
                lineWidth,
                /*head_len*/ 6
            );

        }

    });

    // show list of ordered vertex producing the tour
    debugEl.innerHTML = `<u>Tour</u> : ${tour.map((vertex, i) => {
        const color = `hsl(${Math.round(hsl[0]+(i*10) % 360)}deg, ${hsl[1]}%, 50%)`;
        return `<span style="color: ${color}">${vertex}</span>`
    }).join('&rightarrow;')}
        <br/>
        <i><u>Length</u> : ${tour.length - 1}</i> edges
    `;

}

/**
 * a greedy algorithm
 */
function kruskal(g) {

    // create UNION-FIND data structure
    const unionFind = new UF();
    unionFind.makeSet(Object.keys(g.V));
    //console.log(unionFind, unionFind.size()); // 7 disjoint elements

    // /!\ both direction are present
    const sortedEdges = Object.entries(g.customData).sort(([,a],[,b]) => a-b);
    console.log(sortedEdges)

    const edges = [];
    while(sortedEdges.length && unionFind.size() > 1) {
        const minEdge = sortedEdges.shift(); // get minimal element
        sortedEdges.shift(); // also remove its opposite direction ...

        const [from, to] = minEdge[0].split("-");
        if(unionFind.find(from) !== unionFind.find(to)) {
            unionFind.union(from, to);
            console.log("add edge:", from, "-", to)
            edges.push([from, to]);
        } else {
            // already in same tree -> try next
        }
    }
    //unionFind.printSet();

    edges.forEach(edge => {
        const point = vertices[edge[0]];
        const point2 = vertices[edge[1]];
        drawLine(ctx, point.x, point.y, point2.x, point2.y, 5, 'black');

    })



}

main();
