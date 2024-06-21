
// canvas helper functions
import { createCanvas, createPoint, drawLine, drawAngle, calculateAngle, drawTriangle, debug, clearDebug } from './canvas-helper.js';

import { createWingedEdge } from './winged-edge.js';

import tinycolor from "https://esm.sh/tinycolor2";

//
// Draw the circumcircle of triangle ABC
function drawCircle(ctx, circumcenterX, circumcenterY, radius, color="lightblue") {
	ctx.beginPath();
	ctx.setLineDash([5, 5]);
	ctx.arc(circumcenterX, circumcenterY, radius, 0, 2 * Math.PI);
	ctx.strokeStyle = color;
	ctx.lineWidth = 2;
	ctx.stroke();
	ctx.closePath();
	ctx.setLineDash([]);
}

// distance between 2 points
const dist = (pt1, pt2) => Math.sqrt((pt1[0] - pt2[0]) ** 2 + (pt1[1] - pt2[1]) ** 2)


function findRadius(A, B, C) {

	const A_ = B[0] - A[0];
	const B_ = B[1] - A[1];
	const C_ = C[0] - A[0];
	const D_ = C[1] - A[1];

	const E = A_ * (A[0] + B[0]) + B_ * (A[1] + B[1]);
	const F = C_ * (A[0] + C[0]) + D_ * (A[1] + C[1]);

	const G = 2 * (A_ * (C[1] - B[1]) - B_ * (C[0] - B[0]));

	// Calculate the circumcenter (center) and circumradius (radius)
	const circumcenterX = (D_ * E - B_ * F) / G;
	const circumcenterY = (A_ * F - C_ * E) / G;

	const radius = Math.sqrt((circumcenterX - A[0]) ** 2 + (circumcenterY - A[1]) ** 2);

	return [radius, circumcenterX, circumcenterY];
}




let RETRY = 0,
		UNTIL = Math.inf, 			// points
		points = {},		// { 'A' : [x, y], ... }
		triangles = []; // 'ABC', ...

const START_NB_POINTS = 13;

const drawTriangleByName = (ctx, name, color="#FF0000") => {
	drawTriangle(
		ctx,
		points[name[0]][0], points[name[0]][1],
		points[name[1]][0], points[name[1]][1],
		points[name[2]][0], points[name[2]][1],
		color
	);
}

const getNLetters = (value) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.substring(0, value).split('')

let letters = getNLetters(START_NB_POINTS);
const pointColors = ['purple', 'orange', 'green', 'blue', 'teal', 'darkorange', 'silver', 'black', 'grey', 'blueviolet', 'lime'];

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const PTS_RADIUS = 10;
const TRIANGLE_WEIGHT = 3;
const MAX_POINT_WEIGHT = 15;

let movingPoint;

function onSegment(p, q, r) {
    return (
        (q[0] <= Math.max(p[0], r[0]) && q[0] >= Math.min(p[0], r[0])) &&
        (q[1] <= Math.max(p[1], r[1]) && q[1] >= Math.min(p[1], r[1]))
    );
}

function orientation(p, q, r) {
    const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
    if (val === 0) return 0;
    return val > 0 ? 1 : 2;
}

function areEndpointsEqual(p1, q1, p2, q2) {
    return (
        (p1[0] === p2[0] && p1[1] === p2[1]) ||
        (p1[0] === q2[0] && p1[1] === q2[1]) ||
        (q1[0] === p2[0] && q1[1] === p2[1]) ||
        (q1[0] === q2[0] && q1[1] === q2[1])
    );
}

function doSegmentsIntersect(p1, q1, p2, q2) {
		/*
		p1 = Math.floor(p1);
		q1 = Math.floor(q1);
		p2 = Math.floor(p2);
		q2 = Math.floor(q2);
		*/
		if (areEndpointsEqual(p1, q1, p2, q2)) {
        return false; // Endpoints are the same; not an intersection.
    }
    const o1 = orientation(p1, q1, p2);
    const o2 = orientation(p1, q1, q2);
    const o3 = orientation(p2, q2, p1);
    const o4 = orientation(p2, q2, q1);

    if (o1 !== o2 && o3 !== o4) {
        return true;
    }

    return false;
}



