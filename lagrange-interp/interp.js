
import { drawPointAt, convertToGraphCoords, convertToCanvasCoords, drawAxis } from './helper.js';
import { drawLine } from '../common/canvas.helper.js'

const canvas = document.querySelector("#graph");
const context = canvas.getContext('2d');

const points = [];
const canvasSquareSize = 25; // x pixel = 1 unit

const debugEl = document.querySelector("#debug");
const numberOfPointsEl = document.querySelector("#number_of_points");
if(numberOfPointsEl) {
	numberOfPointsEl.innerText = 0;
}

const clearPointsButtonEl = document.querySelector("#clear_points");
clearPointsButtonEl.addEventListener('click', function() {
	while (points.length) { points.pop(); }
	if(numberOfPointsEl) numberOfPointsEl.innerText = 0;
	debugEl.innerHTML = '';

	// clear formula
	document.querySelector("#formula").innerHTML = '';
	
	// clear everything
	context.clearRect(0, 0, canvas.width, canvas.height);
	drawAxis(context, canvas);
});



function main() {
	
	drawAxis(context, canvas);

	// add 3 fixed points
	addPointAt(3, 10, 'ff0000');
	addPointAt(5, 7, '00ff00');
	addPointAt(10, 8, '0000ff');

	// listen to click on canvas
	canvas.addEventListener('click', function(evt) {
		const rect = canvas.getBoundingClientRect();
		const x = evt.clientX - rect.left;
		const y = evt.clientY - rect.top;
		
		let [x_pos, y_pos] = convertToGraphCoords(x, y);
		// snap to closest integer
		x_pos = Math.round(x_pos);
		y_pos = Math.round(y_pos);
		
		debugEl.innerHTML = 'Clicked at <b>x:' + x + ', y:' + y + '</b> (canvas position)';
		debugEl.innerHTML += '<br/>Clicked at <b>x:' + x_pos + ', y:' + y_pos + '</b> (graph position)';
		
		addPointAt(x_pos, y_pos);
		
	});
}

function addPointAt(x_pos, y_pos, color = null) {

	// clear (and redraw) everything
	context.clearRect(0, 0, canvas.width, canvas.height);
	drawAxis(context, canvas);
	
	// save clicked point with a new color
	const col = () => (Math.floor(Math.random()*255)).toString(16).padStart(2, '0');
	const randomColor = col() + col() + col();
	points.push([x_pos, y_pos, color ?? randomColor]);
	
	// update current number
	if(numberOfPointsEl) numberOfPointsEl.innerText = points.length;
	
	// draw polynomial
	lagrange(points);
	MathJax.typesetPromise()
	
	// re-add points on canvas
	points
		.map(point => [...convertToCanvasCoords(point[0], point[1]), point[2]])
		.forEach(([x_, y_, color]) => {
			drawPointAt(context, x_, y_, 6, "#" + color)
		});
}

// i => to skip in formula
function L_coef(i) {
	return (x) => {
		let prods = [];
		let latex = [];
		
		for(let k = 0; k < points.length; k++) {
			if(k == i) continue; // skip this one !
			prods.push((x_) => (x_ - points[k][0]) / (points[i][0] - points[k][0]));
			latex.push((x_) => "\\dfrac{x " + (points[k][0] >= 0 ? "- " + points[k][0] : points[k][0]) + "}{" + points[i][0] + (points[k][0] >= 0 ? "- " + points[k][0] : points[k][0]) + "}");
		}
		return [prods, latex];
	}
}

const formula = document.querySelector("#formula");

function lagrange(pts) {

	const n = pts.length;
	
	if(n <= 1) return; // impossible (even a simple line ...)
	
	let lagrange_polynomial = []; // list of summable functions ?
	for(let i = 0; i < n; i++) {
		const x = pts[i][0]; // given point
		const y = pts[i][1]; // given point

		// 
		lagrange_polynomial.push((a) => {
			const [L, latex] = L_coef(i)(x); // array of product functions parametrized with given "x"
			return [
				y * L.reduce((acc, currentFn) => acc *= currentFn(a), 1), // partial sum : y*L_k(x)
				y + " \\cdot " + latex.reduce((acc, latexFn) => acc + latexFn(a), '')
			];
		});
	}

	let latexes = [];
	for(let i = 0; i < pts.length; i++) {
		const x = pts[i][0]; // given point
		const y = pts[i][1]; // given point
		latexes.push(
			lagrange_polynomial.reduce((acc, currentSumEl, index) => acc + (index == i ? currentSumEl(x)[1] : ''), '')
		);
	}
	
	const str = "$$\\displaylines{\\scriptsize{" +
		latexes.map((latex, i) => ((i>0 && i%3===0)?" \\\\ ":"") +
		"{\\color{#" + pts[i][2] + "}" + latex + "}").join(" + ") +
		"}}$$";
	formula.innerText = str;
	
	// from X -> to X
	const [x_min, ] = convertToGraphCoords(0, 0);
	const [x_max, ] = convertToGraphCoords(canvas.width, 0);
	
	const step = 0.15
	let prevPoint; // for L(x)
	let prevPoints = []; // for each function that are be summed to give L(x)

	for(let xx = x_min; xx <= x_max; xx=xx+step)
	{
		// for each "k"
		const yy_ = [];
	
		for(let k = 0; k < pts.length; k++) {
			yy_.push(lagrange_polynomial.reduce((acc, currentSumEl, index) => acc + (index == k ? currentSumEl(xx)[0] : 0), 0));
		}
		// draw each L_k(x) coefficients in the color of the associated point
		yy_.forEach((y, index) => {
			const [x_, y_] = convertToCanvasCoords(xx, y);
			if(prevPoints[index]) {
				drawLine(context, prevPoints[index][0], prevPoints[index][1], x_, y_, 1, "#"+pts[index][2]);
			}
			prevPoints[index] = [x_, y_];
		});

		// find the "y" of the L(x) polynomial
		const yy = lagrange_polynomial.reduce((acc, currentSumEl) => acc + currentSumEl(xx)[0], 0);
		// draw the resulting polynomial L(x) (with a bolder line)
		const [x, y] = convertToCanvasCoords(xx, yy);
		if(prevPoint) {
			drawLine(context, prevPoint[0], prevPoint[1], x, y, 4, "black");
		}
		prevPoint = [x, y];

	}
}

window.onload = function() {
	main();
}