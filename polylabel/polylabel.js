
import { setUpCanvas, drawPointAt, drawRectangle, drawCircle } from '../common/canvas.helper.js';
import { randInt, randFloat } from '../common/common.helper.js';
import { PriorityQueue } from './priority-queue.js';
import { Iceland } from './Iceland.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const debugDiv = document.getElementById('debug');
const resultsDiv = document.getElementById('results');

const precision = 1.5, // pixels
    gridLineWidth = 0.5,
    gridColor = 'white',
    finalCircleWidth = 5,
    circleColor = '#289059', // green
    finalPointSize = 5,
    finalPointColor = '#289059', //green
    polygonColor = '#7dcde5',
    intermediateCircleColor = '#f5c03b', // orange
    intermediateCircleWidth = 3;

// evolution of the current best values (.d : min distance to polygon)
let bestsProgression = [];
let bestCells = [];

function createRandomPolygon(centerX, centerY, n=30, irregularity=0.6, spikiness=0.35, avgRadius=250) {
    //const incrementBy = 2 * Math.PI / n; // equally-spaced
    const polygons = []

    function BoxMuller(mu=0, sigma=1) { // TODO
        // 
        // Box-Muller transform
        //
        const u1 = 1 - randFloat(0, 1); // to avoid log(0)
        const u2 = randFloat(0, 1);
        
        // both have mu=0, s²=1
        const pointX = Math.sqrt(-2*Math.log(u1)) * Math.cos(2*Math.PI*u2);
        //const pointY = Math.sqrt(-2*Math.log(u1)) * Math.sin(2*Math.PI*u2);

        //const r = Math.sqrt(pointX*pointX + pointY*pointY);
        //const theta = Math.atan(pointY / pointX);

        //console.log(pointX, pointY);
        return sigma * pointX + mu;
    }

    function clip(value, min, max) {
        return Math.min(max, Math.max(value, min))
    }

    const irr = irregularity * 2 * Math.PI / n;
    const lower = 2 * Math.PI / n - irr;
    const upper = 2 * Math.PI / n + irr;

    let angles = [];
    let cumsum = 0;
    for(let i = 0; i < n; i++) {
        const angle = randFloat(lower, upper);
        angles.push(angle);
        cumsum += angle;
    }

    cumsum = cumsum / (2 * Math.PI);
    
    angles = angles.map(a => a / cumsum);

    let currentAngle = 0;
    angles.forEach(phi_step => {
        //console.log(phi_step)
        const gaussian = BoxMuller(avgRadius /* mu */, spikiness * avgRadius/2 /* sigma */)
        const r = clip(gaussian, 0, 2  *avgRadius);
        const x = r * Math.cos(currentAngle) + centerX;
        const y = r * Math.sin(currentAngle) + centerY;
        polygons.push([x, y]);

        currentAngle += phi_step;
    });
    return polygons;
}

function drawPolygon(ctx, polygon, polygonColor="white", strokeStyle="black") {
    ctx.fillStyle = polygonColor;
    ctx.lineWidth = 0.4;
    ctx.strokeStyle = strokeStyle;
    ctx.beginPath();
    ctx.moveTo(polygon[0][0], polygon[0][1]);
    polygon.forEach(pt => ctx.lineTo(pt[0], pt[1]));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function getEnvelope(polygon) {
    return {
        x_min: Math.min(...polygon.map(pt => pt[0])),
        x_max: Math.max(...polygon.map(pt => pt[0])),
        y_min: Math.min(...polygon.map(pt => pt[1])),
        y_max: Math.max(...polygon.map(pt => pt[1]))
    }
}

function getCentroidCell(polygon) {
    let area = 0;
    const c = [0, 0];

    for(let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const a = polygon[i];
        const b = polygon[j];
        const f = a[0] * b[1] - b[0] * a[1];
        c[0] += (a[0] + b[0]) * f;
        c[1] += (a[1] + b[1]) * f;
        area += f * 3;
    }
    const centroid = new Cell(c[0] / area, c[1] / area, 0, polygon);

    if(area == 0 || centroid.d < 0) return new Cell(polygon[0][0], polygon[0][1], 0 /*h*/, polygon);

    return centroid;
}

function getSegDist(p, a, b) {
    let x = a[0];
    let y = a[1];
    let dx = b[0] - x;
    let dy = b[1] - y;

    if (dx !== 0 || dy !== 0) {

        const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);

        if (t > 1) {
            x = b[0];
            y = b[1];
        } else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }

    dx = p[0] - x;
    dy = p[1] - y;

    return Math.sqrt(dx * dx + dy * dy);
}

