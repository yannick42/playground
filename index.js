
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
// MAIN entrypoint..
//

const formulas = {}; // to keep track of formulas
const vertices = [], adjacency = {};
const g = new Graph(vertices, adjacency);

function main() {

    //
    // add event listeners on buttons
    //
    document.querySelector('#add_col').addEventListener('click', (e) => {
        addCol();
    });

    document.querySelector('#add_row').addEventListener('click', (e) => {
        addRow();
    });

    //
    // init table
    //
    for(let i = 0; i < 6; i++) {
        addRow();
    }

}



/**
 * get all references of a cell's formula (eg. #B2+#B1 will give the array ['B2', 'B1'])
 */
function listReference(formula) {
    const regexPattern = /#(\w{2,3})/g;
    const matches = formula.match(regexPattern);
    return matches ? matches.map(match => match.substring(1)) : [];
}

function substitute(formula, ref) {
    const value = document.querySelector('#' + ref + '_value').innerText;
    console.log(`substituting #${ref} with ${value} in ${formula}`);
    return formula.replaceAll('#' + ref, value);
}

function computeCell(referencedCell) {
    let formula = formulas[referencedCell] ?? '';

    // get all referenced cells in this one
    refs = listReference(formula);

    // substitute with "true" (already computed or "literal") value
    refs.forEach(ref => formula = substitute(formula, ref));
    //console.log("Substituted formula:", form);

    // eval() : to apply arithmetic (+-*/) and more ...
    const computed = refs && formula && formula !== '-' ? eval(formula) : '?';
    //console.log("Final computed value:", computed);

    document.querySelector('#'+referencedCell+'_value').innerHTML = computed;
    // show formula (non-editable directly)
    document.querySelector('#'+referencedCell+'_desc').innerHTML = refs.length ? formulas[referencedCell] : '';
}

function onValueClick(e) {
    const [colrow, ] = e.target.id.split("_");
    // hide the computed value
    e.target.style.display = 'none';
    document.querySelector('#' + colrow + '_desc').style.display = 'none';
    // show the input box & focus into it
    document.querySelector('#' + colrow).style.display = 'inline';
    document.querySelector('#' + colrow).focus();
}

function onEnterPressed(e) {
    if(e.key == 'Enter') {
        e.target.blur();
    }
}

/**
 * Add event on every cells (click, onBlur, keyUp)
 * 
 * also called when a new row or col is added !
 */
function addEvents() {

    const values = document.querySelectorAll('.value');
    const inputs = document.querySelectorAll('.formula');

    // delete everything.. (important ? when adding new row or col ?)
    values.forEach(value => value.removeEventListener('click', onValueClick));
    inputs.forEach(input => input.removeEventListener('blur', onInputBlur));
    inputs.forEach(input => input.removeEventListener('keyup', onEnterPressed));

    // add events
    //
    // when user click on a cell to edit a formula
    values.forEach(value => value.addEventListener('click', onValueClick));

    // when finished editing a cell's formula
    inputs.forEach(input => input.addEventListener('blur', onInputBlur));

    // validate when type "Enter"
    inputs.forEach(input => input.addEventListener('keyup', onEnterPressed));
}

function onInputBlur(e) {
    const cell = e.target.id;
    // hide formula input
    e.target.style.display = 'none';

    const formula = e.target.value;
    formulas[cell] = formula; // ???

    // display the computed (resulting) value
    document.querySelector('#' + cell + "_value").style.display = 'inline';
    document.querySelector('#' + cell + '_desc').style.display = 'inline';

    // get all the referenced cells used in this call (if any)
    const references = listReference(formula);
    if(references.length) {
        // **if necessary**, add an edge from this cell to an other one (this -> other),
        // the "other" will need to be computed first
        references.forEach(toVertex => g.add(cell, toVertex));

        if(g.adj[cell]?.length) {
            // (if necessary) remove edges that are no more needed (pointing from this cell to an other)
            g.adj[cell] = g.adj[cell].filter(vertexToCheck => references.includes(vertexToCheck));
        }
    } else {
        // 
        // Update this cell, if no referenced cells, no need to compute formula's result...
        // but other cells may reference this one ! (this case is handled below)
        // 
        document.querySelector('#' + cell + "_value").innerText = formulas[cell];
    }

    console.log(">>> edited cell = ", cell, g.V[cell]);

    //
    // TODO: check if any changes occured in this cell !
    //
    if(g.V[cell]) { // if this cell is used in a formula ?
        // if this edited cell has referenced cells, always recompute order... (?)
        if(references.length) {
            console.log("recompute graph order");
            g.reinit(); // put every graphs to WHITE and 0 / None ... to recalculate everything...
            dfs(g); // use Depth-first search to compute topological sort
            console.log("graph:", g, "order:", toposort);
        }
    }

    // Propagate change inside every cells referencing other cell(s) ...
    //
    // do the computations sequentially (in reverse order !)
    //      as the last element has "no dependency" (so can be calculated directly, & first)
    //
    console.log("order:", toposort);
    // /!\ .reverse() is in-place !
    [...toposort].reverse().forEach(c => computeCell(c));
}


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

    addEvents(); // add function that will handle events (click, blur (=unfocus), ...)
}

function addCol() {
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

    addEvents(); // add function that will handle events (click, blur (=unfocus), ...)
}


main();
