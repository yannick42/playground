import { dfs, dfs_visit, Graph, draw } from '../common/graph.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const refreshGraphEl = document.getElementById("refresh_graph");

/**
 * - Use Kosaraju's algorithm to find Strongly connected components (SCC) in a graph
 * - Convert to an implication graph
 * - find its SCC
 * - check if a contradiction occurs
 * 
 * 
 * TODO : 
 * 
 * 
 */


function main() {
    addEvents();
}

function addEvents() {
    refreshGraphEl.addEventListener('click', (e) => draw(canvas, g));
}


// reverse edges
function reversed(g) {
    const rev_g = new Graph(Object.keys(g.V), {});

    Object.keys(g.adj).forEach(start_vertex => {
        g.adj[start_vertex].forEach(end_vertex => {
            rev_g.add(end_vertex, start_vertex);
        })
    })
    return rev_g;
}




let names = ['Alice', 'Benjamin', 'Charlotte', 'Daniel', 'Emma'];
let selectedNames = [];
const pairs = [];
const list = document.querySelector("#list_of_elements");

function addNewElement(name) {
    names.push(name);
    list.appendChild(new Option(name));
}

const input = document.querySelector("#new_element");
input.addEventListener('keyup', function(e) {
    const name = e.target.value;
    if(e.key == 'Enter' && !names.includes(name)) {
        console.log("name:", name);
        addNewElement(name);
        e.target.value = ''; // erase name
    }
});

list.addEventListener('dblclick', function(e) {
    names = names.filter(name => name !== e.target.value);
    e.target.parentNode.removeChild(e.target);
});

list.addEventListener('change', function(event) {
    console.log(event);
    const selectedOptions = [...this.options].filter(option => option.selected);
    if (selectedOptions.length > 2) {
        // Prevent the selection
        event.preventDefault();
        // Deselect the last selected option
        selectedOptions.find(option => ! selectedNames.includes(option.value)).selected = false;
    } else {
        selectedNames = selectedOptions.map(option => option.value);
    }
});

const vertices = [], adjacency = {};
const g = new Graph(vertices, adjacency);

// draw empty canvas
draw(canvas, g);

input.focus();
names.forEach(name => addNewElement(name));

const likeBtn = document.querySelector("#like");
const dislikeBtn = document.querySelector("#dislike");

likeBtn.addEventListener('click', function(e) {
    if(selectedNames.length === 2) { // we check 2 elements ?
        const pair = [selectedNames[0], selectedNames[1]]; // a v b

        if(! pairs.some(p => p[0] == pair[0] && p[1] == pair[1])) {
            pairs.push(pair);
            console.log("pairs:", pairs);
        } else {
            return;
        }

        g.reinit(); // reset all (keep only vertices)

        // add it into the implicit graph
        pairs.forEach(pair => {
            g.add( // !a => b ^ !b => a
                pair[0][0] == '!' ? pair[0] : '!' + pair[0],
                pair[1]
            );
            g.add(
                pair[1][0] == '!' ? pair[1] : '!' + pair[1],
                pair[0]
            );
        });

        document.querySelector("#pairs").innerText = "(" + pairs.join(") ^ (")
            .replaceAll(",!", " v ¬")
            .replaceAll(',', " v ") + ")";

        console.log(g);

        dfs(g);
        console.log("(1st pass) toposort:", g.toposort);

        const transposed_g = reversed(g);
        transposed_g.reinit();
        console.log("transposed g:", transposed_g);
        dfs(transposed_g, [...g.toposort].reverse());
        console.log("(2nd pass) toposort:", transposed_g.toposort);

        const vertices = [];
        [...transposed_g.toposort].reverse().forEach(vertex => {
            vertices.push({
                name: vertex,
                d: transposed_g.V[vertex].d,
                f: transposed_g.V[vertex].f
            });
        });
        console.log("vertices:", vertices);

        checkSolution(vertices);

        // on canvas
        draw(canvas, g);
    }
});




dislikeBtn.addEventListener('click', function(e) {
    if(selectedNames.length === 2) {
        const pair = [selectedNames[0], '!'+selectedNames[1]]; // a v !b (= incompatible)

        if(! pairs.some(p => p[0] == pair[0] && p[1] == pair[1])) {
            pairs.push(pair);
            console.log("pairs:", pairs);
        } else {
            return;
        }

        g.reinit();
        pairs.forEach(pair => {
            g.add( // !a => !b ^ !b => a
                pair[0][0] == '!' ? pair[0] : '!' + pair[0],
                pair[1]
            );
            g.add(
                pair[1],
                pair[0]
            );
        });

        document.querySelector("#pairs").innerText = "(" + pairs.join(") ^ (")
            .replaceAll(",!", " v ¬ ")
            .replaceAll(',', " v ") + ")";
        
        console.log(g);
        
        dfs(g);
        console.log("(1st pass) toposort:", g.toposort);

        const transposed_g = reversed(g);
        transposed_g.reinit();
        console.log("transposed g:", transposed_g);
        dfs(transposed_g, [...g.toposort].reverse());
        console.log("(2nd pass) toposort:", transposed_g.toposort);

        const vertices = [];
        [...transposed_g.toposort].reverse().forEach(vertex => {
            vertices.push({
                name: vertex,
                d: transposed_g.V[vertex].d,
                f: transposed_g.V[vertex].f
            });
        });
        console.log("vertices:", vertices);


        checkSolution(vertices);

        // on canvas
        draw(canvas, g);
    }
});


/**
 * TODO !
 */
function checkSolution(vertices) {

    // Sort vertices primarily by d (ascending) and secondarily by f (ascending)
    vertices.sort((a, b) => a.d - b.d || a.f - b.f);

    function regroupVertices(vertices) {
        const result = [];
        const stack = [];

        for (const vertex of vertices) {
            // Pop elements from the stack while the current vertex does not nest within the stack top
            while (stack.length && !(vertex.d > stack[stack.length - 1].d && vertex.f < stack[stack.length - 1].f)) {
                stack.pop();
            }
            // If the stack is not empty, add the current vertex to the children of the stack top
            if (stack.length) {
                if (!stack[stack.length - 1].children) {
                    stack[stack.length - 1].children = [];
                }
                stack[stack.length - 1].children.push(vertex);
            } else {
                // Otherwise, add it to the top level of the result
                result.push(vertex);
            }
            // Push the current vertex to the stack
            stack.push(vertex);
        }

        return result;
    }
    const groups = regroupVertices(vertices);


    const solution = document.querySelector("#solution");
    solution.innerText = '';

    groups.forEach((group, i) => {
        const verts = [group.name];
        group.children?.forEach(v => verts.push(v.name));
        console.log(`vertices #${i+1} : ${verts}`);

        // if X and !X are present -> no solution !

        const present = {};
        verts.forEach(vert => {
            if(vert[0] == '!') {
                present[vert[1]] = present[vert[1]] ? present[vert[1]] + 1 : 1;
            } else {
                present[vert[0]] = present[vert[0]] ? present[vert[0]] + 1 : 1;
            }
        })
        console.log("present:", present);

        Object.keys(present).forEach(v => {
            if(present[v] > 1) {
                solution.innerText = 'No solution ! As the implication graph\'s strongly connected components contains contradiction(s)';
            } else {
                solution.innerText = 'A solution is possible';
            }
        })

    });

}

main();
