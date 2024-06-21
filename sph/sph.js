/**
 * based on https://www.youtube.com/watch?v=rSKMYc1CQHE
 
 See also
 - https://sph-tutorial.physics-simulation.org/pdf/SPH_Tutorial.pdf



TODO:
 - (15m) add a button to reload X points

 - (10m) choice of the resolution of the gradient colors (to improve speed when debugging)

 - (10m) show the number of "neighbors" of a cell (on hover)
 - (30m) add gradient = direction per particle (not only on a grid)
	- (15m) use a checkbox to decide to show it (+localstorage)

 - if I click on a particle -> show its informations (gradient, trajectory ???, id, ...)

 - on hover, change 9x9 grid to an other color
	- same with the matching points -> + their gradient ...







 */

import { addCanvas, drawPointAt, draw_arrow, draw_arrow_2, drawRectangle } from '../common/canvas.helper.js';
import { Particle } from './particle.js';
import { colorGradient } from './color.js';

// Canvas
const WIDTH = 400;
const HEIGHT = 400;

// Particles
const NB_PARTICLES = 80;
const PARTICLE_SIZE = 6; // diameter in pixel
const SMOOTHING_RADIUS = 40; // 3 x 3 grid around the particles
const MASS = 1_000; // if less it is less stable ?
const factor = 1; // why negative attracts ?!
const accumulate_speed = false; // false = update speed, no memory of the previous ones..

// square-grid size should be a multiple of the canvas size !
console.assert(WIDTH % SMOOTHING_RADIUS === 0, "smoothing radius should be a multiple of the canvas' width");
console.assert(HEIGHT % SMOOTHING_RADIUS === 0, "smoothing radius should be a multiple of the canvas' height");

// Env.
let DELTA_TIME = 0.1;
let GRAVITY = 0; // 1 = fall down ?
const COLLISION_DAMPING = 0.3; // to lose momentum on wall collisions

// DEBUG ...
const MIN_DENSITY = 1; // used if density is 0 ? when particle isolating or regrouping!?
const MIN_DIST = PARTICLE_SIZE; // if dist = 0, when ? low value = high

// Pressure (to spread the particles evenly ~= incompressible flow)
const TARGET_DENSITY = 0.01; // wanted density (depends on MASS, ...)
let PRESSURE_MULTIPLIER = 75; // how much to force particle to repulse if too near

const ARROW_COLOR = "black";
const MAGNIFY = 0.5; // to change the length of arrows (for visibility / debugging)

let isPaused = false;

const animationMode = 'animation_frame' // or anything else => setTimeout 







//
// UI
//
const meanEl = document.querySelector("#mean_density");
const maxEl = document.querySelector("#max_density");
const targetEl = document.querySelector("#target_density");
const nbCollisionsEl = document.querySelector("#nb_collisions");
	// Pressure
const pressureSliderEl = document.querySelector("#pressure_slider");
const pressureValueEl = document.querySelector("#pressure_value");
	// Gravity
const gravitySliderEl = document.querySelector("#gravity_slider");
const gravityValueEl = document.querySelector("#gravity_value");

const meanUsedParticlesEl = document.querySelector("#mean_used_particles");
const numberOfParticlesEl = document.querySelector("#number_of_particles");
numberOfParticlesEl.innerText = NB_PARTICLES;

const showArrowsCheckboxEl = document.querySelector("#show_arrows");
const value = JSON.parse(localStorage.getItem("show_arrows"));
showArrowsCheckboxEl.checked = value; // init value

showArrowsCheckboxEl.addEventListener('change', (e) => { // on change
	localStorage.setItem("show_arrows", e.target.checked);
})

const showColorGradientEl = document.querySelector("#show_color_gradient");

const pauseButtonEl = document.querySelector("#pause_button");

const debugEl = document.querySelector("#debug");

targetEl.innerHTML = TARGET_DENSITY;

pressureSliderEl.value = PRESSURE_MULTIPLIER;
pressureValueEl.innerText = PRESSURE_MULTIPLIER;

gravitySliderEl.value = GRAVITY;
gravityValueEl.innerText = GRAVITY;

pressureSliderEl.addEventListener('change', function(event) {
	PRESSURE_MULTIPLIER = event.target.value;
	pressureValueEl.innerText = event.target.value;
});

gravitySliderEl.addEventListener('change', function(event) {
	GRAVITY = event.target.value;
	gravityValueEl.innerText = event.target.value;
});

