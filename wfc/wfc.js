
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt, choice } from '../common/common.helper.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const aspectRatio = 2;
canvas.width = 600;

console.log(canvas.width, canvas.height)

const NB_ROW = 60,
    NB_COL = Math.floor(NB_ROW / aspectRatio),
    COLOR = "lightgreen";

canvas.height = NB_COL * canvas.width / NB_ROW;

const scale = canvas.width / NB_ROW;

const sleep = ms => new Promise(r => setTimeout(r, ms));

const equals = (array1, array2) => {
    //console.log("equals:", array1, array2);
    return array1.length === array2.length && array1.every(function(value, index) { return value === array2[index]})
}

class Cell {
    constructor(x, y, options) {
        this.x = x;
        this.y = y;
        this.options = options; // list of remaining options
        this.collapsed = false;
    }
    entropy() { return this.options.length; }
    update() { this.collapsed = this.options.length === 1; }
    collapse() {
        this.options = [choice(this.options)]
        this.collapsed = true;
    }
    draw() {

        const Y = this.y * scale;
        const X = this.x * scale;
        const a = 0.6, b = 0.4, c = a - b;
        const s75 = scale * a;
        const s50 = scale * c;
        const s25 = scale * b;
        if (this.collapsed) {

            if (this.options[0].file) {

                const name = this.options[0].name;
                let angle = 0;
                const [filename, rot] = name.split("_");
                if (rot == 2) {
                    angle = -Math.PI / 2;
                } else if (rot == 3) {
                    angle = -Math.PI;
                } else if (rot == 4) {
                    angle = -3 * Math.PI / 2;
                }

                ctx.translate(Y + scale / 2, X + scale / 2);
                ctx.rotate(angle);
                ctx.drawImage(tileImages[filename], -scale/2, -scale/2, scale, scale);
                ctx.rotate(-angle);
                ctx.translate(-Y - scale/2, -X - scale/2);

                // show final tile name 
                //ctx.fillStyle = "red";
                //ctx.font = "11px Arial";
                //ctx.fillText(name, Y, X);

            } else {

                switch (JSON.stringify(this.options[0].edges)) {
                    case "[0,0,0,0]":
                        ctx.fillStyle = "black";
                        ctx.fillRect(Math.round(Y), Math.round(X), Math.round(scale), Math.round(scale));
                        break;
                    case "[1,1,0,1]": // top, left, right (no bottom)
                        ctx.fillStyle = COLOR;
                        ctx.fillRect(Math.round(Y), Math.round(X), Math.round(scale), Math.round(s75));

                        ctx.fillStyle = "black";
                        ctx.fillRect(Math.round(Y), Math.round(X + s75), Math.round(scale), Math.round(s25)); // no bottom
                        ctx.fillRect(Math.round(Y), Math.round(X), Math.round(s25), Math.round(s25));
                        ctx.fillRect(Math.round(Y + s75), Math.round(X), Math.round(s25), Math.round(s25));
                        break;
                    case "[1,1,1,0]": // top, right, bottom (no left)
                        ctx.fillStyle = COLOR;
                        ctx.fillRect(Math.round(Y + s25), Math.round(X), Math.round(s75), Math.round(scale));

                        ctx.fillStyle = "black";
                        ctx.fillRect(Math.round(Y), Math.round(X), Math.round(s25), Math.round(scale)); // no left
                        ctx.fillRect(Math.round(Y + s75), Math.round(X), Math.round(s25), Math.round(s25));
                        ctx.fillRect(Math.round(Y + s75), Math.round(X + s75), Math.round(s25), Math.round(s25));
                        break;
                    case "[0,1,1,1]": // right, bottom, left (no top)
                        ctx.fillStyle = COLOR;
                        ctx.fillRect(Math.round(Y), Math.round(X + s25), Math.round(scale), Math.round(s75));
                        
                        ctx.fillStyle = "black";
                        ctx.fillRect(Math.round(Y), Math.round(X), Math.round(scale), Math.round(s25)); // no top
                        ctx.fillRect(Math.round(Y), Math.round(X + s75), Math.round(s25), Math.round(s25));
                        ctx.fillRect(Math.round(Y + s75), Math.round(X + s75), Math.round(s25), Math.round(s25));
                        break;
                    case "[1,0,1,1]": // top, bottom, left (no right)
                        ctx.fillStyle = COLOR;
                        ctx.fillRect(Math.round(Y), Math.round(X), Math.round(s75), Math.round(scale));
                        
                        ctx.fillStyle = "black";
                        ctx.fillRect(Math.round(Y + s75), Math.round(X), Math.round(s25), Math.round(scale));
                        ctx.fillRect(Math.round(Y), Math.round(X), Math.round(s25), Math.round(s25));
                        ctx.fillRect(Math.round(Y), Math.round(X + s75), Math.round(s25), Math.round(s25));
                        break;
                    case "[0,1,0,1]": // horizontal
                        ctx.fillStyle = "black";
                        ctx.fillRect(Math.round(Y), Math.round(X), Math.round(scale), Math.round(scale));
                        ctx.fillStyle = COLOR;
                        ctx.fillRect(Math.round(Y), Math.round(X + s25), Math.round(scale), Math.round(s50));
                        break;
                    case "[1,0,1,0]": // vertical
                        ctx.fillStyle = "black";
                        ctx.fillRect(Math.round(Y), Math.round(X), Math.round(scale), Math.round(scale));
                        ctx.fillStyle = COLOR;
                        ctx.fillRect(Math.round(Y + s25), Math.round(X), Math.round(s50), Math.round(scale));
                        break;
                    case "[1,1,1,1]": // hub
                        ctx.fillStyle = "black";
                        ctx.fillRect(Math.round(Y), Math.round(X), Math.round(scale), Math.round(scale));
                        ctx.fillStyle = COLOR;
                        ctx.fillRect(Math.round(Y + s25), Math.round(X), Math.round(s50), Math.round(scale));
                        ctx.fillRect(Math.round(Y), Math.round(X + s25), Math.round(scale), Math.round(s50));
                        break;
                    case "[1,1,0,0]": // top to right
                        ctx.fillStyle = "black";
                        ctx.fillRect(Math.round(Y), Math.round(X), Math.round(scale), Math.round(scale));
                        ctx.fillStyle = COLOR;
                        ctx.fillRect(Math.round(Y + s25), Math.round(X), Math.round(s50), Math.round(s75));
                        ctx.fillRect(Math.round(Y + s25), Math.round(X + s25), Math.round(s75), Math.round(s50));
                        break;
                    case "[0,1,1,0]": // right to bottom
                        ctx.fillStyle = "black";
                        ctx.fillRect(Math.round(Y), Math.round(X), Math.round(scale), Math.round(scale));
                        ctx.fillStyle = COLOR;
                        ctx.fillRect(Math.round(Y + s25), Math.round(X + s25), Math.round(s50), Math.round(s75));
                        ctx.fillRect(Math.round(Y + s25), Math.round(X + s25), Math.round(s75), Math.round(s50));
                        break;
                    case "[0,0,1,1]": // bottom to left
                        ctx.fillStyle = "black";
                        ctx.fillRect(Math.round(Y), Math.round(X), Math.round(scale), Math.round(scale));
                        ctx.fillStyle = COLOR;
                        ctx.fillRect(Math.round(Y), Math.round(X + s25), Math.round(s75), Math.round(s50));
                        ctx.fillRect(Math.round(Y + s25), Math.round(X + s25), Math.round(s50), Math.round(s75));
                        break;
                    case "[1,0,0,1]": // left to top
                        ctx.fillStyle = "black";
                        ctx.fillRect(Math.round(Y), Math.round(X), Math.round(scale), Math.round(scale));
                        ctx.fillStyle = COLOR;
                        ctx.fillRect(Math.round(Y + s25), Math.round(X), Math.round(s50), Math.round(s75));
                        ctx.fillRect(Math.round(Y), Math.round(X + s25), Math.round(s75), Math.round(s50));
                        break;
                }
            }
        } else {
            ctx.fillStyle = "white";
            ctx.fillRect(Y, X, scale, scale);
            let color = "green";
            if (this.options.length !== 0) {
                if (this.options.length > 10) {
                    color = "darkred"
                } else if (this.options.length > 7) {
                    color = "red"
                } else if (this.options.length > 4) {
                    color = "orange"
                } else {
                    color = "green"
                }
                ctx.fillStyle = color;
                ctx.font = "7px Arial";
            } else {
                ctx.fillStyle = "red";
                ctx.font = "bold 8px Arial";
            }
            ctx.fillText(this.options.length, this.y * scale + scale / 2 - 3, this.x * scale + scale / 2 + 3);
        }
    }
}


