
export const toposort = [];

export class Graph {
    V = {} // vertices
    adj = {} // adjacency list

    customData = {};

    constructor(V, adj) {
        this.V = Object.assign({}, ...V.map(vertex => ({ [vertex]: DEFAULT})));
        this.adj = adj;
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
    toposort.splice(0, toposort.length); // erase array

    Object.keys(g.V).forEach(vertex => {
        if(g.V[vertex].color === WHITE) {
            dfs_visit(g, vertex);
        }
    });
}

function dfs_visit(g, start_vertex) {
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

    toposort.unshift(start_vertex); // add this vertex at the front of the list
}