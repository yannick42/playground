// TODO: use common helper functions !!
//import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';


/**
TODO:
- add a configurable small text in the point (eg. "A" or "1", ...), if radius is big enough
*/

import { round } from '../common/math.helper.js';
import { Vec2, Quadtree } from '../common/quadtree.js';
import { AABB } from '../common/aabb.js';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const distance = (pt1, pt2) => Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2))

const NB_POINTS = 500,
      MIN_SIZE = 2,
      MAX_SIZE = 9,
      GRAVITY_X = 0,
      GRAVITY_Y = 200,
      RATIO_MASS_OVER_RADIUS = 0.1,
      SKIP_N_STEPS = 1, // to slow down speed by skipping frames (min=1)
      SUB_STEPS = 5,
      WALL_DAMPING = 0.3,
      COLLISION_DAMPING = 0.2, // for slowed collisions & less weird movement at the bottom, but less bouncing
      PINNED_COLOR = 'red',
      STICK_WIDTH = 3,
      OUTLINE_WIDTH = 0.5;

let frameReqId;

const colors = ['darkblue', 'blue', 'mediumblue', 'navy', 'dodgerblue', 'cornflowerblue', 'deepskyblue'];
const greenColors = ['green', 'darkseagreen', 'lime', 'olivegrab', 'palegreen', 'lawngreen', 'lightgreen'];

let useQuadtree = false;

const resetButton = document.querySelector('button');
resetButton.addEventListener('click', (e) => { 
  points = [];
  main();
}); // restart process
const quadtreeCheckbox = document.querySelector('#use_quadtree');
quadtreeCheckbox.addEventListener('change', (e) => useQuadtree = e.target.checked); // restart process

