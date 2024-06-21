
export function drawPointAt(context, x, y, radius=3, color="black") {
	context.beginPath();
	context.arc(x, y, radius, 0, 2 * Math.PI); // full circle
	context.fillStyle = color;
	context.fill();
	context.closePath();
}

export function drawLine(context, x, y, x2, y2, width=3, color="blue") {
	context.beginPath();
	context.moveTo(x, y);
	context.lineTo(x2, y2);
	context.strokeStyle = color;
	context.lineWidth = width;
	context.closePath();
	context.stroke();
}

export function addHorizontalAt(context, canvasXPos, width=0.25) {
	context.beginPath();
	context.moveTo(0, canvasXPos);
  context.lineTo(canvas.width, canvasXPos);
	context.lineWidth = width;
	context.strokeStyle = "black";
	context.closePath();
  context.stroke();
}

export function addVerticalAt(context, canvasYPos, width=0.25) {
	context.beginPath();
	context.moveTo(canvasYPos, 0);
  context.lineTo(canvasYPos, canvas.height);
	context.lineWidth = width;
	context.strokeStyle = "black";
	context.closePath();
  context.stroke();
}

// function to convert from canvas coordinate to graph coordinates
export function convertToGraphCoords(x, y, canvasSquareSize=25) {
	return [((x - canvas.width * 0.25)) / canvasSquareSize, -((y - canvas.height * 0.75)) / canvasSquareSize];
}

export function convertToCanvasCoords(x, y, canvasSquareSize=25) {
	return [
		x * canvasSquareSize + canvas.width * 0.25, 
		-(y * canvasSquareSize) + canvas.height * 0.75
	]
}

export function drawAxis(context, canvasSquareSize=25) {
	// add (xy)-axis
	addHorizontalAt(context, canvas.height * 0.75, 2) // from top
	addVerticalAt(context, canvas.width * 0.25, 2) // from left
	
	// add a grid (lighter)
		// horizontal
	for(let i = 0; (canvas.height * 0.75) + canvasSquareSize * i <= canvas.height; i++) {
		addHorizontalAt(context, (canvas.height * 0.75) + canvasSquareSize * i);
	}
	for(let i = 0; (canvas.height * 0.75) - canvasSquareSize * i >= 0; i++) {
		addHorizontalAt(context, (canvas.height * 0.75) - canvasSquareSize * i);
	}
		// vertical
	for(let i = 0; (canvas.width * 0.25) + canvasSquareSize * i <= canvas.width; i++) {
		addVerticalAt(context, (canvas.width * 0.25) + canvasSquareSize * i);
	}
	for(let i = 0; (canvas.width * 0.25) - canvasSquareSize * i >= 0; i++) {
		addVerticalAt(context, (canvas.width * 0.25) - canvasSquareSize * i);
	}
}