pauseButtonEl.addEventListener('click', function(event) {
	const isPaused_ = event.target.style.borderStyle === 'inset';
	isPaused = !isPaused_;
	event.target.style.borderStyle = isPaused ? 'inset' : '';
	event.target.innerText = isPaused ? 'paused' : 'pause';
	if(!isPaused) {
		// restart
		runMainLoop();
	} else {
		const prev_delta_time = DELTA_TIME;
		DELTA_TIME = 0
		loop(); // to refresh without further progression
		//drawDetails(mouseOverCoords[0], mouseOverCoords[1]); // if necessary
		DELTA_TIME = prev_delta_time;
	}
});

/*
OLDER FIX:
- big arrows when a particle is isolating or regrouping ???? => OK influence was 0 -> use 0.000001 so any p.density is not 0 ...
- missing arrow when isolated, why ?! => OK ...



BUGFIX:
=======
- fix mouse hover when paused ... (too inefficient/slow?)
- should be quicker to repulse blob of particles ....!!! -> simply tweak values ?!...


FEAT:
=====
- ?



*/







function convertDensityToPressure(density) {
	console.assert(density >= 0, "(convertDensityToPressure) a density can't be negative ! value = ", JSON.stringify(density)); // a density can't be negative !
	const densityError = density - TARGET_DENSITY;
	const pressure = densityError * PRESSURE_MULTIPLIER;
	return pressure;
}

/*
// simple kernel ...
function smoothingKernel(radius, dist) {
	const value = Math.max(0, radius - dist);
	return value * value * value;
}
*/

/*
// smooth at the top (but to slow to separate particles ?)
function smoothingKernel(radius, dist) {
	const volume = Math.PI * Math.pow(radius, 8) / 4;
	const value = Math.max(0, radius*radius - dist*dist);
	return value * value * value / volume;
}

// using wolfram alpha ?
function smoothingKernelDerivative(radius, dist) {
	if (dist >= radius) return 0;
	const f = radius * radius - dist * dist;
	const scale = -24 / (Math.PI * Math.pow(radius, 8));
	return scale * dist * f * f;
}
*/






//
// spiky function ! so when 2 particle are closer together they "repulse" more quickly than the function above
//
function smoothingKernel(radius, dist) {
	if(dist >= radius) return 0; // outside of influence zone
	
	const volume = Math.PI * Math.pow(radius, 4) / 6;
	return (dist - radius) * (dist - radius) / volume;
}
///*
// Not the same derivative as here ?!
//  --->  https://www.wolframalpha.com/input?i=the+derivative+of+%28r-d%29%5E2%2F%28pi+*+r%5E4+%2F+6%29
function smoothingKernelDerivative(radius, dist) {
	if (dist >= radius) return 0;
	
	const scale = 12 / (Math.PI * Math.pow(radius, 4));
	return (dist - radius) * scale;
}
//*/

/*
function smoothingKernelDerivative(radius, dist) {
	if (dist >= radius) return 0;
	
	const scale = 12 / (Math.PI * Math.pow(radius, 5));
	return (dist - 2 * radius) * (dist - radius) * scale;
}
*/









//
// density value at sampled particle (ex: on a grid, or by other particles)
//
function calculateDensity(particles, sampleParticle) {
	let density = 0;
	
	// "particles" is optimized to use only the closest neighbours
	particles.forEach(p => {
		if(p === undefined) return; // TODO: why ??
		
		if(p.x !== sampleParticle.x || p.y !== sampleParticle.y) { // exact same position ?! (= same particle ?)
			//
			// Euclidean distance between 2 particles' center
			//
			let dist = Math.sqrt((p.x - sampleParticle.x)**2 + (p.y - sampleParticle.y)**2);
			
			const influence = smoothingKernel(SMOOTHING_RADIUS, dist);
			//if(!influence) { // if too far
			//	debugger;
			//}
			density += MASS * influence;
		}
	});
	return density;
}

function calculateSharedPressure(p1, p2) {
	const pressureA = convertDensityToPressure(p1.density);
	const pressureB = convertDensityToPressure(p2.density);
	return (pressureA + pressureB) / 2;
}



/**
 * density at particle is precalculated in a previous step in "loop" function
 */
