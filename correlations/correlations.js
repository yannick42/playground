
/*
TODO:
 - movable points (& update values in live)
 - have preconfigured points "shape"
 - button to clear points
 - counter of the number of points
*/

import { drawAxis, drawPointAt, convertToCanvasCoords, convertToGraphCoords } from './helper.js';

const CANVAS_WIDTH = 600,
			CANVAS_HEIGHT = 600,
			points = [];

function pearson(points) {
	if(points.length <= 1) return;
	
	const E_X = points.reduce((acc, value) => acc + value[0], 0) / points.length;
	const E_Y = points.reduce((acc, value) => acc + value[1], 0) / points.length;
	const E_XY = points.reduce((acc, value) => acc + value[0]*value[1], 0) / points.length;
	const E_X2 = points.reduce((acc, value) => acc + value[0]**2, 0) / points.length;
	const E_Y2 = points.reduce((acc, value) => acc + value[1]**2, 0) / points.length;
	
	return (E_XY - E_X*E_Y) / (Math.sqrt(E_X2 - E_X**2) * Math.sqrt(E_Y2 - E_Y**2))
}

function spearman(points) {
	if(points.length <= 1) return;
	
	// get ranks for each point
	let indexedArray_X = points.sort((a, b) => a[1] - b[1]).map((value, index) => ({ x: value[0], y: value[1], index }));
	let indexedArray_Y = points.sort((a, b) => a[0] - b[0]).map((value, index) => ({ x: value[0], y: value[1], index }));
	
	// both ordered on x-axis
	const rankedX = indexedArray_X.sort((pt1, pt2) => pt1.x - pt2.x).map(pt => pt.index);
	const rankedY = indexedArray_Y.sort((pt1, pt2) => pt1.x - pt2.x).map(pt => pt.index);
	
	const ranked = rankedX.map((value, index) => [value, rankedY[index]]);
	return pearson(ranked);
}

function kendall(points) {
	if(points.length <= 1) return;

	// ... pairs
	let concordant = 0,
			discordant = 0;

	points.forEach((pt, index) => {
		points.forEach((pt2, index2) => {
			if(index !== index2) {
				if((pt[0] > pt2[0] && pt[1] > pt2[1]) || (pt[0] < pt2[0] && pt[1] < pt2[1])) {
					concordant += 1;
				} else {
					discordant += 1;
				}
			}
		});
	});
	const number_of_pairs = (points.length * (points.length - 1));
	
	return (concordant -  discordant) / number_of_pairs;
}

function c_k(n, k) {
	if (Number.isNaN(n) || Number.isNaN(k)) return NaN;
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  if (k === 1 || k === n - 1) return n;
  if (n - k < k) k = n - k;
  let res = n;
  for (let j = 2; j <= k; j++) res *= (n - j + 1) / j;
  return Math.round(res);
}

function cosine_similarity(points) {
	if(points.length <= 1) return;
	
	const vector_x = points.map(pt => pt[0]);
	const vector_y = points.map(pt => pt[1]);
	
	let x_magn = Math.sqrt(vector_x.reduce((acc, x) => acc + x*x, 0));
	let y_magn = Math.sqrt(vector_y.reduce((acc, y) => acc + y*y, 0));
	
	let cosSim = 0;
	for(let i = 0; i < points.length; i++) {
		cosSim += vector_x[i] * vector_y[i];
	}
	
	return cosSim / (x_magn * y_magn);
}

function main() {

	// init canvas grid
	const canvas = document.querySelector("#canvas");
	canvas.width = CANVAS_WIDTH;
	canvas.height = CANVAS_HEIGHT;
	const ctx = canvas.getContext('2d');
	
	drawAxis(ctx);
	
	// listen to click on canvas to add points manually
	canvas.addEventListener('click', function(evt) {
		const rect = canvas.getBoundingClientRect();
		const x = evt.clientX - rect.left;
		const y = evt.clientY - rect.top;
		const [x_pos, y_pos] = convertToGraphCoords(x, y);
		
		drawPointAt(ctx, x, y, 5, "black");
		points.push([x_pos, y_pos]);
		
		// calculate Pearson Correlation Coefficient
		const pearsonValue = pearson(points);
		document.querySelector("#pearson").innerHTML = isNaN(pearsonValue) ? '-' : Math.round(pearsonValue * 1e5) / 1e5;
		
		// calculate Spearman's rho
		const spearmanValue = spearman(points);
		document.querySelector("#spearman").innerHTML = isNaN(spearmanValue) ? '-' : Math.round(spearmanValue * 1e5) / 1e5;
		
		// calculate Kendall's tau
		const kendallValue = kendall(points);
		document.querySelector("#kendall").innerHTML = isNaN(kendallValue) ? '-' : Math.round(kendallValue * 1e5) / 1e5;
		
		// calculate Cosine Similarity
		document.querySelector("#cosine_similarity").innerHTML = Math.round(cosine_similarity(points) * 1e5) / 1e5;
		
	});
}

main();
