
export function fillShape(ctx, posX, posY, shape='square', color='green', size=15, margin=2) {
    ctx.fillStyle = color;
    if(shape == 'circle') {
        ctx.beginPath();
        ctx.arc(size * posX + size/2, size * posY + size/2, size / 2 - margin, 0, 2 * Math.PI);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#DAF7A6"; // light green
        ctx.stroke();
    } else {
        ctx.fillRect(size * posX + margin, size * posY + margin, size - 2*margin, size - 2*margin);
    }
}

export function setUpCanvas(ctx, width, height) {
    ctx.fillStyle = 'lightgrey';
    ctx.fillRect(0, 0, width, height);
}

export function drawGrid(ctx, width, height, cellSize) {

    ctx.lineWidth = 1;

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
