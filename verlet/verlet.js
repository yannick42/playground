// TODO: use common helper functions !!
//import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../_common/canvas.helper.js';
//import { randInt } from '../_common/common.helper.js';

/**
TODO:
- add a configurable small text in the point (eg. "A" or "1", ...), if radius is big enough

*/

import { round } from '../_common/math.helper.js';
import { Vec2, Quadtree } from '../_common/quadtree.js';
import { AABB } from '../_common/aabb.js';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

function randomInt(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min);
}
const distance = (pt1, pt2) => Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2))

const NB_POINTS = 250,
      MIN_SIZE = 3,
      MAX_SIZE = 10,
      GRAVITY_X = 0,
      GRAVITY_Y = 300,
      RATIO_MASS_OVER_RADIUS = 1,
      SKIP_N_STEPS = 1, // to slow down speed by skipping frames (min=1)
      SUB_STEPS = 3,
      WALL_DAMPING = 0.1,
      COLLISION_DAMPING = 0.01, // slowed collisions & less weird movement at the bottom, but less bouncing
      PINNED_COLOR = 'red',
      STICK_WIDTH = 3,
      OUTLINE_WIDTH = 0.5;

let frameReqId;

const colors = ['darkblue', 'blue', 'mediumblue', 'navy', 'dodgerblue', 'cornflowerblue', 'deepskyblue'];
const greenColors = ['green', 'darkseagreen', 'lime', 'olivegrab', 'palegreen', 'lawngreen', 'lightgreen'];

let useQuadtree = true;

const resetButton = document.querySelector('button');
resetButton.addEventListener('click', (e) => main()); // restart process
const quadtreeCheckbox = document.querySelector('#use_quadtree');
quadtreeCheckbox.addEventListener('change', (e) => useQuadtree = e.target.checked); // restart process


// Fisher-Yates algo.
function permutation(n) {
  let permutation = Array
    .from({ length: n }, (_, i) => i);

  for (let i = n - 1; i > 0; i--) {
    const j = Math
      .floor(Math.random() * (i + 1));
    [permutation[i], permutation[j]]
      =
      [permutation[j], permutation[i]];
  }
  return permutation;
}




class Point {
  
  constructor(x, y, options={}) {
    this.radius = options.radius ?? randomInt(MIN_SIZE, MAX_SIZE);
    this.mass = this.radius * RATIO_MASS_OVER_RADIUS;
    this.x = x;
    this.y = y;
    this.last_x = x;// + (Math.random() - 0.5)*15; // random initial motion
    this.last_y = y;// + (Math.random() - 0.5)*15;
    this.color = options.color ? options.color : colors[randomInt(0, colors.length - 1)]; // color "red" if pinned
    this.pinned = options.pinned ? true :  false;
  }
  
  constrain() {
    //
    // left wall
    //
    if(this.x < this.radius) {
      const dx = this.last_x - this.x;
      const overflow = this.radius - this.x;
      this.last_x = this.x - (dx - overflow);
      this.x = this.x + overflow;
      
      this.last_x += (this.x - this.last_x) * WALL_DAMPING;
      this.last_y += (this.y - this.last_y) * WALL_DAMPING;
    }
    //
    // right wall
    //
    if(this.x > canvas.width - this.radius) {
      const dx = this.x - this.last_x;
      const overflow = this.radius - (canvas.width - this.x);
      
      this.last_x = this.x + (dx - overflow)
      this.x = this.x - overflow;
      
      this.last_x += (this.x - this.last_x) * WALL_DAMPING;
      this.last_y += (this.y - this.last_y) * WALL_DAMPING;
    }
    //
    // ceiling
    //
    if(this.y < this.radius) {
      const dy = this.last_y - this.y;
      const overflow = this.radius - this.y;
      
      this.last_y = this.y + (dy - overflow);
      this.y = this.y + overflow;
      
      this.last_x += (this.x - this.last_x) * WALL_DAMPING;
      this.last_y += (this.y - this.last_y) * WALL_DAMPING;
    }
    //
    // Floor
    //
    if(this.y > canvas.height - this.radius) {
      const dy = this.y - this.last_y;
      const overflow = this.radius - (canvas.height - this.y);
      
      this.last_y = this.y + (dy - overflow);
      this.y = this.y - overflow;
      
      this.last_x += (this.x - this.last_x) * WALL_DAMPING;
      this.last_y += (this.y - this.last_y) * WALL_DAMPING;
    }
  }
  
  update(dt) {
    if(this.pinned) return;
    
    // F = ma -> a = F/m
    const a_x = GRAVITY_X * this.mass;
    const a_y = GRAVITY_Y * this.mass;
    
    const [old_x, old_y] = [this.x, this.y];
    
    // Verlet integration (no velocities, only position + previous one)
    this.x = 2 * this.x - this.last_x + a_x * dt * dt;
    this.y = 2 * this.y - this.last_y + a_y * dt * dt;
    
    this.last_x = old_x;
    this.last_y = old_y;
  }
  
  render(ctx) {
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = OUTLINE_WIDTH;
    ctx.fillStyle = this.pinned ? PINNED_COLOR : this.color;
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }
  
}