function updateAvailableMoves(grid, row, col) {
    let cumulValidOptions = grid[row][col].options.map(o => o.edges);

    let validOptions;

    const DEBUG = 0;

    if(row - 1 >= 0) {
        validOptions = [];
        const cellAbove = grid[row - 1][col];
        // find all possible options for this cell (based on the possible ones just above)
        cellAbove.options.forEach(option => { // for each remaining tiles, get their "down" property
            validOptions.push(option.down); // add an array of edges: [[0, 0, 0, 0], [1, 0, 1, 1]]
        });
        validOptions = Array.from(new Set(validOptions.flat().map(JSON.stringify)), JSON.parse);
        if(DEBUG) console.log("validOptions for above:", validOptions)
        
        if(DEBUG) console.log("cumulValidOptions:", cumulValidOptions);
        cumulValidOptions = cumulValidOptions.filter(tile => validOptions.some(o => tile && equals(o, tile)));
        if(DEBUG) console.log("after above check:", cumulValidOptions)
    }    

    if(col + 1 < grid[row].length) {
        validOptions = [];
        const cellRight = grid[row][col + 1];
        cellRight.options.forEach(option => {
            validOptions.push(option.left);
        });
        validOptions = Array.from(new Set(validOptions.flat().map(JSON.stringify)), JSON.parse);
        if(DEBUG) console.log("validOptions for right:", validOptions)
            
        if(DEBUG) console.log("cumulValidOptions:", cumulValidOptions);
        cumulValidOptions = cumulValidOptions.filter(tile => validOptions.some(o => tile && equals(o, tile)));
        if(DEBUG) console.log("after right check:", cumulValidOptions)
    }

    if(row + 1 < grid.length) {
        validOptions = [];
        const cellBelow = grid[row + 1][col];
        cellBelow.options.forEach(option => {
            validOptions.push(option.up);
        });
        validOptions = Array.from(new Set(validOptions.flat().map(JSON.stringify)), JSON.parse);
        if(DEBUG) console.log("validOptions for below:", validOptions)

        if(DEBUG) console.log("cumulValidOptions:", cumulValidOptions);
        cumulValidOptions = cumulValidOptions.filter(tile => validOptions.some(o => tile && equals(o, tile)));
        if(DEBUG) console.log("after below check:", cumulValidOptions)
    }

    if (col - 1 >= 0) {
        validOptions = [];
        const cellLeft = grid[row][col - 1];
        cellLeft.options.forEach(option => {
            validOptions.push(option.right);
        });
        validOptions = Array.from(new Set(validOptions.flat().map(JSON.stringify)), JSON.parse);
        if(DEBUG) console.log("validOptions for left:", validOptions)

        if(DEBUG) console.log("cumulValidOptions:", cumulValidOptions);
        cumulValidOptions = cumulValidOptions.filter(tile => validOptions.some(o => tile && equals(o, tile)));
        if(DEBUG) console.log("after left check:", cumulValidOptions)
    }

    return cumulValidOptions;
}


