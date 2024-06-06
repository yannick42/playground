
export function fillSquare(ctx, posX, posY, color='green', squareSize=15, margin=2) {
    ctx.fillStyle = color;
    ctx.fillRect(squareSize * posX + margin, squareSize * posY + margin, squareSize - 2*margin, squareSize - 2*margin);
}

export function setUpCanvas(ctx, width, height) {
    ctx.fillStyle = 'lightgrey';
    ctx.fillRect(0, 0, width, height);
}

export function drawGrid(ctx, width, height, cellSize) {
    // vertical lines
    for(let x = 0; x < width; x += cellSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);

        // Draw the Path
        ctx.strokeStyle = 'gray';
        ctx.stroke();
    }

    // horizontal lines
    for(let y = 0; y < width; y += cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);

        // Draw the Path
        ctx.stroke();
    }
}
