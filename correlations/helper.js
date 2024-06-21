
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