class Grid {

    constructor(width, height, options) {
        this.width = width;
        this.height = height;
        this.options = options; // 5 tiles ?
        this.grid = [];
    }

    initiate() {
        for(let i = 0; i < this.height; i++) {
            this.grid.push([]);
            for (let j = 0; j < this.width; j++) {
                const cell = new Cell(i, j, this.options)
                this.grid[i].push(cell);
            }
        }
    }

    finished() {
        return this.grid.every(row => row.every(c => c.entropy() === 1));
    }

    draw() {
        for(let row = 0; row < this.grid.length; row++) {
            for(let col = 0; col < this.grid[row].length; col++) {
                this.grid[row][col].draw()
            }
        }
    }

    // WFC algorithm
    collapse() {
        const pick = this.pickLowestEntroyCell();
        //console.log("pick:", JSON.stringify(pick));
        if (pick) {
            this.grid[pick.x][pick.y].collapse();
            //console.log("new collapsed cell (", pick.x, ",", pick.y, "):", JSON.stringify(this.grid[pick.x][pick.y]))
        } else {
            //console.log("???")
            return; // ???
        }

        const nextGrid = this.grid.slice(); // copy

        const leftCell = (grid, x, y) => y - 1 >= 0 ? grid[x][y - 1] : null;
        const rightCell = (grid, x, y) => y + 1 < grid[x].length ? grid[x][y + 1] : null;
        const upCell = (grid, x, y) => x - 1 >= 0 ? grid[x - 1][y] : null;
        const downCell = (grid, x, y) => x + 1 < grid.length ? grid[x + 1][y] : null;

        const addNeighbors = (grid, x, y) => {
            const toCheck = [];

            const left = leftCell(grid, x, y)
            if(left && ! left.collapsed) {
                toCheck.push(left);
            }
            const right = rightCell(nextGrid, x, y)
            if(right && ! right.collapsed) {
                toCheck.push(right);
            }
            const up = upCell(nextGrid, x, y)
            if(up && ! up.collapsed) {
                toCheck.push(up);
            }
            const down = downCell(nextGrid, x, y)
            if(down && ! down.collapsed) {
                toCheck.push(down);
            }
            return toCheck;
        }

        const toCheck = [];
        toCheck.push(pick);
        toCheck.push(...addNeighbors(nextGrid, pick.x, pick.y));

        while(toCheck.length) {

            const cell = toCheck.pop();

            const row = cell.x;
            const col = cell.y;

            const nbValidOptions = nextGrid[row][col].options.map(o => o.edges).length;
            const cumulValidOptions = updateAvailableMoves(this.grid, row, col);

            if(cumulValidOptions.length === nbValidOptions) {
                //no changes !
            } else {

                // set "new" available options for this cell
                nextGrid[row][col].options = nextGrid[row][col].options.filter(o => cumulValidOptions.includes(o.edges));

                if(nextGrid[row][col].options.length == 0) {
                    // NO MORE OPTION for this cell, so restart all ...
                    return -1;
                }

                //console.log(nextGrid[row][col].options);
                nextGrid[row][col].update();
                //console.log(nextGrid)

                toCheck.push(...addNeighbors(nextGrid, row, col));
            }
        }

        this.grid = nextGrid.slice();
        //console.log("grid:", this.grid.map(row => row.map(c => c.entropy())));
        return this.grid.every(row => row.every(c => c.entropy() === 1)); // true if finished, else false (or -1 if impossible)
    }