function mouseDown(canvas, ctx, evt) {
	// Get the mouse coordinates relative to the canvas
	const rect = canvas.getBoundingClientRect(); // Get the canvas's position on the page
	const x = Math.round(event.clientX - rect.left); // Subtract canvas's left offset
	const y = Math.round(event.clientY - rect.top); // Subtract canvas's top offset

	// Now, 'x' and 'y' hold the canvas coordinates where the mouse click occurred
	const point = Object.values(points).filter(p => p[0] <= x + PTS_RADIUS && p[0] >= x - PTS_RADIUS  && p[1] <= y + PTS_RADIUS && p[1] >= y - PTS_RADIUS);
	movingPoint = point.length ? point[0] : null;
}

function mouseMove(canvas, ctx, evt) {
	if(movingPoint) {
		// Get the mouse coordinates relative to the canvas
		const rect = canvas.getBoundingClientRect(); // Get the canvas's position on the page
		const x = Math.round(event.clientX - rect.left); // Subtract canvas's left offset
		const y = Math.round(event.clientY - rect.top); // Subtract canvas's top offset
	
		movingPoint[0] = x;
		movingPoint[1] = y;
		
		if(Math.random() < 0.9) {
			drawScene(canvas, ctx);
		}
	}
}

function mouseUp(canvas, ctx, evt) {
	if(movingPoint) {
		movingPoint = null;
		drawScene(canvas, ctx); // refresh on click release
	}
}

let showCircumcircles = false;
let showTriangleInfos = false;
let showDebug = false;

let currentEdgeName = '',
		wingedEdge;




//
// Do a step "building block" to Delaunay Triangulation (flip algorithm)
//
function main()
{

	// create canvas
	const [canvas, ctx] = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT)
	
	/**
	 * Setup UI event listeners
	 */
	canvas.addEventListener('mousedown', (evt) => mouseDown(canvas, ctx, evt));
	canvas.addEventListener('mousemove', (evt) => mouseMove(canvas, ctx, evt));
	canvas.addEventListener('mouseup', (evt) => mouseUp(canvas, ctx, evt));
	
	document.querySelector("#num_of_points").addEventListener('change', function(evt) {
		letters = getNLetters(evt.target.value ?? 3);
		redraw(canvas, ctx, true);
	});

	document.querySelector("#num_of_points").value = letters.length;

	document.querySelector("#restart").addEventListener('click', function(evt) {
		redraw(canvas, ctx);
	});

	document.querySelector('#edge').addEventListener('keyup', function(evt) {
		if (evt.keyCode == 13) {
			currentEdgeName = evt.target.value.toUpperCase();
			wingedEdge = createWingedEdge(points, triangles);
			const values = wingedEdge.findFaces(currentEdgeName);
			debug("faces : " + (values[0]?.name ?? '-') + ", " + (values[1]?.name ?? '-'));
			redraw(canvas, ctx, true);
			evt.target.value = ''; // reset entry !
		}
	});

	const circumcirclesCheckbox = document.querySelector("#circumcircles");
	const triangleCentersCheckbox = document.querySelector("#triangle_centers");
	const showDebugCheckbox = document.querySelector("#show_debug");
	const delaunayCheckbox = document.querySelector("#delaunay");
	const retryCheckbox = document.querySelector("#retry");
	const backwardButton = document.querySelector("#backward");
	const forwardButton = document.querySelector("#forward");
	const startButton = document.querySelector("#start");
	const saveButton = document.querySelector("#save");
	const restoreButton = document.querySelector("#restore");
	
	circumcirclesCheckbox.addEventListener('click', (evt) => {
		showCircumcircles = evt.target.checked;
		drawScene(canvas, ctx);
	});
	triangleCentersCheckbox.addEventListener('click', (evt) => {
		showTriangleInfos = evt.target.checked;
		drawScene(canvas, ctx);
	});
	showDebugCheckbox.addEventListener('click', (evt) => {
		showDebug = evt.target.checked;
		const debugDiv = document.querySelector("#debug");
		if(showDebug) {
			debugDiv.style.display = 'block';
		} else {
			debugDiv.style.display = 'none';
		}
	});
	delaunayCheckbox.addEventListener('click', (evt) => {
		drawScene(canvas, ctx);
	});
	retryCheckbox.addEventListener('change', (evt) => {
		RETRY = parseInt(evt.target.value);
		redraw(canvas, ctx, true)
	});
	backwardButton.addEventListener('click', (evt) => {
		if(UNTIL > 3) {
			UNTIL -= 1;
			forwardButton.disabled = false;
			redraw(canvas, ctx, true)
			if(UNTIL <= 3) {
				evt.target.disabled = true;
			}
		} else {
			evt.target.disabled = true;
		}
	});
	forwardButton.addEventListener('click', (evt) => {
		if(UNTIL < Object.values(points).length) {
			UNTIL += 1;
			backwardButton.disabled = false;
			triangles = [];
			//drawScene(canvas, ctx); // ??? freeze !!!
			redraw(canvas, ctx, true)
			if(UNTIL > Object.values(points).length - 1) {
				evt.target.disabled = true;
			}
		} else {
			evt.target.disabled = true;
		}
	});
	startButton.addEventListener('click', (evt) => {
		UNTIL = Object.values(points).length;
		triangles = [];
		redraw(canvas, ctx, true);
		forwardButton.disabled = true;
		backwardButton.disabled = false;
	});
	
	const KEY = "points";
	saveButton.addEventListener('click', (evt) => {
		restoreButton.disabled = false;
		console.log(points);
		localStorage.setItem(KEY, JSON.stringify(points));
	});
	restoreButton.addEventListener('click', (evt) => {
		points = JSON.parse(localStorage.getItem(KEY));
		console.log(points);
		redraw(canvas, ctx, true);
	});
	
	if(!localStorage.getItem(KEY)) { restoreButton.disabled = true; }
	
	if(showDebug === false && document.querySelector("#show_debug").checked) {
		document.querySelector("#show_debug").checked = false;
		document.querySelector("#debug").style.display = 'none';
	}

	
	
	redraw(canvas, ctx);
}