function calculatePressureForceGradient(particles, samplePoint, collisions = true) {

	// 2d vector (x, y)
	const grad = [0, 0];
	
	particles.forEach((p) => {
		if(p === undefined) return; // TODO: why a particle can be "null" ???
		
		if(p.x !== samplePoint.x && p.y !== samplePoint.y) { // so that dist != 0 ?...
			// distance between points
			const diffX = p.x - samplePoint.x;
			const diffY = p.y - samplePoint.y;
			let dist = Math.sqrt(diffX**2 + diffY**2);
			
			let dir; // 
			if(dist < MIN_DIST) { // Two particle at the same position (collision)
				dist = MIN_DIST; // set to minimum.
				//console.log("calculatePressureForceGradient : dist = 0 -> use dist =", dist, "and a random direction");

				dir = [(Math.random()-0.5)*0.1, (Math.random()-0.5)*0.1]; // small random direction
				nb_collisions++; // INFO: it is counted twice
				if(collisions) {
					p.collided = 1;
				}
			} else {
				p.collided = 0;
				dir = [diffX / dist, diffY / dist]; // normalized vector ?
			}
			
			// very small ?
			const slope = smoothingKernelDerivative(SMOOTHING_RADIUS, dist);
			
			if(!p.density) { // should not be zero ? nor "undefined" ..
				//console.warn("point(", p.x, ",", p.y, ") not taken in account in gradient as dist = ", dist, "p=", p); // TOO DISTANT ?
				debugger;
			} else {
				// the sign inverse the direction of arrows
					// if + -> the points regroups themselves ?
				
				//console.log("this density:", samplePoint.density, "other part. density:", density);
				const sharedPressure = calculateSharedPressure(p, samplePoint);

				// accumulate effect of each particles' densities
				//console.log("sharedPressure:", sharedPressure, "slope:", slope);
				grad[0] += sharedPressure * dir[0] * slope * MASS / p.density;
				grad[1] += sharedPressure * dir[1] * slope * MASS / p.density;
			}
		}
	});
	
	return grad;
}










//
// spatial index to improve speed
//
const prime_1 = 3253,
	prime_2 = 3137,
	numberOfCells = 128,
	hashCellCoords = (coordX, coordY) => prime_1 * coordX + prime_2 * coordY;

let cellKeys = [],
	indexes = [], // spatial index ?
	startIndexes;

function indexParticles(particles) {
	
	const idxs = new Array(numberOfCells), cellKeys_ = [];
	
	particles.forEach((p, index) => {
		const coordX = Math.floor(p.x / SMOOTHING_RADIUS); // x cell pos
		const coordY = Math.floor(p.y / SMOOTHING_RADIUS); // y cell pos
		
		const cellHash = hashCellCoords(coordX, coordY);
		const cellKey = cellHash % numberOfCells;
		
		idxs.push(index);
		cellKeys_.push(cellKey);
	});
	
	//console.log("indexes:", indexes);
	//console.log("cellKeys:", cellKeys);
	
	indexes = new Int8Array(idxs)
	cellKeys = new Int8Array(cellKeys_)
	
	// sort by cellKeys (keep track of indexes, with same ordering)
	indexes.sort((a, b) => cellKeys[a] > cellKeys[b] ? 1 : -1);
	cellKeys.sort();
	
	//console.log("indexes:", indexes)
	//console.log("cellKeys:", cellKeys);
	
	// fill an array with "start indexes"
	startIndexes = [];
	
	let firstIndex = 0;
	cellKeys.forEach((key, index) => {
		if(key != cellKeys[index+1]) {
			startIndexes.push(firstIndex);
			firstIndex = index + 1;
		} else {
			startIndexes.push(Infinity);
		}
	});
	
	//console.log("startIndexes:", startIndexes);
	//console.log("indexes:", indexes);
	//console.log("cellKeys:", cellKeys); // in which cell index are each particle (ordered by ?)
}













let nb_collisions = 0;