const onTouchMove = (e) => {
  let pos = { x: e.clientX, y: e.clientY };
  if (e.touches) {
      pos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  const rect = e.target.getBoundingClientRect();
  const x = pos.x - rect.left;
  const y = pos.y - rect.top;

  mousePoint.x = x;
  mousePoint.y = y;

  e.preventDefault(); // prevent scrolling in the page while touchmove
}
const onTouchEnd = (e) => {
  mousePoint.x = -Math.inf;
  mousePoint.y = -Math.inf;
}

canvas.addEventListener('mousemove', onTouchMove);
canvas.addEventListener('touchmove', onTouchMove);

canvas.addEventListener('mouseout', onTouchEnd)
canvas.addEventListener('touchend', onTouchEnd);



let isMousePressed = false;

// Add these new event listeners
canvas.addEventListener('mousedown', (e) => {
  isMousePressed = true;
  // Optionally spawn a ball immediately on mousedown
  spawnBallAtMousePosition(e);
});

canvas.addEventListener('mouseup', (e) => {
  isMousePressed = false;
});

// Modify your existing mousemove handler
canvas.addEventListener('mousemove', (e) => {
  onTouchMove(e); // Keep the existing mouse tracking logic
  
  // Spawn ball if mouse is pressed
  if (isMousePressed) {
    spawnBallAtMousePosition(e);
  }
});


function spawnBallAtMousePosition(e) {
  let pos = { x: e.clientX, y: e.clientY };
  const rect = e.target.getBoundingClientRect();
  const x = pos.x - rect.left;
  const y = pos.y - rect.top;

  const pt = new Point(
    x,
    y + 25,
    {
      radius: randInt(MIN_SIZE, MAX_SIZE),
      color: colors[randInt(0, colors.length - 1)]
    }
  );

  points.push(pt);

  // permutation...
  randIndexes = permutation(points.length);
}



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
    this.radius = options.radius ?? randInt(MIN_SIZE, MAX_SIZE);
    this.mass = this.radius * RATIO_MASS_OVER_RADIUS;
    this.x = x;
    this.y = y;
    this.last_x = x;// + (Math.random() - 0.5)*15; // random initial motion
    this.last_y = y;// + (Math.random() - 0.5)*15;
    this.initial_color = options.color ? options.color : colors[randInt(0, colors.length - 1)]; // color "red" if pinned
    this.color = this.initial_color;
    this.pinned = options.pinned ? true : false;
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

    if(this.pinned || this.color === 'transparent') return;
    
    // F = ma -> a = F/m
    const a_x = GRAVITY_X / this.mass;
    const a_y = GRAVITY_Y / this.mass;
    
    const [old_x, old_y] = [this.x, this.y];
    
    //
    // VERLET INTEGRATION (here, version with no velocities, only position + previous one)
    //
    this.x = 2 * this.x - this.last_x + a_x * dt * dt;
    this.y = 2 * this.y - this.last_y + a_y * dt * dt;
    
    this.last_x = old_x;
    this.last_y = old_y;
  }
  
  render(ctx) {
    ctx.beginPath();
    ctx.strokeStyle = this.color === 'transparent' ? 'white' : 'black';
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
  const distance = Math.sqrt(dx * dx + dy * dy); // between centers

  // Calculate separation based on mass ratio (or use 0.5 for equal)
  const totalMass = pt1.mass + pt2.mass;
  const ratio1 = pt1 === mousePoint ? 0 : (pt2 === mousePoint ? 1 : pt1.mass / totalMass); // pt1 moves this much
  const ratio2 = pt2 === mousePoint ? 0 : (pt1 === mousePoint ? 1 : pt2.mass / totalMass); // pt2 moves this much

  const overlap = pt1.radius + pt2.radius - distance;
  //console.log(overlap)

  // Normalized collision vector
  const nx = dx / distance;
  const ny = dy / distance;

  // Separate the points
  const separation1 = overlap * ratio1;
  const separation2 = overlap * ratio2;

  if (!pt1.pinned) {
    pt1.x -= nx * separation1;
    pt1.y -= ny * separation1;
  }
  if (!pt2.pinned) {
    pt2.x += nx * separation2;
    pt2.y += ny * separation2;
  }

  // Apply collision damping by modifying the velocity implicit in Verlet integration
  // In Verlet, velocity = current_pos - last_pos
  if (! pt1.pinned) {
    
    // Reduce velocity by damping factor
    pt1.last_x -= (nx * separation1) * COLLISION_DAMPING;
    pt1.last_y -= (ny * separation1) * COLLISION_DAMPING;

    //pt1.color = "orange";
  }

  if (! pt2.pinned) {

    // Reduce velocity by damping factor
    pt2.last_x += (nx * separation2) * COLLISION_DAMPING;
    pt2.last_y += (ny * separation2) * COLLISION_DAMPING;

    //pt2.color = "orange";
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
      if(pt1 == pt2) return; // skip
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

      document.querySelector('#debug').innerHTML = ''; //points.length + " points.";

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
        if (useQuadtree) {
          aabb = new AABB(new Vec2(canvas.width / 2, canvas.height / 2), canvas.width / 2);
          qd = new Quadtree(aabb);
          points.forEach(point => qd.insert(point)); // should have .x & .y properties
        }
        // TODO: bug ? jittery, if only 1 "substep" => more energy???
        findCollisions(); // & fix them

        // check if constraints (4 walls) violated... and correct them!
        randIndexes.map(index => points[index]).forEach(pt => pt.constrain())
      }

      // latest only...
      document.querySelector('#debug').innerHTML += `# objects checked for collision : <b>${round(meanChecks, 0)}</b> per obj.<br/>`;

      /**
       * Show points & sticks
       */
      // blank screen
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // draw final points & sticks positions
      sticks.forEach(stick => stick.render(ctx));
      points.forEach(pt => {
        pt.render(ctx);
        pt.color = pt.initial_color; // reset color ...
      });

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

let mousePoint;

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
    new Point(canvas.width / 2 - 25, 75, { radius: SIZE, color: greenColors[randInt(0, greenColors.length - 1)] }), // upper left
    new Point(canvas.width / 2 + 25, 75, { radius: SIZE, color: greenColors[randInt(0, greenColors.length - 1)] }), // upper right
    new Point(canvas.width / 2 + 25, 125, { radius: SIZE, color: greenColors[randInt(0, greenColors.length - 1)] }), // lower right
    new Point(canvas.width / 2 - 25, 125, { radius: SIZE, color: greenColors[randInt(0, greenColors.length - 1)] }), // lower left
    // 1 chain
    new Point(canvas.width / 2, 50, { radius: 8, pinned: true }), // top pinned anchor
    new Point(canvas.width / 2, 75, { radius: SIZE, color: greenColors[randInt(0, greenColors.length - 1)] }), // chain
    new Point(canvas.width / 2, 100, { radius: SIZE, color: greenColors[randInt(0, greenColors.length - 1)] }), // chain
  ];

  const NB_I = 30; // number of points in the 2nd chain
  for(let i = 0; i < NB_I; i++) {
    const pinned = i == 0 || (i == NB_I - 4);
    const point = new Point(
      75 + (canvas.width - 75) * i/NB_I,
      pinned ? 150 : 150,
      // options
      {
        radius: pinned ? 8 : 4,
        color: greenColors[randInt(0, greenColors.length - 1)],
        pinned
      }
    );
    points.push(point);
  }

  // "mouse point"
  mousePoint = new Point(-Math.inf, -Math.inf, { radius: 20, color: 'transparent' })
  points.push(mousePoint);

  const nbPoints = points.length;
  
  for (let i = 0; i < NB_POINTS - nbPoints; i++) {
    points.push(new Point(Math.random() * canvas.width, Math.random() * canvas.height));
  }
  
  aabb = new AABB(new Vec2(canvas.width / 2, canvas.height / 2), canvas.width / 2);
  qd = new Quadtree(aabb);
  points.forEach(point => qd.insert(point)); // should have .x & .y properties
  
  // permutation...
  randIndexes = permutation(points.length);
  //randIndexes = points.map((pt, index) => index); // no permutations

  // constrains between all the points
  for(let j = 0; j < SUB_STEPS; j++) { // retry multiple times ...
    // TODO: bug ? jittery, if only 1 "substep" => more energy???
    findCollisions(); // & fix them
  }



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