function redraw(canvas, ctx, keepPrevious=false) {

	const MARGIN = MAX_POINT_WEIGHT;
	
	if(!keepPrevious)
	{
		// add all named points
		for(let i = 0; i < letters.length; i++) {
			const x = Math.round(Math.random() * (CANVAS_WIDTH - 2*MARGIN) + MARGIN);
			const y = Math.round(Math.random() * (CANVAS_HEIGHT - 2*MARGIN) + MARGIN);
			const z = Math.round(Math.random() * 50);
			points[letters[i]] = [x, y, z, pointColors[i%pointColors.length]];
		}
	} else {
		if(Object.values(points).length < letters.length) {
			for(let i = Object.values(points).length; i < letters.length; i++) {
				const x = Math.round(Math.random() * (CANVAS_WIDTH - 2*MARGIN) + MARGIN);
				const y = Math.round(Math.random() * (CANVAS_HEIGHT - 2*MARGIN) + MARGIN);
				const z = Math.round(Math.random() * 50);
				points[letters[i]] = [x, y, z, pointColors[i%pointColors.length]];
			}
		} else {
			// remove from end
			while(Object.values(points).length > letters.length) {
				const letter = Object.keys(points)[Object.values(points).length - 1];
				delete points[letter];
			}
		}
	}
	
	drawScene(canvas, ctx);
}


function isPointInsideTriangle(px, py, ax, ay, bx, by, cx, cy) {
    function sign(x1, y1, x2, y2, x3, y3) {
        return (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
    }

    var d1 = sign(px, py, ax, ay, bx, by);
    var d2 = sign(px, py, bx, by, cx, cy);
    var d3 = sign(px, py, cx, cy, ax, ay);

    var hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    var hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);

    return !(hasNeg && hasPos);
}

// Function to check if one triangle is inside another
function isTriangleInside(otherTriangle, triangle) {
    // Check each vertex of the inner triangle
    for (var i = 0; i < 3; i++) {
        var vertex = otherTriangle[i];
        if (!isPointInsideTriangle(vertex[0], vertex[1], triangle[0][0], triangle[0][1], triangle[1][0], triangle[1][1], triangle[2][0], triangle[2][1])) {
            return false;
        }
    }
    return true;
}




