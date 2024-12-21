import { randInt } from '../common/common.helper.js';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

// Simulation parameters
const gridSize = 128;

canvas.width = gridSize * 3; // to not have a visible "grid" ... due to float number ?
canvas.height = gridSize * 3;

const diffusion = 0.2; // higher, dye disappear faster !
const viscosity = 0.0001;
const dt = 0.0001;
const iter = 10; // 4 ?

// Grids for density and velocity
const density = new Float32Array(gridSize * gridSize);
const velocityX = new Float32Array(gridSize * gridSize);
const velocityY = new Float32Array(gridSize * gridSize);
// previous ?
const tempDensity = new Float32Array(gridSize * gridSize);
const tempVelocityX = new Float32Array(gridSize * gridSize);
const tempVelocityY = new Float32Array(gridSize * gridSize);

const constraint = (value, min = 0, max = 1) => Math.min(Math.max(min, value), max);

// Helper functions
const index = (x, y) => constraint(x + y * gridSize, 0, gridSize * gridSize - 1);

function addDensity(x, y, amount) {
    density[index(x, y)] += amount;
}

function addVelocity(x, y, amountX, amountY) {
    velocityX[index(x, y)] += amountX;
    velocityY[index(x, y)] += amountY;
}






/**
 * each cell exchanges densities with its direct neighbors
 * 
 * use a "stable" method
 */
function diffuse(b, x, x0, diff) {
    // diff = diffusion rate ?
    // a = ?
    const a = dt * diff * (gridSize - 2) * (gridSize - 2); // Jos Stam: dt*diff*N*N
    /*
    for (let k = 0; k < 20; k++) {
        for (let i = 1; i < gridSize - 1; i++) {
            for (let j = 1; j < gridSize - 1; j++) {
                x[index(i, j)] =
                    (
                        x0[index(i, j)]
                        + a * (
                            x[index(i + 1, j)]
                            + x[index(i - 1, j)]
                            + x[index(i, j + 1)]
                            + x[index(i, j - 1)]
                        )
                    ) / (1 + 4 * a);
            }
        }
        
    }
    */
    lin_solve(b, x, x0, a, 1 + 6 * a);
}

/**
 * It's an alternative ??? to the "simplest iterative solver": Gauss-Seidel relaxation
 * a -> ?
 * c -> ?
 */
function lin_solve(b, x, x0, a, c) {
    const cRecip = 1 / c;
    for (let k = 0; k < iter; k++) {
        //console.log("lin solver : iter #", k+1)
        for (let j = 1; j < gridSize - 1; j++) {
            for (let i = 1; i < gridSize - 1; i++) {
                x[index(i, j)] = cRecip * (
                    x0[index(i, j)] + a * (
                        x[index(i + 1,      j)] +
                        x[index(i - 1,      j)] +
                        x[index(i,      j + 1)] +
                        x[index(i,      j - 1)]
                    )
                )
            }
        }
        set_bnd(b, x)
    }
}

/**
 * b = 0 (only corners ?)
 * b = 1 (upper/lower walls ?)
 */
function set_bnd(b, x) {
    // 
    for(let k = 1; k < gridSize - 1; k++) {
        for(let i = 1; i < gridSize - 1; i++) {
            x[index(i, 0)] = b == 2 ? -x[index(i, 1)] : x[index(i, 1)];
            x[index(i, gridSize-1)] = b == 2 ? -x[index(i, gridSize-2)] : x[index(i, gridSize-2)];
        }
    }
    // 
    for(let k = 1; k < gridSize - 1; k++) {
        for(let j = 1; j < gridSize - 1; j++) {
            x[index(0  , j)] = b == 1 ? -x[index(1  , j)] : x[index(1  , j)];
            x[index(gridSize-1, j)] = b == 1 ? -x[index(gridSize-2, j)] : x[index(gridSize-2, j)];
        }
    }

    //
    // corners ?
    //
    x[index(0, 0)] = 0.5 * (x[index(1, 0)] + x[index(0, 1)]);
    x[index(0, gridSize-1)] = 0.5 * (x[index(1, gridSize-1)] + x[index(0, gridSize-2)]);
    x[index(gridSize-1, 0)] = 0.5 * (x[index(gridSize-2, 0)] + x[index(gridSize-1, 1)]);
    x[index(gridSize-1, gridSize-1)] = 0.5 * (x[index(gridSize-2, gridSize-1)] + x[index(gridSize-1, gridSize-2)]);
}

function project(velocX, velocY, p, div) {

    for(let j = 1; j < gridSize - 1; j++) {
        for(let i = 1; i < gridSize - 1; i++) {
            div[index(i, j)] = -0.5 * (
                    velocX[index(i + 1, j)]
                -   velocX[index(i - 1, j)]
                +   velocY[index(i, j + 1)]
                -   velocY[index(i, j - 1)]
            ) / gridSize;
            p[index(i, j)] = 0; // ???
        }
    }

    set_bnd(0, div);
    set_bnd(0, p);

    lin_solve(0, p, div, 1, 6)

    for(let j = 1; j < gridSize - 1; j++) {
        for(let i = 1; i < gridSize - 1; i++) {
            velocX[index(i, j)] -= 0.5 * (p[index(i+1, j)] - p[index(i-1, j)]) * gridSize;
            velocY[index(i, j)] -= 0.5 * (p[index(i, j+1)] - p[index(i, j-1)]) * gridSize;
        }
    }

    set_bnd(1, velocX);
    set_bnd(2, velocY);
}