//
// "heavy" computing loop...
//
function loop() {

	//console.time('re-index particles');
	indexParticles(particles); // to be able to locate nearest particles to a point (= another particle's center or any pixel position)
	//console.timeEnd('re-index particles');	// ~ 0.35 ms ?
	
	// clear everything for next frame
	context.clearRect(0, 0, canvas.width, canvas.height);

	let totalUsedParticles = 0; // in the density computation

	// for each particles -> we will compute force/displacement due to closest neighbours only !
	particles.forEach((p) => {
		
		const usedParticles = onlyNearest(particles, p); // particles
		//console.log("used particles:", usedParticles.length - 1)
		totalUsedParticles += (usedParticles.length ? usedParticles.length - 1 : 0); // except 1 ...
		
		const density = calculateDensity(usedParticles, p);
		//if(!density) {
		//	debugger;
		//}
		p.density = density || TARGET_DENSITY; // "cache" current density at particle position in Particle object
	})


	// Calculate debugging informations
	meanUsedParticlesEl.innerHTML = Math.round(totalUsedParticles / particles.length * 100) / 100; // rounded at 2 decimals

	// sized array (1 density per pixel)
	const densities = Array.from({ length: canvas.width * canvas.height });
	const data = new Uint8ClampedArray(canvas.width * canvas.height * 4);

	// gradient colors
	if(showColorGradientEl.checked) {

		let maxDensity = 0; // re-init current maximum density
		for(let h = 0; h < canvas.height; h++)
		{
			for(let w = 0; w < canvas.width; w++)
			{
				const idx = h * canvas.width + w;

				const p = new Particle(w, h); // fake "particle" at given pixel (to compute density only using neighboors ?!)

				// why if "onlyNearest" -> bug ?! if not particles ?
				//const particles_ = onlyNearest(particles, p); // so it's less particles than the whole particles...
				// BUG: never any particles ?!
				const particles_ = particles;

				if(particles_.length) {
					const density = calculateDensity(particles_, p);
					densities[idx] = density; // pixel map of the densities at each pixel
					if(density > maxDensity) {
						maxDensity = density; // to know what is the max density !
					}
				} else {
					densities[idx] = 0; // nothing ?
				}
			}
		}

		maxEl.innerHTML = maxDensity;

		const red = { red: 154, green: 0, blue: 3 };
		const white = { red: 255, green: 255, blue: 255 }; // middle color : 50% ...
		const blue = { red: 9, green: 63, blue: 120 };

		// show field: for each pixel -> show a color based on density
		for(let w = 0; w < canvas.width; w++) {
			for(let h = 0; h < canvas.height; h++) {
				const idx = h * canvas.width + w;
				const value = Math.round(densities[idx] / maxDensity * 255);

				const bgColor = colorGradient(value / 255, blue, white, red);
				const offset = idx * 4;
				// RGBA (ffffff.. is white)
				data[offset] = bgColor[0];
				data[offset + 1] = bgColor[1];
				data[offset + 2] = bgColor[2];
				data[offset + 3] = 255; // alpha/opacity
			}
		}

		// DEBUG :
		const mean = densities.reduce((accumulator, currentValue) => {
			return accumulator + currentValue
		},0) / densities.length;
		meanEl.innerHTML = mean;


		//const startTime = performance.now();
		const imageData = new ImageData(data, canvas.width, canvas.height);
		if(true) {
			context.putImageData(imageData, 0, 0);
		} else {
			const tempCanvas = document.createElement('canvas');
			const tempContext = tempCanvas.getContext('2d');
			tempContext.putImageData(imageData, 0, 0);
			context.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height); // apply bg color ...
		}
		//console.log(`${performance.now() - startTime} ms`);  // 0.2 or 0.1 ms ...
	}



	
	//
	// Draw all of the (black) particles (over everything else) at current position
	//
	particles.forEach((p) => {
		const color = p.collided ? "red" : "black";
		const size = p.collided ? PARTICLE_SIZE / 2 : PARTICLE_SIZE / 2;
		drawPointAt(context, p.x, p.y, size, color);
	});




	// reinitializations
	nb_collisions = 0; // counted in `calculatePressureForceGradient` function

	//
	// Apply pressure force for each particles
	//
	particles.forEach((p) => {
		const nearestParticles = onlyNearest(particles, p);
		const pressureForce = calculatePressureForceGradient(nearestParticles, p);
		//
		// F=m*a => a=F/m (but density = m / volume -> m = densite * vol) so F/(densite * mass??) (@TODO !)
		//
		const pressureAcceleration = [ // if no density (when???) -> no additional displacement ? due to pressure (gradient)
			p.density ? (pressureForce[0] / p.density) : 0,
			p.density ? (pressureForce[1] / p.density) : 0
		];
		// so if low density the acceleration is big ???!!!

		//console.log(">", pressureAcceleration);
		
		// += to accumulate all the pressure forces ? -> no ?!
		if(accumulate_speed) {
			p.vx += factor * pressureAcceleration[0] * DELTA_TIME;
			p.vy += factor * pressureAcceleration[1] * DELTA_TIME;
		} else {

			p.vx = factor * pressureAcceleration[0] * DELTA_TIME;
			p.vy = factor * pressureAcceleration[1] * DELTA_TIME;
		}
	});
	
	// collisions
	nbCollisionsEl.innerHTML = nb_collisions / 2; // because it's counted twice


	//
	// calculate displacement used to update positions (x, y)
	//
	particles.forEach((p) => {
		// DEBUG
		console.assert(!isNaN(p.vx + GRAVITY * DELTA_TIME), "gravity gives a NaN !?");

		//
		// Add gravity influence
		//
		p.vy += GRAVITY * DELTA_TIME; // to the down direction (y)
		
		// not just integers, but float ...
		p.x += p.vx * DELTA_TIME;
		p.y += p.vy * DELTA_TIME;
	});


	
	//
	// Show gradient field (arrows) over a regular grid ... (to DEBUG)
	//
	if(showArrowsCheckboxEl.checked)
	{
		const STEP = 10; // grid on which the arrow points from
		let countBigArrows = 0, color; // reinit. (for debugging)
		for(let h = 0; h < canvas.height; h = h + STEP)
		{
			for(let w = 0; w < canvas.width; w = w + STEP)
			{
				const p = new Particle(w, h); // at each pixel position
				p.density = densities[h * canvas.width + w]; // use the pre-computed density at this pixel

				const nearestParticles = onlyNearest(particles, p); // use only the nearest particles to this pixel

				if(!nearestParticles.length) {
					//console.log("no particles near this grid point:", w, h)
					continue; // no arrow here ?
				}

				// it uses cached particles density ?
				const grad = calculatePressureForceGradient(nearestParticles, p, false /* set no collision, as grid pixels do not interact.. */);
				
				// if no change in density around : draw no arrow ! as there is no move
				if(grad[0] == 0 && grad[1] == 0) {
					//context.fillStyle = "black";
					//context.fillRect(w, h, 1, 1); // 1 pixel
				} else {
					const tooMuchRepulsion = Math.abs(grad[0]) > 0.1 || Math.abs(grad[1]) > 0.1;

					// DEBUG : when a particle is on this STEP x STEP grid ?
					if(tooMuchRepulsion) {
						countBigArrows++;
						color = "red";
						// do not show them
					} else {
						color = ARROW_COLOR;
					}
					draw_arrow(context, w, h, w + grad[0] * MAGNIFY / 2, h + grad[1] * MAGNIFY / 2, ARROW_COLOR); // magnify arrows ...
					
				}
			}
		}
		//console.log("(show gradient arrows) big arrows count =", countBigArrows);
	}





	//
	// calculate bounding box to resolve collision (4-walls bounce)
	//
	particles.forEach((p) => {

		// x-axis
			// up
		if (p.x <= PARTICLE_SIZE / 2) {
			p.x = PARTICLE_SIZE / 2;
			p.vx = -p.vx * (GRAVITY ? 1 : COLLISION_DAMPING);
		}
			// down
		if(p.x >= canvas.width - PARTICLE_SIZE / 2) {
			p.x = canvas.width - PARTICLE_SIZE / 2;
			p.vx = -p.vx * COLLISION_DAMPING;
		}
		// y-axis
		if (p.y <= PARTICLE_SIZE / 2) {
			p.y = PARTICLE_SIZE / 2;
			p.vy = -p.vy * COLLISION_DAMPING;
		}
		if(p.y >= canvas.height - PARTICLE_SIZE / 2) {
			p.y = canvas.height - PARTICLE_SIZE / 2;
			p.vy = -p.vy * COLLISION_DAMPING;
		}
	})



	// call this to keep it displayed at each loop...
	drawDetails(mouseOverCoords[0], mouseOverCoords[1]);

	// pause/stop loop
	if(isPaused) {
		clearInterval(intervalId);
	}
	
	if(animationMode == 'animation_frame') {
		requestAnimationFrame(loop); // continue animation
	} // else it use the 'setTimeout'
};