/**
 * it starts with the 3 nearest points from starting "currentPoint"
 * 
 */
function doInitialTriangulation(orderedLetters) {
	
	debug("(doInitialTriangulation) UNTIL = " + UNTIL)
	
	const triangles = []; // resulting triangulation
	
	for(let i = 2; i < orderedLetters.length; i++) // for "each" points until the end (starting from the 3th vertex of 1st tri.)
	{
		//debug("i = "+i);
		for (let n = 0; n < 1 + RETRY; n++) // to redo triangulation on remaining available space ... (TODO)
		{
			//debug("n = "+n);
			const letter = orderedLetters[i]; // current letter
			let currentPoint = points[letter],
			    found = false,
					lastFound,
					withOtherVertex,
					nearestLetter,
					nearestLetter2,
					otherEdge = i-1; // ...
			
			debug('<b>-------------</b>');
			debug('<b>Point '+letter+'</b>');
			
			//for (let otherEdge = i-1; otherEdge > 0; otherEdge--)
			//{
			
				// find letters (1 for the edge for this new triangle) that do not intersect with others
			
				nearestLetter = orderedLetters[otherEdge-n];
				nearestLetter2 = orderedLetters[otherEdge-1-n];
				debug('(first) nearestLetter : ' + nearestLetter + ', nearestLetter2 : ' + nearestLetter2);

				if(i >= UNTIL || nearestLetter2 === undefined) break;

				for(let a = otherEdge; a > 0; a--) // second segment "starting point" is next after the currentPoint -> until 1
				{
					const l3 = orderedLetters[a],
								x3 = points[l3][0],
								y3 = points[l3][1];

					lastFound = null; // as we change the second segment ?
					withOtherVertex = null;

					for(let b = a-2; b >= 0; b--)
					{
						const l4 = orderedLetters[b], // second segment "ending point"
								  x4 = points[l4][0],
									y4 = points[l4][1];

						for(let j = otherEdge - 1; j >= 0; j--) // point connected to the "currentPoint" (should not cross other triangles' edges)
						{
								if(j < n) { // too much to the left...
									break;
								}
							
								const l2 = orderedLetters[j-n], // i - 2, i - 3, ...
											x1 = currentPoint[0], 		// first segment "starting point" (always the same current point)
											y1 = currentPoint[1],
											x2 = points[l2][0],				// first segment "ending point" (jump one point ... in reverse)
											y2 = points[l2][1];

								// BUG : si l3 = l2 -> on skip ?!!?
								//if(/*l3 === l2 ||*/ l3 === letter || (l2 === l4 && j > 0)) continue;

								debug("l3 = " + l3 + ", l4 = " + l4 + " // letter = " + letter + ", l2 = " + l2);

								const intersects = doSegmentsIntersect([x1, y1], [x2, y2], [x3, y3], [x4, y4]);
							
								// if intersect : try next (letter <-> l2)
								if(!intersects)
								{
									// tests with each 3 segments of existing triangles intersect with this new edge "letter<->l2"
									let intersectWithTriangles = triangles.some((triangle) => {
										const pt1 = points[triangle[0]],
													pt2 = points[triangle[1]],
													pt3 = points[triangle[2]];

										const isIntersecting = (
												// new line should not intersect with triangles
											   doSegmentsIntersect([x1, y1], [x2, y2], [pt1[0], pt1[1]], [pt2[0], pt2[1]])
											|| doSegmentsIntersect([x1, y1], [x2, y2], [pt2[0], pt2[1]], [pt3[0], pt3[1]])
											|| doSegmentsIntersect([x1, y1], [x2, y2], [pt3[0], pt3[1]], [pt1[0], pt1[1]])
												// ??
											|| doSegmentsIntersect([points[nearestLetter][0], points[nearestLetter][1]], [x2, y2], [pt1[0], pt1[1]], [pt2[0], pt2[1]])
											|| doSegmentsIntersect([points[nearestLetter][0], points[nearestLetter][1]], [x2, y2], [pt2[0], pt2[1]], [pt3[0], pt3[1]])
											|| doSegmentsIntersect([points[nearestLetter][0], points[nearestLetter][1]], [x2, y2], [pt3[0], pt3[1]], [pt1[0], pt1[1]])
												// ??
											///*
											|| doSegmentsIntersect([points[nearestLetter][0], points[nearestLetter][1]], [x1, y1], [pt1[0], pt1[1]], [pt2[0], pt2[1]])
											|| doSegmentsIntersect([points[nearestLetter][0], points[nearestLetter][1]], [x1, y1], [pt2[0], pt2[1]], [pt3[0], pt3[1]])
											|| doSegmentsIntersect([points[nearestLetter][0], points[nearestLetter][1]], [x1, y1], [pt3[0], pt3[1]], [pt1[0], pt1[1]])
											||
											//*/
											isTriangleInside(
												[[pt1[0], pt1[1]], [pt2[0], pt2[1]], [pt3[0], pt3[1]]],
												[[x1, y1], [points[nearestLetter][0], points[nearestLetter][1]], [x2, y2]]
											)
											/*
											||
											isTriangleInside(
												[[x1, y1], [points[nearestLetter][0], points[nearestLetter][1]], [x2, y2]],
												[[pt1[0], pt1[1]], [pt2[0], pt2[1]], [pt3[0], pt3[1]]]
											)
											*/
										);
										
										if(isIntersecting) {
											debug("<mark style='background-color: #ff000040'>they are intersecting with " + triangle + "</mark>");
										} else {
											debug("<mark style='background-color: #00ff0040'>they are not intersecting with " + triangle + "</mark>");
										}
										
										return isIntersecting;
									});
									
									if(!intersectWithTriangles) { // if ok
										if(lastFound == null) // something was found
										{
											nearestLetter2 = l2;
											lastFound = l2;
											withOtherVertex = l4; // not l4 ?
											debug(l2 + " found to be ok ?!");
										}
										found = true;
									} else {
										// ?
									}

								} else {
									// the 2 segments crosses
									debug("they crosses each other : " + letter + "-" + l2 + " and " + l3 + "-" + l4);
								}
							
								//debug("From vertex " + letter + ' : ' + letter + '<->' + l2 + " and " + l3 + '<->' + l4 + ' ' + (found ? "OK !!" : "intersects !!")+" lastFound:"+lastFound);

								//if(!found) nearestLetter2 = lastFound;
								// order from left to right -> so ?
								//if(lastFound) break; // BUG: should not stop ?
						}

						// all second ending point tested

						if(lastFound) {
							//debug("break l4");
							break; // NEXT l4 point... or STOP!
						} else {
							nearestLetter2 = null;
						}
					} // for l4

					// stop ?!
					if(lastFound) {
						//debug("break l3");
						break;
					}
				} // for l3

				//if(lastFound) {
					//debug("break l3");
					//break;
				//}
			//}

			if(nearestLetter2) {
				debug("<b>--> use line : " + letter + nearestLetter2 + ", and : " + letter + nearestLetter + "</b>");

				const currentTriangle = [letter, nearestLetter, nearestLetter2].sort().join('');
				const alreadyPresent = triangles.find(triangle => triangle === currentTriangle);
				if(!alreadyPresent) {
					triangles.push(currentTriangle); // new triangle !
					debug("ADDING <mark>" + currentTriangle + "</mark> - CURRENT NUMBER OF TRIANGLES : " + triangles.length);
				}
			}

		} // new triangle
		
		//if(triangles.length > 3) break; // DEBUG

	} // try to find other to complete the triangulation ...

	return triangles;
}


