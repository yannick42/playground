
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

export function round(value, precision=2) {
    return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
}

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