// rigid link between 2 points
class Stick {
  constructor(pt1, pt2, length) {
    this.pt1 = pt1;
    this.pt2 = pt2;
    this.length = length;
  }
  
  update(dt) {
    const dx = this.pt2.x - this.pt1.x;
    const dy = this.pt2.y - this.pt1.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const diff = this.length - dist;
    const percent = diff/dist/2;
    const offsetX = dx * percent;
    const offsetY = dy * percent;
    
    if(!this.pt1.pinned) {
      this.pt1.x -= offsetX;
      this.pt1.y -= offsetY;
    }
    if(!this.pt2.pinned) {
      this.pt2.x += offsetX;
      this.pt2.y += offsetY;
    }
  }
  
  render(ctx) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = STICK_WIDTH;
    ctx.beginPath();
    ctx.moveTo(this.pt1.x, this.pt1.y);
    ctx.lineTo(this.pt2.x, this.pt2.y);
    ctx.stroke();
  }
}

function collide(pt1, pt2) {
  return distance(pt1, pt2) < pt1.radius + pt2.radius;
}

function solveCollision(pt1, pt2) { // first version generated by ChatGPT ^^
  
  const dx = pt2.x - pt1.x;
  const dy = pt2.y - pt1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance === 0) return; // Avoid division by zero

  //const ratio = pt1.radius / (pt1.radius + pt2.radius);
  const ratio = 0.5;

  const overlap = ratio * (pt1.radius + pt2.radius - distance);

  // Normalized collision vector
  const nx = dx / distance;
  const ny = dy / distance;

  // Push points apart to resolve overlap
  if(!pt1.pinned) {
    pt1.x -= (pt2.pinned ? 2 : 1) * nx * overlap;
    pt1.y -= (pt2.pinned ? 2 : 1) * ny * overlap;
  }
  if(!pt2.pinned) {
    pt2.x += (pt1.pinned ? 2 : 1) * nx * (1 - overlap);
    pt2.y += (pt1.pinned ? 2 : 1) * ny * (1 - overlap);
  }
  
  // also translate the last_pos
  if(! pt1.pinned) {
    pt1.last_x -= (pt2.pinned ? 2 : 1) * nx * overlap;
    pt1.last_y -= (pt2.pinned ? 2 : 1) * ny * overlap;
  }
  if(! pt2.pinned) {
    pt2.last_x += (pt1.pinned ? 2 : 1) * nx * (1 - overlap);
    pt2.last_y += (pt1.pinned ? 2 : 1) * ny * (1 - overlap);
  }

  //
  // dampen collisions between points by making the "last_pos to pos" distance SHORTER (so slower/dampened)
  // 
  // @TODO: make it work !
  if(! pt1.pinned) {
    pt1.last_x += (pt1.x - pt1.last_x) * COLLISION_DAMPING;
    pt1.last_y += (pt1.y - pt1.last_y) * COLLISION_DAMPING;
  }
  if(! pt2.pinned) {
    pt2.last_x += (pt2.x - pt2.last_x) * (1 - COLLISION_DAMPING);
    pt2.last_y += (pt2.y - pt2.last_y) * (1 - COLLISION_DAMPING);
  }
}

let meanChecks;
function findCollisions() {
  meanChecks = 0;
  randIndexes.map(index => points[index]).forEach(pt1 => {
    let neighbors;
    //console.log(useQuadtree ? "qd" : "naive")
    // naive : O(n^2)
    if (! useQuadtree) {
      neighbors = points; //randIndexes.map(index => points[index]);
    } else {
      // use KD-tree O(n log n), so as to check only a few number of points, instead of all the 350 objects
      const range = new AABB(pt1, MAX_SIZE * 3);
      neighbors = qd.queryRange(range);
    }

    meanChecks += neighbors.length;

    neighbors.forEach(pt2 => {
      if(pt1 == pt2) return;
      if(collide(pt1, pt2)) {
        solveCollision(pt1, pt2);
      }
    });
  });
  meanChecks /= NB_POINTS;
}









let lastTimestamp;
let i = 0;
const SIZE = 4;
let points = [];
let sticks = [];
let randIndexes = [];

let aabb = new AABB(new Vec2(canvas.width / 2, canvas.height / 2), canvas.width / 2);
let qd = new Quadtree(aabb);