function showStuff(ctx, orderedLetters) {
	
	triangles.forEach(triangle => {
		
		const letter = triangle[0];
		const currentPoint = points[letter];
		const otherA = points[triangle[1]];
		const otherB = points[triangle[2]];
		
		drawLine(ctx, otherA[0], otherA[1], currentPoint[0], currentPoint[1], "black", TRIANGLE_WEIGHT);
		drawLine(ctx, currentPoint[0], currentPoint[1], otherB[0], otherB[1], "black", TRIANGLE_WEIGHT);
		drawLine(ctx, otherB[0], otherB[1], otherA[0], otherA[1], "black", TRIANGLE_WEIGHT);
		
		
		// find normal
		let vector_1 = [otherA[0] - currentPoint[0], otherA[1] - currentPoint[1], otherA[2] - currentPoint[2]];
		let vector_2 = [otherB[0] - currentPoint[0], otherB[1] - currentPoint[1], otherB[2] - currentPoint[2]];
		
		function cross_product(v1, v2) {
			return [
        v1[1] * v2[2] - v1[2] * v2[1],
        v1[2] * v2[0] - v1[0] * v2[2],
        v1[0] * v2[1] - v1[1] * v2[0]
    	];
		}
		
		const normalVector = cross_product(vector_1, vector_2);
		
		const magnitude = Math.sqrt(normalVector[0]**2 + normalVector[1]**2 + normalVector[2]**2);
		const vec = [
			normalVector[0] / magnitude,
			normalVector[1] / magnitude,
			normalVector[2] / magnitude
		]
		
		debug("("+vec.join(",") + ") normal vector");
		
		// light direction
		const light = [1, 1, 1];
		
		const colorIntensity = (vec[0] * light[0] + vec[1] * light[1] + vec[2] * light[2]) * 1;
		debug("intensity:" + colorIntensity);

		const color = tinycolor("#ADD8E6");
		if(colorIntensity > 0) {
			color.brighten(colorIntensity*10);
		} else {
			color.darken(colorIntensity*10);
		}
		
		drawTriangleByName(ctx, triangle, color.toString());
		
		if(showTriangleInfos) {
			//
			// Draw triangle centers...
			//
			createPoint(ctx, (otherA[0]+currentPoint[0]+otherB[0])/3, (otherA[1]+currentPoint[1]+otherB[1])/3, 2, 'red', '');
			//
			// draw 3 angles
			//
			drawAngle(ctx, otherA[0], otherA[1], otherB[0], otherB[1], currentPoint[0], currentPoint[1], "α", 16, "red");
			drawAngle(ctx, otherB[0], otherB[1], currentPoint[0], currentPoint[1], otherA[0], otherA[1], "β", 16, "orange");
			drawAngle(ctx, currentPoint[0], currentPoint[1], otherA[0], otherA[1], otherB[0], otherB[1], "γ", 16, "purple");
		}
		
		if(showCircumcircles || (movingPoint && movingPoint[0] === currentPoint[0] && movingPoint[1] === currentPoint[1])) {
			let [radius, circumcenterX, circumcenterY] = findRadius(points[letter], points[triangle[1]], points[triangle[2]]);
			
			createPoint(ctx, circumcenterX, circumcenterY, 2, 'lightblue', '');
			//
			// draw circumcircle on point selection
			//
			let color = movingPoint && movingPoint[0] === currentPoint[0] && movingPoint[1] === currentPoint[1] ? "blue" : "lightblue";
			drawCircle(ctx, circumcenterX, circumcenterY, radius, color);
		}
	});
	
	
	
	
	
	
	// should show highlighted faces
	if(currentEdgeName) {
		const values = wingedEdge.findFaces(currentEdgeName);
		const triangle1 = values[0]?.name,
					triangle2 = values[1]?.name;
		if(triangle1 && triangles.includes(triangle1)) {
			drawTriangleByName(ctx, triangle1, "#FF0000");
			debug("<mark style='background-color: #FF000040;'>highlighting triangle " + triangle1 + "</mark>");
		}
		if(triangle2 && triangles.includes(triangle2)) {
			drawTriangleByName(ctx, triangle2, "#FF0000");
			debug("<mark style='background-color: #FF000040;'>highlighting triangle " + triangle2 + "</mark>");
		}
	}


	// Last to bring points to front ...
	for(let i = 0; i < orderedLetters.length; i++)
	{
		const letter = orderedLetters[i];
		const pt = points[letter];
		const color = movingPoint && movingPoint[0] === pt[0] && movingPoint[1] === pt[1] ? 'red' : pt[3];
    createPoint(ctx, pt[0], pt[1], (MAX_POINT_WEIGHT - 10) * pt[2]/50 + 10, color, letter);
	}
	
	
}