/**
 * part of “Semi-Lagrangian” techniques ?   
 */
function advect(b, d, d0, velocX, velocY) {

    const dt0 = dt * (gridSize - 2);

    for (let i = 1; i < gridSize - 1; i++) {
        for (let j = 1; j < gridSize - 1; j++) {
            let x = i - dt0 * velocX[index(i, j)];
            let y = j - dt0 * velocY[index(i, j)];

            if (x < 0.5) x = 0.5;
            if (x > gridSize + 0.5) x = gridSize + 0.5;
            const i0 = Math.floor(x);
            const i1 = i0 + 1;

            if (y < 0.5) y = 0.5;
            if (y > gridSize + 0.5) y = gridSize + 0.5;
            const j0 = Math.floor(y);
            const j1 = j0 + 1;

            const s1 = x - i0;
            const s0 = 1 - s1;

            const t1 = y - j0;
            const t0 = 1 - t1;

            d[index(i, j)] = 
                s0 * (t0 * d0[index(i0, j0)] + t1 * d0[index(i0, j1)]) +
                s1 * (t0 * d0[index(i1, j0)] + t1 * d0[index(i1, j1)]);
        }
    }
}

/**
 * main loop of the algorithm
 */
function step() {

    /**
     * add sources
     */

    // a flame
    addDensity(Math.floor(gridSize / 2) + 20, Math.floor(gridSize / 2), randInt(100000, 500000));
    addVelocity(Math.floor(gridSize / 2) + 20, Math.floor(gridSize / 2), randInt(-250, 250), randInt(-1000, -500));
    // another flame
    addDensity(Math.floor(gridSize / 2) - 20, Math.floor(gridSize / 2), randInt(100000, 500000));
    addVelocity(Math.floor(gridSize / 2) - 20, Math.floor(gridSize / 2), randInt(-250, 250), randInt(-1000, -500));
    // another flame
    addDensity(Math.floor(gridSize / 2), Math.floor(gridSize / 2) + 20, randInt(100000, 500000));
    addVelocity(Math.floor(gridSize / 2), Math.floor(gridSize / 2) + 20, randInt(-250, 250), randInt(-1000, -500));
    



    // (viscous) diffusion step (backward in time ?)
    diffuse(1, tempVelocityX, velocityX, viscosity);
    diffuse(2, tempVelocityY, velocityY, viscosity);

    // to keep equilibrium (-> incompressible)
    project(tempVelocityX, tempVelocityY, velocityX, velocityY);

    // = "self-advection" : "the velocity field is moved along itself."
    // applies to the velocities in each direction (and the dye, below)
    advect(1, velocityX, tempVelocityX, tempVelocityX, tempVelocityY);
    advect(2, velocityY, tempVelocityY, tempVelocityX, tempVelocityY);

    project(velocityX, velocityY, tempVelocityX, tempVelocityY);

    // diffusion of the dye
    diffuse(0, tempDensity, density, diffusion);
    // advection of the dye
    advect(0, density, tempDensity, velocityX, velocityY);
}

function render() {
    // clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // fill to black
    //ctx.beginPath();
    //ctx.fillStyle = "black";
    //ctx.fillRect(0, 0, canvas.width, canvas.height);
    //ctx.closePath();

    const cellWidth = canvas.width / gridSize;
    const cellHeight = canvas.height / gridSize;

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const d = density[index(i, j)];
            //if(d) console.log(d)

            //ctx.beginPath();
            if(d > 1 && d < 32) {
                ctx.fillStyle = `rgba(131, 181, 248, ${Math.min(d, 1)})`; // light blue
                //ctx.fillStyle = `rgba(255, 0, 255, ${Math.min(d, 1)})`; // magenta
                //ctx.fillStyle = `rgba(204, 204, 0, ${Math.min(d, 1)})`; // dark yellow
                //ctx.fillStyle = `rgba(0, 255, 0, ${Math.min(d, 1)})`; // green
            } else if(d >= 32 && d < 256) {
                //ctx.fillStyle = `rgba(255, 0, 0, ${Math.min(d, 1)})`; // red
                ctx.fillStyle = `rgba(128, 0, 128, ${Math.min(d, 1)})`; // purple
                ctx.fillStyle = `rgba(131, 228, 228, ${Math.min(d, 1)})`; // blue vert
            } else {
                // from 0 -> 1 = black background -> colored
                //ctx.fillStyle = `rgba(0, 0, 255, ${Math.min(d, 1)})`; // blue
                ctx.fillStyle = `rgba(159, 227, 204, ${Math.min(d, 1)})`; // vert clair
                //ctx.fillStyle = `rgba(205, 87, 51, ${Math.min(d, 1)})`; // orange yellow
            }
            ctx.fillRect(i * cellWidth, j * cellHeight, cellWidth, cellHeight);
            //ctx.closePath();
        }
    }

}

function update() {
    step();
    render();
    requestAnimationFrame(update);
}

let lastX = 0, lastY = 0;
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / canvas.width) * gridSize);
    const y = Math.floor(((e.clientY - rect.top) / canvas.height) * gridSize);
    //addDensity(x, y, 1000);
    if((lastX - e.clientX) > 0 || (lastY - e.clientY) > 0) {
        const velX = e.clientX - lastX;
        const velY = e.clientY - lastY;
        addVelocity(x, y, velX * 300, velY * 300);
    }
    lastX = e.clientX;
    lastY = e.clientY;
    //console.log(lastX, lastY)
});


update();
