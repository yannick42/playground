
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';
import { lerp } from '../common/math.helper.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const POINT_RADIUS = 3,
    POINT_COLOR = 'black',
    ARROW_WIDTH = 2,
    ARROW_HEAD = 4,
    ARROW_COLOR = 'black',
    LINE_WIDTH = 3,
    LINE_COLOR = 'orange',
    BG_COLOR = 'white',
    points = [];

function main() {
    // events:
        // refresh button
    document.querySelector("#refresh").addEventListener('click', (e) => redraw());

    redraw();
}

function redraw() {

    points.splice(0, points.length); // clear const array of points

    setUpCanvas(ctx, canvas.width, canvas.height, BG_COLOR);

    // add 2 random points
    points.push([randInt(0, canvas.width), randInt(0, canvas.height)]);
    points.push([randInt(0, canvas.width), randInt(0, canvas.height)]);

    // add 2 arrows, and draw them
    const arrows = [];
    points.forEach(point => {
        const x = point[0], y = point[1];
        const arrow = [x, y, randInt(0, canvas.width), randInt(0, canvas.height)];

        drawArrow(ctx, x, y, arrow[2], arrow[3], ARROW_COLOR, ARROW_WIDTH, ARROW_HEAD);

        arrows.push(arrow);
    })

    const STEP_SIZE = 1 / 100;
    const curvePoints = [points[0][0], points[0][1]]; // add starting point
    for (let i = 0; i < 1; i += STEP_SIZE) {

        // LERP along the 1st arrow
        const x1 = lerp(arrows[0][0], arrows[0][2], i);
        const y1 = lerp(arrows[0][1], arrows[0][3], i);
        //drawPointAt(ctx, x1, y1, POINT_RADIUS, "green");

        // mid "arrow" ...
        const x_mid = lerp(arrows[0][2], arrows[1][2], i);
        const y_mid = lerp(arrows[0][3], arrows[1][3], i);

        // LERP along the 2nd arrow (in reverse)
        const x2 = lerp(arrows[1][2], arrows[1][0], i);
        const y2 = lerp(arrows[1][3], arrows[1][1], i);
        //drawPointAt(ctx, x2, y2, POINT_RADIUS, "orange");

        // mid LERP
        const x1_ = lerp(x1, x_mid, i);
        const y1_ = lerp(y1, y_mid, i);
        const x2_ = lerp(x_mid, x2, i);
        const y2_ = lerp(y_mid, y2, i);

        // final LERP
        const x = lerp(x1_, x2_, i);
        const y = lerp(y1, y2_, i);

        curvePoints.push([x, y]);
    }
    curvePoints.push([points[1][0], points[1][1]]);

    const nbCurvePoints = curvePoints.length;
    curvePoints.forEach((point, i) => {
        if(i + 1 === nbCurvePoints) return; // last point

        drawLine(ctx, point[0], point[1], curvePoints[i+1][0], curvePoints[i+1][1], LINE_WIDTH, LINE_COLOR);
    });

    // draw the 2 points (last = above)
    points.forEach(point => {
        const x = point[0], y = point[1];
        drawPointAt(ctx, x, y, POINT_RADIUS, POINT_COLOR);
        drawPointAt(ctx, x, y, POINT_RADIUS, POINT_COLOR);
    });

}

main();
