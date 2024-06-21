
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

export function addCanvas(width=800, height=600) {
	const body = document.querySelector("#canvas");
	
	// new canvas
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	
	body.appendChild(canvas);
	return [canvas, canvas.getContext("2d")];
}

export function drawPointAt(context, x, y, radius=3, color="black") {
	context.beginPath();
	context.arc(x, y, radius, 0, 2 * Math.PI); // full circle
	context.fillStyle = color;
	context.fill();
	context.closePath();
}

export function draw_arrow(ctx, x0, y0, x1, y1, color) {
  const width = 0.33;
  const head_len = 2;
  const head_angle = Math.PI / 6;
  const angle = Math.atan2(y1 - y0, x1 - x0);

  ctx.lineWidth = width;

  // Adjust the point
  x1 -= width * Math.cos(angle);
  y1 -= width * Math.sin(angle);

	// body
  ctx.beginPath();
	ctx.strokeStyle = color;
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();

	// head
  ctx.beginPath();
	ctx.strokeStyle = color;
  ctx.lineTo(x1, y1);
  ctx.lineTo(x1 - head_len * Math.cos(angle - head_angle), y1 - head_len * Math.sin(angle - head_angle));
  ctx.lineTo(x1 - head_len * Math.cos(angle + head_angle), y1 - head_len * Math.sin(angle + head_angle));
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
}

export function draw_arrow_2(context, fromx, fromy, tox, toy) {
  var headlen = 10; // length of head in pixels
  var dx = tox - fromx;
  var dy = toy - fromy;
  var angle = Math.atan2(dy, dx);
  context.moveTo(fromx, fromy);
  context.lineTo(tox, toy);
  context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
  context.moveTo(tox, toy);
  context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
}

export function drawRectangle(context, x, y, x2, y2, width=1) {
	context.beginPath();
  context.lineWidth = width;
	context.rect(x, y, x2 - x, y2 - y);
	context.stroke();
}