    pickLowestEntroyCell() {
        // order by entropy
        const sortedByEntropy = this.grid.flat().sort((a, b) => {
            return a.entropy() > b.entropy() ? 1 : -1
        });

        //console.log(sortedByEntropy)

        let filteredGrid = sortedByEntropy.filter(c => c.entropy() > 1)
        //console.log("filteredGrid:", filteredGrid) // cells
        //console.warn(filteredGrid[0])
        if (filteredGrid.length == 0) return null; // no more choice ?!

        const leastEntropy = filteredGrid[0].entropy();
        //console.log("least entropy:", leastEntropy);

        filteredGrid = filteredGrid.filter(c => c.entropy() == leastEntropy);
        const pick = choice(filteredGrid);
        //console.log("picked cell:", pick);
        return pick;
    }

}

class Tile {

    constructor(edges) {
        this.edges = edges;
        this.index = -1;

        // available neighboring tiles (per direction)
        this.up = [];
        this.right = [];
        this.down = [];
        this.left = [];
    }

    setRules(tiles) {
        tiles.forEach(tile => {

            const fit = (e1, e2) => e1.toString() === e2.toString().split('').reverse().join('')

            if (fit(this.edges[0], tile[2])) {
                this.up.push(tile);
            }
            if (fit(this.edges[1], tile[3])) {
                this.right.push(tile);
            }
            if (fit(this.edges[2], tile[0])) {
                this.down.push(tile);
            }
            if (fit(this.edges[3], tile[1])) {
                this.left.push(tile);
            }
        });
    }

}


function main() {
    document.querySelector("#refresh").addEventListener('click', (e) => redraw());
    document.querySelector("#next").addEventListener('click', (e) => {
        if(grid.finished()) {
            ctx.fillRect(0, 0, scale * NB_ROW, scale * NB_COL, "white");
            grid = new Grid(NB_ROW, NB_COL, tiles);
            grid.initiate();
        }
        nextMove(grid);
    });

    redraw();
}


