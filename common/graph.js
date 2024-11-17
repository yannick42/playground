import { setUpCanvas, drawPointAt, drawLine, drawArrow } from './canvas.helper.js';
import { randInt } from './common.helper.js';
import { computeBézierCurve } from './math.helper.js';

// A simple Graph class
export class Graph {
    V = {} // vertices
    adj = {} // adjacency list

    customData = {};
    fitness = 0;
    toposort = [];

    constructor(V, adj) {
        this.V = Object.assign({}, ...V.map(vertex => ({ [vertex]: DEFAULT})));
        this.adj = adj;
        this.toposort = [];
    }

    reinit() {
        Object.keys(this.V).forEach(vertex => {
            this.V[vertex] = Object.assign({}, DEFAULT);
        });
    }

    weight(link, value) {
        this.customData[link] = value;
    }

    getWeight(link) {
        return this.customData[link];
    }

    countEdges() {
        let count = 0;
        Object.keys(this.adj).forEach(vertex => {
            count += this.adj[vertex].length;
        })
        return count;
    }

    // add vertices if necessary
    add(from, to) {
        //console.log("add:", from, to);
        if(! Object.keys(this.V).includes(from)) {
            this.V[from] = Object.assign({}, DEFAULT);
        }
        if(! Object.keys(this.V).includes(to)) {
            this.V[to] = Object.assign({}, DEFAULT);
        }
        if(! this.adj[from]?.includes(to)) {
            if(this.adj[from]) {
                this.adj[from].push(to);
            } else {
                this.adj[from] = [to];
            }
        }
    }

    hasEdge(v1, v2) {
        //console.log(this.adj, v1, this.adj[v1], v2);
        return this.adj[v1].includes(v2);
    }
}

//
// GRAPH + topological sort
//

const WHITE = 0;
const GRAY = 1;
const BLACK = 2;
const DEFAULT = { color: WHITE, pred: null, d: null, f: null, };

let TIME;

export function dfs(g) {

    TIME = 0; // reinit
    g.toposort.splice(0, g.toposort.length); // erase array

    Object.keys(g.V).forEach(vertex => {
        if(g.V[vertex].color === WHITE) {
            dfs_visit(g, vertex);
        }
    });

    //console.log("end ?");
}

export function dfs_visit(g, start_vertex) {
    TIME += 1
    g.V[start_vertex].d = TIME; // discovery time
    g.V[start_vertex].color = GRAY;

    g.adj[start_vertex]?.forEach(end_vertex => {
        if(g.V[end_vertex].color === WHITE) {
            g.V[end_vertex].pred = start_vertex;
            dfs_visit(g, end_vertex);
        }
    });

    TIME += 1;
    g.V[start_vertex].f = TIME; // finish time
    g.V[start_vertex].color = BLACK;

    g.toposort.unshift(start_vertex); // add this vertex at the front of the list
}





/**
 * DAG for Neural Network
 * 
 */

export let nb_params = 0;
export function createDAG(sizes) {
    const   vertices = [],
            adjacency = {};
    const g = new Graph(vertices, adjacency);

    nb_params = 0;

    // example :
    // 5 input, 3 hidden neurons (in 1 layer), 3 output
    //      => 5*3 + 3*3 = 24 parameters ?

    const nb_input = sizes[0];
    const hiddens = sizes.slice(1, sizes.length - 1);
    const nb_output = sizes[sizes.length - 1];

    // Input to 1st hidden layer
    for(let i = 0; i < nb_input; i++) {
        for(let j = 0; j < hiddens[0]; j++) {
            const from = "I_" + (i + 1);
            const to = "H_" + (j + 1);
            g.add(from, to);
            g.weight(from+"-"+to, Math.random() * 2 - 1);
            nb_params += 1;
        }
    }

    // Hidden layer to output layer
    for(let i = 0; i < nb_output; i++) {
        for(let j = 0; j < hiddens[0]; j++) {
            const from = "H_" + (j + 1);
            const to = "O_" + (i + 1);
            g.add("H_" + (j + 1), "O_" + (i + 1));
            g.weight(from+"-"+to, Math.random() * 2 - 1);
            nb_params += 1;
        }
    }
    
    dfs(g);
    return g;
}


const vertexPositions = {};
export function draw(canvas, graph) {
    const ctx = canvas.getContext("2d");

    const colors = ["blue", "green", "red"];

    setUpCanvas(ctx, canvas.width, canvas.height)

    const nbVertices = Object.keys(graph.V).length;

    // add points at random on the graph
    Object.keys(graph.V).forEach((vertex, i) => {
        const color = colors[i % colors.length];

        graph.V[vertex].color = color;

        vertexPositions[vertex] = [
            Math.sin(2 * Math.PI / nbVertices * i) * 200 + canvas.width / 2,
            Math.cos(2 * Math.PI / nbVertices * i) * 200 + canvas.width / 2
        ]

        drawPointAt(ctx, vertexPositions[vertex][0], vertexPositions[vertex][1], 10, color);
    });


    Object.keys(graph.adj).forEach(fromVertex => {

        const color = graph.V[fromVertex].color;

        graph.adj[fromVertex].forEach(toVertex => {
            console.log("to", toVertex);



            const points = [
                vertexPositions[fromVertex],
                vertexPositions[toVertex]
            ];

            const curvePoints = computeBézierCurve(
                ctx,
                points
                ,[
                    [
                        vertexPositions[fromVertex][0], vertexPositions[fromVertex][1],
                        canvas.width/2, canvas.height/2 // in direction of the center ?
                    ],[
                        vertexPositions[toVertex][0], vertexPositions[toVertex][1],
                        canvas.width/2, canvas.height/2 // in direction of the center ?
                    ]
                ],
                1/20
            );

            const lineWidth = 4;

            // draw curve
            const nbCurvePoints = curvePoints.length;
            curvePoints.forEach((point, i) => {
                if(i + 1 === nbCurvePoints) return; // last point
                drawLine(ctx, point[0], point[1], curvePoints[i+1][0], curvePoints[i+1][1], lineWidth, color);
            });
            
            // final end : arrow
            drawArrow(
                ctx,
                // from
                curvePoints[nbCurvePoints-2][0],
                curvePoints[nbCurvePoints-2][1],
                // to
                curvePoints[nbCurvePoints-1][0],
                curvePoints[nbCurvePoints-1][1],
                color,
                lineWidth,
                /*head_len*/ 10
            );

        });
    })

    // draw in front
    Object.keys(graph.V).forEach(vertex => {
        const color = graph.V[vertex].color;

        ctx.font = "14px Arial";
        ctx.fillStyle = color;
		ctx.fillText(vertex, vertexPositions[vertex][0] + 10, vertexPositions[vertex][1] - 10);
    });

}