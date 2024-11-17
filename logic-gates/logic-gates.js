
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../_common/canvas.helper.js';
import { randInt, choice } from '../_common/common.helper.js';
import { getPathBoundingBox, getBoundingBox, getBBoxCenter } from '../_common/geometry.helper.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const SHOW_GATED_BBOX = true,
    GATE_COLOR = 'FireBrick',
    GATE_NAME_COLOR = 'RebeccaPurple',
    GATE_BBOX_COLOR = 'YellowGreen';

// ANSI
const logicGatesPaths = {
    'NAND': [
        { strokeWidth: 2, d: "M79 25h16M31 15H5M32 35H5" },
        { d: "M30 5V45H50.47619c11.267908 0 20-9.000045 20-20s-8.732091-20-20-20H30zm2.857143 2.857143H50.47619c9.760663 0 16.666667 7.639955 16.666667 17.142857 0 9.502902-7.382195 17.142857-17.142857 17.142857H32.857143V7.857143z" },
        { strokeWidth: 3, d: "M79 25a4 4 0 1 1-8 0 4 4 0 1 1 8 0z" },
    ],
    'NOR': [
        { strokeWidth: 2, d: "M 41.076272,15 L 15.076272,15" }, // A pin
        { strokeWidth: 2, d: "M 42.076272,35 L 15.076272,35" }, // B pin
        { strokeWidth: 2, d: "M 88.203221,25 C 109.29453,25 105.07627,25 105.07627,25" }, // end pin
        // 
        { translateX: 9, translateY: 0, strokeWidth: 2, d: "M 79,25 A 4,4 0 1 1 71,25 A 4,4 0 1 1 79,25 z"}, // not
        { translateX: 26.5, translateY: -39.5, d: "M 7.6700216,44.5 L 9.6700216,46.9375 C 9.6700216,46.9375 15.326272,53.937549 15.326272,64.5 C 15.326272,75.062451 9.6700216,82.0625 9.6700216,82.0625 L 7.6700216,84.5 L 10.826272,84.5 L 24.826272,84.5 C 27.234348,84.500001 32.515971,84.524514 38.451272,82.09375 C 43.952029,79.840951 50.024779,75.456504 54.984922,67.238862 L 53.826272,64.5 L 54.987161,61.767184 C 44.664037,44.700133 29.409159,44.5 24.826272,44.5 L 10.826272,44.5 L 7.6700216,44.5 z M 13.545022,47.5 L 24.826272,47.5 C 29.510445,47.5 43.113122,47.369793 52.795022,64.5 C 48.028236,72.929075 42.273741,77.18391 37.076272,79.3125 C 31.715611,81.507924 27.234347,81.500001 24.826272,81.5 L 13.576272,81.5 C 15.44986,78.391566 18.326272,72.45065 18.326272,64.5 C 18.326272,56.526646 15.41774,50.599815 13.545022,47.5 z" }, // body
    ]
}

function main() {
    //document.querySelector("#refresh").addEventListener('click', (e) => redraw());

    redraw();
}

function drawGate(ctx, gateName, centerX, centerY) {
    
    // find its center
    const boxes = []; // SVGRect[]
    logicGatesPaths[gateName].forEach(path => {
        boxes.push(getPathBoundingBox(path.d, [path.translateX ?? 0, path.translateY ?? 0]));
    });
    const bbox = getBoundingBox(boxes);
    const [gateCenterX, gateCenterY] = getBBoxCenter(bbox)

    // move whole canvas...
    const posX = centerX - gateCenterX;
    const posY = centerY - gateCenterY;
    ctx.translate(posX, posY);

    console.log("Gate name:", gateName, "boxes:", boxes, "bbox:", bbox, centerX, centerY,
        "gateCenterX:", gateCenterX, "gateCenterY:", gateCenterY, "posX:", posX, "posY:", posY);

    // draw NAND gate
    logicGatesPaths[gateName].forEach(path => {
        const p = new Path2D(path.d);

        if(path.translateX || path.translateY) {
            ctx.save();
            ctx.translate(path.translateX, path.translateY);
        }

        ctx.fillStyle = GATE_COLOR;
        ctx.strokeStyle = GATE_COLOR;
        if(path.strokeWidth) {
            ctx.lineWidth = path.strokeWidth;
            ctx.stroke(p);
        }else {
            ctx.fill(p);
        }

        if(path.translateX || path.translateY) {
            ctx.restore();
        }

    });

    ctx.font = "bold 8px sans-serif";
    ctx.fillStyle = GATE_NAME_COLOR;
    ctx.fillText(gateName, gateCenterX - 12, gateCenterY + 3);

    if(SHOW_GATED_BBOX) { // bounding box
        ctx.lineWidth = 0.25;
        ctx.lineStyle = GATE_BBOX_COLOR;
        ctx.strokeStyle = GATE_BBOX_COLOR;

        ctx.beginPath();
        ctx.rect(bbox.x, bbox.y, bbox.width, bbox.height);
        ctx.stroke();
    }

    // return to default ...
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function getRandomGate() {
    return choice(Object.keys(logicGatesPaths));
}

function redraw() {

    drawGate(ctx, getRandomGate(), canvas.width / 4, canvas.height / 4);
    drawGate(ctx, getRandomGate(), canvas.width / 4, canvas.height / 2);
    drawGate(ctx, getRandomGate(), canvas.width / 4, 3 * canvas.height / 4);
    drawGate(ctx, getRandomGate(), 3 * canvas.width / 4, canvas.height / 4);
    drawGate(ctx, getRandomGate(), 3 * canvas.width / 4, canvas.height / 2);
    drawGate(ctx, getRandomGate(), 3 * canvas.width / 4, 3 * canvas.height / 4);

}

main();
