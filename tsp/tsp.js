
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt, shuffle } from '../common/common.helper.js';
import { distance, round } from '../common/math.helper.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const randomPointsEl = document.getElementById("random_points");
const randomSolutionEl = document.getElementById("random_solution");
const apply2OptEl = document.getElementById("apply_2-opt");
const totalDistEl = document.getElementById("total_dist");

let points = [],
    path = [];

function main() {
    randomPointsEl.addEventListener('click', (e) => {
        points = generateNPoints(500);
        setUpCanvas(ctx, canvas.width, canvas.height, 'white'); // clear
        points.forEach(pt => drawPointAt(ctx, pt.x, pt.y, 3, 'black'))
    });
    randomSolutionEl.addEventListener('click', (e) => {
        path = findPath('random', points);
        
        setUpCanvas(ctx, canvas.width, canvas.height, 'white'); // clear
        drawPath(path, points);
        points.forEach(pt => drawPointAt(ctx, pt.x, pt.y, 3, 'black'))

        const dist = pathDistance(path, points);
        totalDistEl.innerHTML = round(dist, 1);
    });
    apply2OptEl.addEventListener('click', (e) => redraw());

    points = generateNPoints(500);

    redraw();
}

function generateNPoints(N) {
    const points = [];
    const MARGIN = 10;
    for(let i = 0; i < N; i++) {
        points.push({
            index: i,
            x: randInt(MARGIN, canvas.width - MARGIN),
            y: randInt(MARGIN, canvas.height - MARGIN),
        })
    }
    return points;
}

function findPath(method, points) {
    const path = [];
    switch(method) {
        case "random":
            const indexes = [...Array(points.length).keys()];
            const shuffledIndexes = shuffle(indexes);
            path.push(...shuffledIndexes);
            break;
    }
    return path;
}

function pathDistance(path, points) {
    let dist = 0;
    for(let i = 0; i < path.length; i++) {
        if(i == 0) continue;
        
        dist += distance(points[path[i-1]].x, points[path[i-1]].y, points[path[i]].x, points[path[i]].y);
    }
    return dist;
}

function drawPath(path, points) {
    for(let i = 0; i < path.length; i++) {
        if(i == 0) continue;
        
        drawLine(ctx, points[path[i-1]].x, points[path[i-1]].y, points[path[i]].x, points[path[i]].y, 1, 'blue');
    }
}

function twoOpt(solution) {

    let iter = 0,
        MAX_ITER = 10,
        is_better = true;

    while(is_better && iter < MAX_ITER) {
        is_better = false;

        iter += 1;

        // take each city in given order
        for(let i = 0; i < solution.length; i++) {
            for(let j = i + 1; j < solution.length; j++) { // O(n^2) ?

                // no need to skip if i and j % nodeCounts are the same ?!

                const A = solution[i]
                const B = solution[(i+1) % solution.length] // next city in the current solution
                const C = solution[j % solution.length]
                const D = solution[(j+1) % solution.length] // next ? (-1)

                //console.log(A, B, C, D) // indexes

                // check which of the current tour or the 2-swap is best
                const current_length = distance(points[A].x, points[A].y, points[B].x, points[B].y)
                    + distance(points[C].x, points[C].y, points[D].x, points[D].y)
                const new_length = distance(points[A].x, points[A].y, points[C].x, points[C].y)
                    + distance(points[B].x, points[B].y, points[D].x, points[D].y)

                const E_diff = new_length - current_length

                // if new tour is better
                if(E_diff < 0) {
                    // remplace edges (x_i, x_i+1) by (x_i, x_j)
                    //                   and (x_j, x_j+1) by (x_i+1, x_j+1)
                    
                    let part1 = solution.slice(0, i + 1);
                    let part2 = solution.slice(i + 1, j + 1).reverse();
                    let part3 = solution.slice(j + 1);
                    solution = part1.concat(part2, part3); // rewrite over solution array ... ?
                    
                    is_better = true
                }
            }
        }

        if(is_better) {
            console.log("improvments!")
        }
    }

    if(iter < MAX_ITER) {

    }

    return solution;
}

function redraw() {

    setUpCanvas(ctx, canvas.width, canvas.height, 'white')

    let dist = pathDistance(path, points);
    console.log("before:", dist);

    // find an other random path to improve ?
    path = findPath('random', points);

    path = twoOpt(path);

    dist = pathDistance(path, points);
    console.log("after 2-opt:", dist)
    totalDistEl.innerHTML = round(dist, 1);


    // draw path then points
    drawPath(path, points)
    points.forEach(pt => drawPointAt(ctx, pt.x, pt.y, 3, 'black'))

}

main();