let grid;
let tileImages = {}

//const tileset = "pipes"
let tileset;
let tiles, options;

async function redraw() {

    tileset = document.getElementById('tileset').value;

    tileImages = [];

    switch(tileset) {
        case "pipes":

            options = [
                // [top, right, bottom, left]
                [0, 0, 0, 0], // black area 
                [1, 1, 0, 1], // link to top, left and right (no bottom)
                [1, 1, 1, 0], // link to top, right, bottom (no left)
                [0, 1, 1, 1], // (no top)
                [1, 0, 1, 1], // (no right)
                // HUB
                [1, 1, 1, 1],
                // CORRIDORS
                [0, 1, 0, 1], // horizontal
                [1, 0, 1, 0], // vertical
                // ROADS
                [1, 1, 0, 0], // from top to right
                [0, 1, 1, 0], // from right to bottom
                [0, 0, 1, 1], // from bottom to left
                [1, 0, 0, 1], // from left to top
            ];

            tiles = options.map(edge => new Tile(edge));
            tiles.forEach((tile, i) => {
                tile.index = i;
                tile.setRules(options);
            });

            break;
        
        case "circuit":

            // 0 = lightgreen (middle)
            // 1 = gray (middle)
            // 2 = black (all)
            // 3 = green + a part in black
            // 4 = a part in black + green
            // 5 = green
            options = { // top, right, bottom, left
                'bridge': [0, 1, 0, 1],
                'bridge_2': [1, 0, 1, 0], // rotated
                'component': [2, 2, 2, 2],
                'component_2': [2, 2, 2, 2],
                'component_3': [2, 2, 2, 2],
                'component_4': [2, 2, 2, 2],
                'connection': [0, '552', 2, '255'],
                'connection_2': ['552', 2, '255', 0], // rotated -90°
                'connection_3': [2, '255', 0, '552'], // rotated -180°
                'connection_4': ['255', 0, '552', 2], // rotated -270°
                'corner': [5, 5, '552', '255'],   // bottom-left corner (black)
                'corner_2': [5, '552', '255', 5], // rotated 90°
                'corner_3': ['552', '255', 5, 5], // rotated 180°
                'corner_4': ['255', 5, 5, '552'], // rotated 270°
                'dskew': [0, 0, 0, 0],
                'dskew_2': [0, 0, 0, 0],
                'skew': [0, 0, 5, 5],
                'skew_2': [0, 5, 5, 0],
                'skew_3': [5, 5, 0, 0],
                'skew_4': [5, 0, 0, 5],
                'substrate': [5, 5, 5, 5],
                't': [5, 0, 0, 0],
                't_2': [0, 0, 0, 5],
                't_3': [0, 0, 5, 0],
                't_4': [0, 5, 0, 0],
                // 2 sym.
                'track': [0, 5, 0, 5],
                'track_2': [5, 0, 5, 0],
                // 4 sym.
                'transition': [1, 5, 0, 5],
                'transition_2': [5, 0, 5, 1],
                'transition_3': [0, 5, 1, 5],
                'transition_4': [5, 1, 5, 0],
                // 4 sym.
                'turn': [0, 0, 5, 5],
                'turn_2': [0, 5, 5, 0],
                'turn_3': [5, 5, 0, 0],
                'turn_4': [5, 0, 0, 5],
                // 2 sym.
                'viad': [5, 0, 5, 0],
                'viad_2': [0, 5, 0, 5],
                // 4 sym.
                'vias': [0, 5, 5, 5],
                'vias_2': [5, 5, 5, 0],
                'vias_3': [5, 5, 0, 5],
                'vias_4': [5, 0, 5, 5],
                // 2 symmetries
                'wire': [5, 1, 5, 1],
                'wire_2': [1, 5, 1, 5],
            }

            //
            // Create tiles
            //
            tiles = Object.keys(options).map(name => new Tile(options[name]));
            tiles.forEach((tile, i) => {
                const name = Object.keys(options)[i];

                tile.index = i;
                tile.name = name;

                const [filename, rot] = name.split("_");

                tile.file = `./tilesets/circuits/${filename}.png`;

                // Load the image
                const img = new Image();
                img.src = tile.file;
                img.onload = () => {
                    if(rot == 2) {
                        img.style.transform = "rotate(-90deg)";
                    } else if (rot == 3) {
                        img.style.transform = "rotate(-180deg)";
                    } else if (rot == 4) {
                        img.style.transform = "rotate(-270deg)";
                    }
                    //console.log(typeof img, img)
                    tileImages[name] = img;
                };
                img.onerror = (e) => {
                    console.error("Image failed to load", e);
                };

                tile.setRules(Object.values(options));
            });

            break;
        

        case "circles":

            // 
            options = { // top, right, bottom, left
                'w-quarter': [1, 1, 0, 0],
                'w-quarter_2': [1, 0, 0, 1],
                'w-quarter_3': [0, 0, 1, 1],
                'w-quarter_4': [0, 1, 1, 0],
                'w': [1, 1, 1, 1],
                'b-half': [0, 1, 1, 1],
                'b-half_2': [1, 1, 1, 0],
                'b-half_3': [1, 1, 0, 1],
                'b-half_4': [1, 0, 1, 1],
                'b-i': [0, 1, 0, 1],
                'b-i_2': [1, 0, 1, 0],
                'b-quarter': [0, 0, 1, 1],
                'b-quarter_2': [0, 1, 1, 0],
                'b-quarter_3': [1, 1, 0, 0],
                'b-quarter_4': [1, 0, 0, 1],
                'b': [0, 0, 0, 0],
                'w-half': [1, 0, 0, 0],
                'w-half_2': [0, 0, 0, 1],
                'w-half_3': [0, 0, 1, 0],
                'w-half_4': [0, 1, 0, 0],
                'w-i': [1, 0, 1, 0],
                'w-i_2': [0, 1, 0, 1],
            }

            //
            // Create tiles
            //
            tiles = Object.keys(options).map(name => new Tile(options[name]));
            tiles.forEach((tile, i) => {
                const name = Object.keys(options)[i];

                tile.index = i;
                tile.name = name;

                const [filename, rot] = name.split("_");

                tile.file = `./tilesets/circles/${filename}.png`;

                // Load the image
                const img = new Image();
                img.src = tile.file;
                img.onload = () => {
                    if(rot == 2) {
                        img.style.transform = "rotate(-90deg)";
                    } else if (rot == 3) {
                        img.style.transform = "rotate(-180deg)";
                    } else if (rot == 4) {
                        img.style.transform = "rotate(-270deg)";
                    }
                    //console.log(typeof img, img)
                    tileImages[name] = img;
                };
                img.onerror = (e) => {
                    console.error("Image failed to load", e);
                };

                tile.setRules(Object.values(options));
            });

            break;
    }
    
    console.log("Tiles:", tiles);
    
    const tilesDiv = document.getElementById("tiles");
    tilesDiv.innerHTML = "";
    if(["circuit", "circles"].includes(tileset)) {
        console.log("waiting tiles loading ...")
        await sleep(2000);
        console.log(tileImages)
        console.log(Object.keys(tileImages).length, "loaded images:", tileImages);

        Object.keys(tileImages).sort().forEach(tile => {
            console.log(tile);
            const t = document.createElement('div');
            t.innerHTML = tile + '&nbsp; : &nbsp;' + options[tile];
            
            t.appendChild(tileImages[tile]);
            tilesDiv.appendChild(t);
        })
    }

    // clear
    ctx.fillRect(0, 0, scale * NB_ROW, scale * NB_COL, "white");

    grid = new Grid(NB_ROW, NB_COL, tiles);
    grid.initiate();
    console.log("grid:", grid);

    let ret = false;
    let start;

    const step = (timestamp) => {
        if (start === undefined) {
            start = timestamp;
        }
        const elapsed = timestamp - start;

        ret = nextMove(grid);

        //console.log("next move :", ret, elapsed);

        if (ret === false) {
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);
}

function nextMove(grid) {

    const ret = grid.collapse();
    grid.draw();

    if (ret == -1) {
        console.log("No more moves, we should backtrack..., STOP and restart for now ...!")
    } else if (ret) {
        // result found !
    } else {
        // continue collapsing cells
    }

    return ret;
}

main();