let canvas, context, particles = [];
let mouseOverCoords = [];

function showCoordsDebug(coordX, coordY) {
		const cellHash = hashCellCoords(coordX, coordY);
		const cellKey = cellHash % numberOfCells; // particles.length
		
		// find indexes of particles corresponding to this hash
		debugEl.innerHTML = "Coord(" + coordX + "," + coordY + ")<br/>";
		debugEl.innerHTML += "cellHash = " + cellHash + "<br/>";
		debugEl.innerHTML += "cellKey = " + cellKey + "<br/>";
		
		const firstIndex = cellKeys.indexOf(cellKey);
		let lastIndex = firstIndex
		while(startIndexes[lastIndex] === Infinity) { lastIndex++; }
		
		let value = "index: " + firstIndex + " to " + lastIndex + " → number of particles = " + (firstIndex != -1 ? (lastIndex - firstIndex + 1) : '-') + "<br/>";
		
		debugEl.innerHTML += value;
}

function drawDetails(coordX, coordY) {
	//console.log("drawDetails:", coordX, coordY);
	if (coordX !== undefined && coordY !== undefined) {
		// text debug content
		showCoordsDebug(coordX, coordY);
		
		// draw the 8+1 squares
		let countCells = 0;
		for(let i = coordX - 1; i <= coordX + 1; i++) {
			for(let j = coordY - 1; j <= coordY + 1; j++) {
				const overMiddle = i == coordX && j == coordY;
				countCells++;
				drawRectangle(
					context,
					i * SMOOTHING_RADIUS,
					j * SMOOTHING_RADIUS,
					(i + 1) * SMOOTHING_RADIUS,
					(j + 1) * SMOOTHING_RADIUS,
					overMiddle ? 5 : 2 // width
				)
			}
		}
		//console.log("countCells:", countCells);
	}
}