function pointToPolygon(pt, polygon) {
    let inside = false;
    let minDist = Number.POSITIVE_INFINITY;

    for(let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const a = polygon[i];
        const b = polygon[j];

        if (
            (a[1] > pt[1]) !== (b[1] > pt[1])
            && (pt[0] < (b[0] - a[0]) * (pt[1] - a[1]) / (b[1] - a[1]) + a[0])
        ) {
            inside = !inside;
        }

        minDist = Math.min(minDist, getSegDist(pt, a, b));
    }
    return (inside ? 1 : -1) * minDist;
}

class Cell {
    constructor(cx, cy, h, polygon) {
        this.d = pointToPolygon([cx, cy], polygon);
        this.max = this.d + h * Math.sqrt(2);
        this.x = cx;
        this.y = cy;
        this.h = h;
    }
}

// using Polylabel algorithm (Mapbox)
function findPOI(polygon) {
    console.log("START: finding POI !")

    // get bounding box
    const envelope = getEnvelope(polygon);

    // find lower size (either height (y) or width (x))
    const xSize = envelope.x_max - envelope.x_min;
    const ySize = envelope.y_max - envelope.y_min;
    let cellSize = Math.min(xSize, ySize); // TODO: if cellSize = 0 -> ?
    let h = cellSize / 2;

    // create cells to cover the polygon with initial cells
    const pq = new PriorityQueue();
    for(let x = envelope.x_min; x < xSize + envelope.x_min; x += cellSize) {
        for(let y = envelope.y_min; y < ySize + envelope.y_min; y += cellSize) {
            const cell = new Cell(
                x + h, // cell center !
                y + h,
                h,
                polygon
            );
            drawRectangle(ctx, x, y, x + 2*h, y + 2*h, gridLineWidth, gridColor)
            pq.enqueue(cell, cell.max);
        }
    }
    
    // TODO: compute distance from center of cell to the polygon (???)
    // [negative if outside (detected by raycasting = ??)]

    // Calculate the distance from the centroid of the polygon and pick it as the first "best so far"
    // take centroid as the first best guess
    let bestCell = getCentroidCell(polygon);
    console.log("centroid cell:", bestCell)

    let numProbes = pq.count();
    //console.log("numProbes:", numProbes) // at first, the 2+ initial cells

    // Loop on the priority queue
    // where cells are ordered by "max" potential distance
    while(pq.count()) {

        const cell = pq.dequeue();
        //console.log(cell.d, cell.max) // TODO : min-heap ?!

        // TODO ??? 
        //drawRectangle(ctx, cell.x, cell.y, cell.x+cell.h, cell.y+cell.h, gridLineWidth, gridColor);
        
        // if the cell's distance is better than the current best -> save it
        if (cell.d > bestCell.d) {

            bestCells.push(bestCell); // storage for later display

            bestCell = cell;
            /*
            ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
            ctx.fillRect(bestCell.x, bestCell.y, bestCell.h, bestCell.h);
            */
            console.log("better cell found with distance of ", bestCell.d)
            bestsProgression.push(bestCell.d);
        } else {
            //console.log(cell.d, "is not better than", bestCell.d)
        }

        // do not drill down further if there's no chance of a better solution
        if (cell.max - bestCell.d <= precision) {
            //console.log("do not drill down further !")
            continue;
        }
        // cell_max - best_dist > precision -> SPLIT CELL in 4
        
        h = cell.h / 2;

        const cell1 = new Cell(cell.x - h, cell.y - h, h, polygon);
        pq.enqueue(cell1, cell1.max);

        const cell2 = new Cell(cell.x + h, cell.y - h, h, polygon);
        pq.enqueue(cell2, cell2.max);
        
        const cell3 = new Cell(cell.x - h, cell.y + h, h, polygon);
        pq.enqueue(cell3, cell3.max);
        
        const cell4 = new Cell(cell.x + h, cell.y + h, h, polygon);
        pq.enqueue(cell4, cell4.max);

        // draw them
        drawRectangle(ctx, cell1.x - h, cell1.y - h, cell1.x + h, cell1.y + h, gridLineWidth, gridColor);
        drawRectangle(ctx, cell2.x - h, cell2.y - h, cell2.x + h, cell2.y + h, gridLineWidth, gridColor);
        drawRectangle(ctx, cell3.x - h, cell3.y - h, cell3.x + h, cell3.y + h, gridLineWidth, gridColor);
        drawRectangle(ctx, cell4.x - h, cell4.y - h, cell4.x + h, cell4.y + h, gridLineWidth, gridColor);

        numProbes += 4;
    }

    console.log("numProbes:", numProbes);

    ctx.fillStyle = 'black';
    ctx.font = `11pt Verdana`;
    ctx.fillText(numProbes + " cells created", canvas.width/2 - 55, 20);
    
    console.log(">>", bestCell);
    return bestCell;
}