function drawScene(canvas, ctx) {
	
	debug("(drawScene) UNTIL = " + UNTIL);
	
	// Clear the entire canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	// empty debug text
	clearDebug();
	
	// order by x-value (from left to right)
	let orderedLetters = Object.keys(points);
	orderedLetters.sort((a, b) => points[a][0] < points[b][0] ? -1 : 1);
	
	debug("orderedLetters:" + orderedLetters.join(', '));
	
	let previousTriangles = [...triangles];
	// Find an initial triangulation
	console.time("initial_triangulation");
	triangles = doInitialTriangulation(orderedLetters, 3);
	debug("<mark>" + triangles.length + " triangles</mark> : " + triangles.join(', '));
	console.timeEnd("initial_triangulation");
	
	
	console.time("delaunay...");
	let search = document.querySelector('#delaunay').checked,
			i = 1;
	while(search)
	{
		// recalculate data structure (only if any triangle changed)
		if(JSON.stringify(previousTriangles) !== JSON.stringify(triangles)) {
			wingedEdge = createWingedEdge(points, triangles);
		}
		
		previousTriangles = [...triangles];
		
		// if flip -> "every" stops and we recalculate winged edge data structure (above)
		search = !triangles.every(triangle => {

			const [letter1, letter2, letter3] = triangle;

			const hasNotFlipped = [letter1+letter2, letter2+letter3, letter3+letter1].every((edge) => {

				const values = wingedEdge.findFaces(edge),
							triangle1 = values[0]?.name,
							triangle2 = values[1]?.name,
							otherFace = triangle === triangle1 ? triangle2 : triangle1;
				
				// has an other face
				if(otherFace)
				{
					//debug(values[0]?.edge?.src?.letter + "-" + values[0]?.edge?.dest?.letter);
					//debug(values[1]?.edge?.src?.letter + "-" + values[1]?.edge?.dest?.letter);
					debug("Edge " + edge + " from " + triangle + " is also neighbor with " + otherFace);

					const otherLetter = otherFace.split('').filter(letter => !triangle.includes(letter)).join('');
					const letterToCheck = triangle.split('').filter(letter => !edge.includes(letter)).join('');

					if(!otherLetter.length) { // why ?
						return true;
					}
					debug("letterToCheck = " + letterToCheck + ", otherLetter = " + otherLetter);
					
					
					let [radius, circumcenterX, circumcenterY] = findRadius(points[letter1], points[letter2], points[letter3]);

					//
					// check if the otherFace point is outside it or not
					//
					//console.log(otherLetter);
					const distanceToCircumcenter = Math.sqrt((circumcenterX - points[otherLetter][0]) ** 2 + (circumcenterY - points[otherLetter][1]) ** 2);

					const shouldFlipSide = distanceToCircumcenter <= radius;

					if (shouldFlipSide) {
						debug("<mark>should flip " + edge + " to " + letterToCheck+otherLetter + "</mark>");


						// remove "triangle" from triangles
						// add the 2 new ones
						// and reapply winged-edge
						const idx = triangles.indexOf(triangle);
						triangles.splice(idx, 1);
						const idx2 = triangles.indexOf(otherFace);
						triangles.splice(idx2, 1);
						
						const newTriangle1 = [letterToCheck, otherLetter, edge[0]].sort().join(''),
									newTriangle2 = [letterToCheck, otherLetter, edge[1]].sort().join('');
						triangles.push(newTriangle1);
						triangles.push(newTriangle2);
						
						debug('<b>removing</b> ' + triangle + ' & ' + otherFace + ', <b>adding</b> ' + newTriangle1 + ' & ' + newTriangle2);
						
						return false; // it restarts this procedure
					}
					
				} // otherFace
				
				// pass 3 edges of triangle without flip
				return true;
			});
			
			
			
			// if a flip has been done (false) -> stop !
			return hasNotFlipped;
		})
		
		debug('<mark style="background-color: #00FF0040">End of pass #' + i + '</mark>');

		i++;
	}
	console.timeEnd("delaunay...");
	
	console.time("showStuff");
	showStuff(ctx, orderedLetters);
	console.timeEnd("showStuff");
}



main();