function step(timestamp) {
  let t0, t1;
  
  // min = 25ms., to fix huge "dt" when we go back to this page...
  const dt = Math.max(0.01, Math.min(25 / 1000, (timestamp - lastTimestamp) / 1000)); // sec.
  
  if(!isNaN(dt)) {
    
    if(i % SKIP_N_STEPS === 0) {

      document.querySelector('#debug').innerHTML = '';

      t0 = performance.now();

      // first ???
      //
      // Spatial indexation (create anew each time)
      //
      //const t0 = performance.now();
      aabb = new AABB(new Vec2(canvas.width / 2, canvas.height / 2), canvas.width / 2);
      qd = new Quadtree(aabb);
      points.forEach(point => qd.insert(point)); // should have .x & .y properties
      //const t1 = performance.now();
      //console.log("perf. :", t1 - t0); // ~0.1



      /**
       * Movements of points and sticks
       */
      
      // compute next particle position
      randIndexes.map(index => points[index]).forEach(pt => pt.update(dt));
      // length constrain for sticks (between 2 points)
      sticks.forEach(stick => stick.update(dt));
      
      // constrains between all the points (O(n^2) !) TODO: use KD-tree ?
      for(let j = 0; j < SUB_STEPS; j++) { // retry multiple times ...
        // TODO: bug ? jittery, if only 1 "substep" => more energy???
        findCollisions(); // & fix them
      }

      // latest only...
      document.querySelector('#debug').innerHTML += `# objects checked for collision : <b>${round(meanChecks, 0)}</b> per obj.<br/>`;

      // check if constraints (4 walls) violated... and correct them!
      randIndexes.map(index => points[index]).forEach(pt => pt.constrain())
        
      /**
       * Show points & sticks
       */
      // blank screen
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // draw final points & sticks positions
      sticks.forEach(stick => stick.render(ctx));
      points.forEach(pt => pt.render(ctx));

      // "high resolution timestamp in milliseconds"
      t1 = performance.now();

      document.querySelector('#debug').innerHTML += `Time per frame: <b>${round(t1 - t0, 1)}</b> millisec.<br/>`;
      document.querySelector('#debug').innerHTML += `Frame rate: <b>${round(1000 /*ms*/ / (t1 - t0), 1)}</b> per sec.<br/>`;
    }

    i++;
  }
  
  lastTimestamp = timestamp; // to compute "dt" ...
  
  frameReqId = requestAnimationFrame(step);
}



/**
 * 
 */
function main() {
  // (re)init.
  i = 0;
  window.cancelAnimationFrame(frameReqId);
  
  //
  // fixed initial settings (chains, ...)
  //
  points = [
    // X, Y
    // cube
    new Point(canvas.width / 2 - 25, 75, { radius: SIZE, color: greenColors[randomInt(0, greenColors.length - 1)] }), // upper left
    new Point(canvas.width / 2 + 25, 75, { radius: SIZE, color: greenColors[randomInt(0, greenColors.length - 1)] }), // upper right
    new Point(canvas.width / 2 + 25, 125, { radius: SIZE, color: greenColors[randomInt(0, greenColors.length - 1)] }), // lower right
    new Point(canvas.width / 2 - 25, 125, { radius: SIZE, color: greenColors[randomInt(0, greenColors.length - 1)] }), // lower left
    // 1 chain
    new Point(canvas.width / 2, 50, { radius: 8, pinned: true }), // top pinned anchor
    new Point(canvas.width / 2, 75, { radius: SIZE, color: greenColors[randomInt(0, greenColors.length - 1)] }), // chain
    new Point(canvas.width / 2, 100, { radius: SIZE, color: greenColors[randomInt(0, greenColors.length - 1)] }), // chain
  ];

  const NB_I = 20; // number of points in the 2nd chain
  for(let i = 0; i < NB_I; i++) {
    const pinned = i == 0 || (i == NB_I - 4);
    const point = new Point(
      50 + (canvas.width - 100) * i/NB_I,
      pinned ? 225 : 200,
      // options
      {
        radius: pinned ? 8 : 4,
        color: greenColors[randomInt(0, greenColors.length - 1)],
        pinned
      }
    );
    points.push(point);
  }

  const nbPoints = points.length;
  
  for (let i = 0; i < NB_POINTS - nbPoints; i++) {
    points.push(new Point(Math.random() * canvas.width, Math.random() * canvas.height));
  }
  

  aabb = new AABB(new Vec2(canvas.width / 2, canvas.height / 2), canvas.width / 2);
  qd = new Quadtree(aabb);
  points.forEach(point => qd.insert(point)); // should have .x & .y properties
  
  // constrains between all the points
  for(let j = 0; j < SUB_STEPS; j++) { // retry multiple times ...
    // TODO: bug ? jittery, if only 1 "substep" => more energy???
    findCollisions(); // & fix them
  }








  // permutation...
  randIndexes = permutation(points.length);
  //randIndexes = points.map((pt, index) => index); // no permutations

  sticks = [
    // square shape
    new Stick(points[0], points[1], distance(points[0], points[1])),
    new Stick(points[1], points[2], distance(points[1], points[2])),
    new Stick(points[2], points[3], distance(points[2], points[3])),
    new Stick(points[3], points[0], distance(points[3], points[0])),
    new Stick(points[0], points[2], distance(points[0], points[2])),
    // anchor
    new Stick(points[4], points[5], distance(points[4], points[5])),
    new Stick(points[5], points[6], distance(points[5], points[6])), // small chain
    new Stick(points[6], points[0], distance(points[6], points[0])), // small chain (linked with the square)
  ];

  for(let i = 0; i < NB_I - 1; i++) {
    sticks.push(new Stick(points[7+i], points[7+i+1], distance(points[7+i], points[7+i+1])));
  }
  
  frameReqId = window.requestAnimationFrame(step);
}

main();