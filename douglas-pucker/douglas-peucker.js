
import { setUpCanvas, drawPointAt, drawLine } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const epsilonEl = document.querySelector("#epsilon");

// heart shape (by default)
const points = [[242,380],[231,368],[212,347],[201,331],[187,314],[171,294],[162,281],[153,269],[147,255],[143,241],[141,228],[141,213],[142,199],[150,186],[163,174],[175,167],[192,163],[222,166],[236,172],[249,187],[257,204],[260,215],[262,222],[269,220],[289,214],[306,204],[328,197],[349,197],[369,207],[387,225],[394,243],[389,266],[374,289],[348,324],[332,339],[310,359],[281,372],[260,381],[244,385]];

function main() {
    document.querySelector("#clear").addEventListener('click', (e) => clear());
    document.querySelector("#simplify").addEventListener('click', (e) => simplify());

    canvas.addEventListener('click', (e) => {
        const point = [e.offsetX, e.offsetY];
        drawPointAt(ctx, point[0], point[1], 4, 'black');

        if(points.length > 0) { // a previous point is present
            const prevPoint = points[points.length - 1  ];
            drawLine(ctx, prevPoint[0], prevPoint[1], point[0], point[1], 2, 'black');
        }

        points.push(point);

        console.log(points);
    })

    redraw();
}

function clear() {
    points.splice(0, points.length);
    redraw();
}

function drawLineThroughPoints(points, lineWidth, color) {
    for(let i = 1; i < points.length; i++) {
        drawLine(ctx, points[i - 1][0], points[i - 1][1], points[i][0], points[i][1], lineWidth, color);
    }
}

function simplify() {
    redraw(); // clear canvas to initial color

    const simplifiedPoints = douglasPeucker(points, epsilonEl.value ?? 10);
    //console.log("simplified points : ", simplifiedPoints);

    drawLineThroughPoints(simplifiedPoints, 3, 'red');
    simplifiedPoints.forEach(point => drawPointAt(ctx, point[0], point[1], 4, 'red'));

    // overlay debugging info.
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "green";
    ctx.fillText(`simplified from ${points.length} points to ${simplifiedPoints.length}`, 15, 25);
}

/**
 * https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
 */
function perpDist(point, line) {

    const P0 = line[0],
        P1 = line[1];
    
    const num = Math.abs( (P1[1] - P0[1]) * point[0] - (P1[0] - P0[0]) * point[1] + P1[0] * P0[1] - P1[1] * P0[0])
    const den = Math.sqrt( Math.pow(P1[1] - P0[1], 2) + Math.pow(P1[0] - P0[0], 2) );

    return num / den;
}

function douglasPeucker(points, epsilon) {

    let distMax = 0; // to find the point with maximum distance
    let index = 0; // its index ?
    const size = points.length;
    const line = [points[0], points[size - 1]]; // current "line"

    for(let i = 1; i < size - 1; i++) {
        const d = perpDist(points[i], line);
        if(d > distMax) {
            index = i;
            distMax = d;
        }
    }

    // recursively simplify
    if(distMax > epsilon) {

        const segment1 = points.slice(0, index);
        const segment2 = points.slice(index, size);

        const res1 = segment1.length > 1 ? douglasPeucker(segment1, epsilon) : segment1;
        const res2 = segment2.length > 1 ? douglasPeucker(segment2, epsilon) : segment2;

        return res1.concat(res2);
    } else {
        return line; // simplify to a line !
    }
}

function redraw() {
    setUpCanvas(ctx, 500, 500, '#F2F4F4');

    drawLineThroughPoints(points, 2, 'black');
    points.forEach(point => drawPointAt(ctx, point[0], point[1], 4, 'black'));
}

main();
