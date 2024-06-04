
//
// GRAPH + topological sort
//

const WHITE = 0;
const GRAY = 1;
const BLACK = 2;
const DEFAULT = { color: WHITE, pred: null, d: null, f: null, };

class Graph {
    V = {} // vertices
    adj = {} // adjacency list
    constructor(V, adj) {
        this.V = Object.assign({}, ...V.map(vertex => ({ [vertex]: DEFAULT})));
        this.adj = adj;
    }

    reinit() {
        Object.keys(this.V).forEach(vertex => {
            this.V[vertex] = Object.assign({}, DEFAULT);
        });
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

let TIME;

const toposort = [];
function dfs(g) {

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
    g.V[start_vertex].d = TIME;
    g.V[start_vertex].color = GRAY;

    g.adj[start_vertex]?.forEach(end_vertex => {
        if(g.V[end_vertex].color === WHITE) {
            g.V[end_vertex].pred = start_vertex;
            dfs_visit(g, end_vertex);
        }
    });

    TIME += 1;
    g.V[start_vertex].f = TIME;
    g.V[start_vertex].color = BLACK;

    toposort.unshift(start_vertex); // add this vertex at the front of the list
}


//
// MAIN
//
function main() {

    //
    // init table
    //
    for(let i = 0; i < 6; i++) {
        addRow();
    }

}


const formulas = {}; // to keep track of formulas
const vertices = [], adjacency = {};
const g = new Graph(vertices, adjacency);



/**
 * get all references of a cell's formula (eg. #B2+#B1 will give the array ['B2', 'B1'])
 */
function listReference(formula) {
    const regexPattern = /#(\w{2,3})/g;
    const matches = formula.match(regexPattern);
    return matches ? matches.map(match => match.substring(1)) : [];
}



/**
 * Add event on every cells (click, onBlur, keyUp)
 */
function addEvents() {

    const values = document.querySelectorAll('.value');
    const inputs = document.querySelectorAll('.formula');

    // when user click on a cell to edit a formula
    values.forEach(value => value.addEventListener('click', function(e) {
        const [colrow, ] = e.target.id.split("_");
        // hide the computed value
        e.target.style.display = 'none';
        document.querySelector('#' + colrow + '_desc').style.display = 'none';
        // show the input box & focus into it
        document.querySelector('#' + colrow).style.display = 'inline';
        document.querySelector('#' + colrow).focus();
    }));

    // when finished editing a cell's formula
    inputs.forEach(input => input.addEventListener('blur', function(e) {
        const cell = e.target.id;
        // hide formula input
        e.target.style.display = 'none';

        const formula = e.target.value;
        formulas[cell] = formula; // ???

        // display the computed (resulting) value
        document.querySelector('#' + cell + "_value").style.display = 'inline';
        document.querySelector('#' + cell + '_desc').style.display = 'inline';

        // ref in this call
        const references = listReference(formula);
        if(references.length) {
            // CHECK: **if necessary** add edge from this cell to an other one (this -> other),
            // the "other" will need to be computed first
            references.forEach(toVertex => g.add(cell, toVertex));

            if(g.adj[cell]?.length) {
                // (if necessary) remove edges that are no more needed (pointing from this cell to an other)
                g.adj[cell] = g.adj[cell].filter(vertexToCheck => references.includes(vertexToCheck));
            }
        } else {
            // 
            // Update this cell, if no referenced cells, no need to compute formula's result...
            // but other cells may reference this one ...
            // 
            document.querySelector('#' + cell + "_value").innerText = formulas[cell];
        }


        // recompute all orders at every changes ?!
        g.reinit(); // put every graphs to WHITE and 0 / None ...
        dfs(g);
        //console.log("graph:", g);
        //console.log("Order:", toposort);


        //
        // Propagate change in all cells referencing other cell(s) ...
        //
        // do the computations sequentially (in reverse order)
        //      as the last element has no dependency (so can be calculated directly/first)
        //
        toposort.reverse().forEach(cell_ => {
            //console.log("re-computing CELL : ", cell_);
            // compute
            form = formulas[cell_] ?? '';

            // list of referenced cells in this cell
            refs = listReference(form);

            // substitute with "true" value (computed)
            refs.forEach(ref => {
                const value = document.querySelector('#' + ref + '_value').innerText;
                form = form.replaceAll('#' + ref, value);
            });
            //console.log("Substituted formula:", form);

            // eval() : to apply arithmetic (+-*/) and more ...
            const computed = refs && form && form !== '-' ? eval(form) : '-';
            //console.log("Final computed value:", computed);

            document.querySelector('#'+cell_+'_value').innerHTML = computed;
            // show formula (non-editable directly)
            document.querySelector('#'+cell_+'_desc').innerHTML = refs.length ? formulas[cell_] : '';
        });
        
    }));

    // validate when type "Enter"
    inputs.forEach(input => input.addEventListener('keyup', (e) => e.key == 'Enter' && e.target.blur()));
}



//
// add event listeners on buttons
//
document.querySelector('#add_col').addEventListener('click', (e) => {
    const trs = document.querySelector("table").querySelectorAll("tr");
    const nb_cols = trs[0].querySelectorAll('td').length;

    console.log("nb_cols:", nb_cols);

    trs.forEach((tr, i) => {
        const letter = String.fromCharCode(65 + nb_cols - 1);
        const cell = letter + i.toString();
        if(i == 0) {
            tr.innerHTML += `<td>${letter}</td>`;
        } else {
            tr.innerHTML += `<td>
                <input id="${cell}" class="formula" />
                <span id="${cell}_value" class="value">-</span>
                <span id="${cell}_desc" class="small"></span>
            </td>`
        }
    });
});

function addRow() {
    const nb_rows = document.querySelector("table").querySelectorAll('tr').length - 1;
    const nb_cols = document.querySelector("table").querySelector('tr:nth-of-type(1)').querySelectorAll('td').length - 1;

    let tds = '';
    for(let i = 0; i < nb_cols; i++) {
        const letter = String.fromCharCode(65 + i);
        const cell = letter + (nb_rows + 1).toString();
        tds += `<td>
            <input id="${cell}" class="formula" />
            <span id="${cell}_value" class="value">-</span>
            <span id="${cell}_desc" class="small"></span>
        </td>`;
    }
    document.querySelector("table").innerHTML += `<tr id="row_${nb_rows + 1}">
            <td>${nb_rows + 1}</td>
            ${tds}
        </tr>`;

    addEvents();
}

document.querySelector('#add_row').addEventListener('click', (e) => {
    addRow();
});

main();