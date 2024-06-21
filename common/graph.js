
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
    g.toposort.splice(0, g.toposort.length); // erase array

    Object.keys(g.V).forEach(vertex => {
        if(g.V[vertex].color === WHITE) {
            dfs_visit(g, vertex);
        }
    });

    //console.log("end ?");
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

    g.toposort.unshift(start_vertex); // add this vertex at the front of the list
}

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
