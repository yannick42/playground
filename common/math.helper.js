import { drawLine } from './canvas.helper.js';

export function lerp(a, b, alpha) {
    return a + alpha * (b - a);
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

export function radToDeg(radians) {
    return radians * (180 / Math.PI);
}

export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx*dx + dy*dy);
}

export function normalize(vec) {
    const length = Math.sqrt(vec.map(v => v*v).reduce((partialSum, a) => partialSum + a, 0));
    return vec.map(v => v / length);
}

export function round(value, precision=2) {
    return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
}


export function computeBézierCurve(ctx, points, arrows, STEP_SIZE, selectedPointIndex=null, selectedArrowIndex=null) {

    const curvePoints = [points[0][0], points[0][1]]; // add starting point
    for (let i = 0; i < 1; i += STEP_SIZE) {

        // LERP along the 1st arrow
        const x1 = lerp(arrows[0][0], arrows[0][2], i);
        const y1 = lerp(arrows[0][1], arrows[0][3], i);

        // mid "arrow" ... from the end of the first one to the head of the other
        const x_mid = lerp(arrows[0][2], arrows[1][2], i);
        const y_mid = lerp(arrows[0][3], arrows[1][3], i);

        // LERP along the 2nd arrow (in reverse : from head to tail)
        const x2 = lerp(arrows[1][2], arrows[1][0], i);
        const y2 = lerp(arrows[1][3], arrows[1][1], i);

        // mid LERP
        const x1_ = lerp(x1, x_mid, i);
        const y1_ = lerp(y1, y_mid, i);
        
        const x2_ = lerp(x_mid, x2, i);
        const y2_ = lerp(y_mid, y2, i);

        // final LERP
        const x = lerp(x1_, x2_, i);
        const y = lerp(y1_, y2_, i);


        if(selectedPointIndex !== null || selectedArrowIndex !== null) {
            drawLine(ctx, x1, y1, x_mid, y_mid, 0.25, 'green');
            drawLine(ctx, x_mid, y_mid, x2, y2, 0.25, 'yellowgreen');
            //
            drawLine(ctx, x1_, y1_, x2_, y2_, 1, 'darkorange');
        }

        curvePoints.push([x, y]);
    }
    curvePoints.push([points[1][0], points[1][1]]);

    return curvePoints;
}


/**
 * LINEAR ALGEBRA / MATRICES
 */

// standard matrix multiplication
export function matMul(A, B) {
    //console.log("matMul:", A, B);

    // the matrices dimensions
    const aRows = A.length;
    const aCols = A[0].length;
    const bCols = B[0].length;

    //console.log("A rows=", aRows, " cols=", aCols, "B cols:", bCols);

    // Initialize the result matrix with zeros
    let result = new Array(aRows);
    for (let i = 0; i < aRows; i++) {
        result[i] = new Array(bCols).fill(0);
    }

    // Perform matrix multiplication
    for (let i = 0; i < aRows; i++) {
        for (let j = 0; j < bCols; j++) {
            for (let k = 0; k < aCols; k++) {
                result[i][j] += A[i][k] * B[k][j];
            }
        }
    }

    //console.log("result:", result, "rows:", result.length, "cols:", result[0].length);
    return result;
}

export function transpose(matrix) {
    // matrix dimensions
    const rows = matrix.length;
    const cols = matrix[0].length;

    // Initialize the transposed matrix with switched dimensions
    let transposed = new Array(cols);
    for (let i = 0; i < cols; i++) {
        transposed[i] = new Array(rows);
    }

    // Populate the transposed matrix
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            transposed[j][i] = matrix[i][j];
        }
    }

    return transposed;
}

export function showShape(A) {
    console.log("shape:", A.length, " by ", A[0].length);
}