let intervalId;

function main() {
	
	[canvas, context] = addCanvas(WIDTH, HEIGHT);
	const canvasWidth = canvas.width;
	const canvasHeight = canvas.height;
	
	canvas.addEventListener('mousemove', function(evt) {
		const rect = canvas.getBoundingClientRect();
		const x = evt.clientX - rect.left;
		const y = evt.clientY - rect.top;
		
		const coordX = Math.floor(x / SMOOTHING_RADIUS);
		const coordY = Math.floor(y / SMOOTHING_RADIUS);
		
		if(isPaused) {
			console.log("isPaused:", mouseOverCoords);
			if(
				// TODO : if we hover over the same "square" -> do nothing ??? or else it's slow ?
				//(mouseOverCoords.length > 0 && mouseOverCoords[0] !== coordX && mouseOverCoords[1] !== coordY)
				//||
				//mouseOverCoords.length === 0
				true
			) {
				console.log("refresh at :", coordX, coordY);
				mouseOverCoords = [coordX, coordY]; // update hovered coordinates
				
				const prev_delta_time = DELTA_TIME;
				DELTA_TIME = 0
				loop(); // to refresh without further progression (ΔT=0)
				DELTA_TIME = prev_delta_time;
				
			} else {
				// 
				//mouseOverCoords = [coordX, coordY];
			}
		} else {
			drawDetails(coordX, coordY);
			mouseOverCoords = [coordX, coordY];
		}	
	});
	
	canvas.addEventListener('mouseout', function() {
		mouseOverCoords = [];
		debugEl.innerHTML = '';
	});
	
	// create X particles
	for(let i = 0; i < NB_PARTICLES; i++) {
		// choose a random position
		const randomX = Math.random() * canvasWidth;
		const randomY = Math.random() * canvasHeight;
		particles.push(new Particle(randomX, randomY));
	}
	
	//let i = 0;
	
	runMainLoop();
}

function runMainLoop() {
	console.warn("runMainLoop");
	if(animationMode == 'animation_frame') {
		requestAnimationFrame(loop)
	} else {
		intervalId = setInterval(loop, 1000 / 25);
	}
}

function onlyNearest(particles, p) {
	
	const coordX = Math.floor(p.x / SMOOTHING_RADIUS);
	const coordY = Math.floor(p.y / SMOOTHING_RADIUS);

	const filteredParticles = [];
	
	for(let i = coordX - 1; i <= coordX + 1; i++) { // surrounding coords (max. 3x3 = 9 cells only)
		for(let j = coordY - 1; j <= coordY + 1; j++) {
			
			if(j < 0 || i < 0) continue;

			let cellHash = hashCellCoords(i, j);
			let cellKey = cellHash % numberOfCells; // particles.length
			let firstIndex = cellKeys.indexOf(cellKey);

			if(firstIndex != -1) {
				let lastIndex = firstIndex;
				while(startIndexes[lastIndex] === Infinity) {
					lastIndex++;
				}

				for(let a = firstIndex; a <= lastIndex; a++) {
					//console.log(i, indexes[i]);
					filteredParticles.push(
						...particles.slice(indexes[a], indexes[a] + 1)
					); // shallow copy ?
				}
			} else {
				// nothing in this cell
			}
		}
	}
	return filteredParticles;
}

main();
