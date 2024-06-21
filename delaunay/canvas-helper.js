
export function createCanvas(width, height, container="#canvas") {
	const cont = document.querySelector(container);
	
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	cont.appendChild(canvas);
	
	return [canvas, canvas.getContext('2d')];
}

export const debug = (message) => document.querySelector("#debug").innerHTML += message + '<br/>';

export const clearDebug = () => document.querySelector("#debug").innerHTML = '';

export function createPoint(ctx, x, y, size, color, text='', angle=90) {
	ctx.beginPath();
	
	ctx.arc(x, y, size, 0, 2 * Math.PI);
	ctx.fillStyle = color
	ctx.strokeStyle = color == "red" ? "red" : "black";
	ctx.lineWidth = 3;
	ctx.fill();
	ctx.stroke();
	
	
	if(text) {
		// Set the text font style
		ctx.font = "bold 15px monospace";
		ctx.fillStyle = "white";
		// Draw the angle label with a Greek letter (e.g., θ)

		const p = 30;
		const [x1, x2] = [x-5, y+5];

		ctx.fillText(text, x1, x2);
	}

	ctx.closePath();
}

export function drawLine(ctx, x1, y1, x2, y2, color, lineWidth) {
	ctx.beginPath();
	ctx.moveTo(x1, y1);  // Starting point of the line
	ctx.lineTo(x2, y2);  // Ending point of the line
	ctx.strokeStyle = color;  // Set the line color
	ctx.lineWidth = lineWidth;  // Set the line width
	ctx.stroke();  // Draw the line
	ctx.closePath();  // Close the path
}

export function drawAngle(ctx, x1, y1, x2, y2, x3, y3, label, fontSize, color) {
    // Calculate the angle using the three points
    const angle = calculateAngle(x1, y1, x2, y2, x3, y3);

    // Set the text font style
    ctx.font = fontSize + "px Arial";
    ctx.fillStyle = color;

    // Draw an arc to represent the angle
    const centerX = x2;
    const centerY = y2;
    const radius = 15;
	
    let startAngle = Math.atan2(y1 - centerY, x1 - centerX);
    let endAngle = Math.atan2(y3 - centerY, x3 - centerX);
		
    // Draw the angle label with a Greek letter (e.g., θ)
    ctx.fillText(
			label + " = " + angle.toFixed(2) + "°",
			x2 + Math.cos((-startAngle*180/Math.PI + angle / 2))*20,
			y2 + Math.sin((-startAngle*180/Math.PI + angle / 2))*20
		);
	
		//debug("<b>label</b>=" + label + ", <b>angle</b>=" + angle +", <b>endAngle</b>="+(-endAngle*180/Math.PI)+", <b>startAngle</b>=" + (-startAngle*180/Math.PI) + " - " + ((endAngle - startAngle) * 180/Math.PI));
	
		if(
			((endAngle - startAngle) * 180/Math.PI < 0 || (endAngle - startAngle) * 180/Math.PI > 180)
			&& ((endAngle - startAngle) * 180/Math.PI > -180)
		) {
			//debug("<mark>inverser l'angle " + label + "</mark>");
			const temp = startAngle;
			startAngle = endAngle;
			endAngle = temp;
		}
	
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
}

export function drawTriangle(ctx, x1, y1, x2, y2, x3, y3, color="lightblue", lineWidth=3) {
		ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x1, y1);
		ctx.lineWidth = lineWidth;
		ctx.strokeWidth = lineWidth;
		ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
}

export function calculateAngle(x1, y1, x2, y2, x3, y3) {
    const vector1 = { x: x1 - x2, y: y1 - y2 };
    const vector2 = { x: x3 - x2, y: y3 - y2 };

    const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
    const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
    const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

    const cosTheta = dotProduct / (magnitude1 * magnitude2);
    const angleRad = Math.acos(cosTheta);
    const angleDeg = (angleRad * 180) / Math.PI;

    return angleDeg;
}