function main() {
    document.querySelector("#iceland").addEventListener('click', (e) => redrawIceland());

    document.querySelector("#refresh").addEventListener('click', (e) => {
        const avgRadius = 150,
            n = 40,
            spikiness = 0.55,
            irregularity = 0.9;

        polygon = createRandomPolygon(
            // polygon center
            canvas.width / 2,
            canvas.height / 2 + 20,
            n,
            irregularity,
            spikiness,
            avgRadius
        );

        redraw();
    });

    const avgRadius = 150,
        n = 40,
        spikiness = 0.55,
        irregularity = 0.9;

    polygon = createRandomPolygon(
        // polygon center
        canvas.width / 2,
        canvas.height / 2 + 20,
        n,
        irregularity,
        spikiness,
        avgRadius
    );

    redraw();
}

function normalizePolygon(points, canvasSize = 500, centerLat = 65, centerLon = -18) {

    let R = 6371; // Approximate Earth radius in km (optional for scaling)
    let rad = Math.PI / 180; // Degree to radian conversion

    let projectedPoints = points.map(([lon, lat]) => [
        R * (lon - centerLon) * Math.cos(centerLat * rad),  // X Projection
        R * (lat - centerLat)                               // Y Projection
    ]);

    // Step 1: Find the bounding box
    let minX = Math.min(...projectedPoints.map(p => p[0]));
    let maxX = Math.max(...projectedPoints.map(p => p[0]));
    let minY = Math.min(...projectedPoints.map(p => p[1]));
    let maxY = Math.max(...projectedPoints.map(p => p[1]));

    // Step 2: Compute scale while maintaining aspect ratio
    let scaleX = canvasSize / (maxX - minX);
    let scaleY = canvasSize / (maxY - minY);
    let scale = Math.min(scaleX, scaleY); // Keep aspect ratio

    // Step 3: Apply scaling and translation to center
    return projectedPoints.map(([x, y]) => [
        (x - minX) * scale,   // Scale X
        canvasSize - (y - minY) * scale - 50    // Scale Y
    ]);
}

let polygon;

function redrawIceland() {
    polygon = normalizePolygon(Iceland, 500);
    redraw();
}

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    debugDiv.innerHTML = "";
    bestsProgression = []; // erase all
    bestCells = [];

    drawPolygon(ctx, polygon, polygonColor, "black");

    const cell = findPOI(polygon);
    
    //
    // show result
    //

    bestCells.forEach((c) => {
        drawCircle(ctx, c.x, c.y, c.d, intermediateCircleColor, intermediateCircleWidth);
        drawPointAt(ctx, c.x, c.y, intermediateCircleWidth, intermediateCircleColor);
    });

    console.log("best:", cell)
    drawCircle(ctx, cell.x, cell.y, cell.d, circleColor, finalCircleWidth);
    drawPointAt(ctx, cell.x, cell.y, finalPointSize, finalPointColor);

    // redraw the outline of the polygon shape
    drawPolygon(ctx, polygon, "transparent", "black");

    debugDiv.innerHTML += "<b>Progression:</b> " + bestsProgression.map(dist => Math.round(dist * 10) / 10).join(' -> ') ?? 'no best option than centroid';

    ctx.fillStyle = finalPointColor;
    ctx.font = `10pt Verdana`;
    ctx.fillText("best point of inaccessibility found", canvas.width/2 - 105, 35);
    ctx.fillText("with radius : " + Math.round(cell.d) + " pixels", canvas.width/2 - 70, 49);
}

main();
