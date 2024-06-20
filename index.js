import { Graph, dfs } from './common/graph.js';

//
// MAIN entrypoint..
//

let formulas = {}; // to keep track of formulas
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
    const localData = JSON.parse(localStorage.getItem("formulas") ?? 'null');
    console.log("localData:", localData);

    const rows = [];
    if(localData) {
        formulas = localData; // reinit formulas
        // { A1: 'Test:', ... }
        let maxCol, maxRow;
        Object.keys(localData).forEach(cell => {
					  if(! localData[cell]) return; // next...
					
            const letter = cell[0];
            const rowNum = Number(cell.substring(1));
            if(!maxRow || rowNum > maxRow) maxRow = rowNum;
            if(!maxCol || letter.codePointAt(0) - 64 > maxCol) maxCol = letter.codePointAt(0) - 64;
        });
        
				console.log("create table of size:", maxRow, "x", maxCol, "from localStorage data");
			
			  for(let row = 0; row < maxRow; row++) {
					rows.push([]); // new line
					for(let col = 0; col < maxCol; col++) {
						const letter = String.fromCharCode(65 + col);
						const cell = letter + (row+1).toString();
						rows[row].push(localData[cell] ?? null);
					}
				}
    } else {
        rows.push(['Test:', '12', '#B1 * 2']);
        rows.push(['Test 2:', '5', '#B1 * #B2 + #C1']);
    }

		// add rows !
    rows.forEach(row => addRow(row, false));


		/*
	  dfs(g);
		console.log(g);
	  [...g.toposort].reverse().forEach(c => computeCell(c));
		*/
	
		
	 	Object.keys(formulas).forEach(cell => {
			const formula = formulas[cell];
			if(formula) {
				const refs = listReference(formula);
				console.log(cell, refs);
				if(refs?.length) {
					apply(cell, formulas[cell]);
				} else {
					//console.log("no need to 'apply' because", cell, "has no formula referencing other cells");
				}
			}
		});
		
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
    const refs = listReference(formula);

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
    const cell = e.target.id; // eg. B1
    const formula = e.target.value; // eg. #B2 + 1

    // hide currently edited formula <input>
    e.target.style.display = 'none';

    apply(cell, formula);
    
    saveToLocalstorage(); // save locally for next page refresh..
}

function saveToLocalstorage() {
    localStorage.setItem("formulas", JSON.stringify(formulas));
}

function apply(cell, formula) {

    formulas[cell] = formula; // save it

    // get all the referenced cells used in this call (if any)
    const references = listReference(formula);

    if(references.length)
    {
        // **if necessary**, add an edge from this cell to an other one (this -> other),
        // (INFO: the "other" will need to be computed first)
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

    console.log(">>> edited cell = ", cell, "in G:", g.V[cell]);

    //
    // TODO: check if any changes occured in this cell ! (if not, do nothing !)
    //
    if(g.V[cell]) { // if this cell is used in a formula (even simply referenced in an other cell's formula)
        // if this edited cell has referenced cells, always recompute order... (even if no changes..?)
        if(references.length) {
            console.log("recompute graph order");
            g.reinit(); // put every graphs to WHITE and 0 / None ... to recalculate everything...
            dfs(g); // use Depth-first search to compute topological sort
            console.log("graph:", g);
        }
    }

    //
    // Propagate change inside every cells referencing other cell(s) ...
    //
    // do the computations sequentially (in reverse order !)
    //      as the last element has "no dependency" (so can be calculated directly, & first)
    //
    console.log("order:", g.toposort);
    // /!\ .reverse() is in-place !
    [...g.toposort].reverse().forEach(c => computeCell(c)); // TODO: recompute only from this cell in the graph (not everything...)

    // at the end, display the computed (resulting) value
    document.querySelector('#' + cell + "_value").style.display = 'inline';
    document.querySelector('#' + cell + '_desc').style.display = 'inline';
}


function addRow(row=[], applyFormula=true) {
    const nb_rows = document.querySelector("table").querySelectorAll('tr').length - 1;
    const nb_cols = document.querySelector("table").querySelector('tr:nth-of-type(1)').querySelectorAll('td').length - 1;

    let tds = '';
    for(let i = 0; i < nb_cols; i++) {
        const letter = String.fromCharCode(65 + i);
        const cell = letter + (nb_rows + 1).toString();
        tds += `<td>
            <input id="${cell}" class="formula" value="${row[i] ? row[i] : ''}"/>
            <span id="${cell}_value" class="value">${row[i] ? row[i] : '-'}</span>
            <span id="${cell}_desc" class="small"></span>
        </td>`;
    }
    document.querySelector("table").innerHTML += `<tr id="row_${nb_rows + 1}">
            <td>${nb_rows + 1}</td>
            ${tds}
        </tr>`;

    row.forEach((formula, i) => {
        const letter = String.fromCharCode(65 + i);
        const cell = letter + (nb_rows + 1).toString();
        console.log(cell, formula);
        formulas[cell] = formula;
        if(applyFormula && formula) {
           apply(cell, formula);
				}
    });
    
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
