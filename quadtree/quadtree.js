
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';
import { normalize, distance } from '../common/math.helper.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const halfDimension = canvas.width / 2;
let currentMaxDepth = 0,
    reqFrameId;
const QD_NODE_CAPACITY = 1,
    NB_POINTS = 200,
    RADIUS = 2;

function main() {
    document.querySelector("#refresh").addEventListener('click', (e) => redraw());
    redraw();
}

function collide(pt1, pt2) {
    return distance(pt1.position.x, pt1.position.y, pt2.position.x, pt2.position.y) < 2 * RADIUS;
}

function solveCollision(pt1, pt2) {
    const dx = pt2.position.x - pt1.position.x;
    const dy = pt2.position.y - pt1.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
  
    if (distance === 0) return; // Avoid division by zero
  
    const overlap = 0.5 * (2 * RADIUS - distance);
  
    // Normalized collision vector
    const nx = dx / distance;
    const ny = dy / distance;
  
    // Push points apart to resolve overlap
    pt1.position.x -= nx * overlap;
    pt1.position.y -= ny * overlap;
    pt2.position.x += nx * overlap;
    pt2.position.y += ny * overlap;
    
}

function findCollisions() {
    points.forEach(pt1 => {
        points.forEach(pt2 => {
            if(pt1 == pt2) return;
            if(collide(pt1, pt2)) {
                solveCollision(pt1, pt2);
            }
        })
    })
}

let points = [];

function redraw() {

    window.cancelAnimationFrame(reqFrameId);
    
    points = [];
    for(let i = 0; i < NB_POINTS; i++) {
        points.push(new Point(new Vec2(randInt(1, canvas.width), randInt(1, canvas.height))));
    }


    function step(datetime) {
        //console.log(datetime);

        // move everything for next frame
        points.forEach(point => {
            point.position.x += point.velocity.x;
            point.position.y += point.velocity.y;

            if(point.position.x > canvas.width) {
                point.velocity.x *= -1;
            }
            if(point.position.x < 0) {
                point.velocity.x *= -1;
            }
            if(point.position.y > canvas.height) {
                point.velocity.y *= -1;
            }
            if(point.position.y < 0) {
                point.velocity.y *= -1;
            }
        });

        findCollisions();

        setUpCanvas(ctx, 500, 500, 'whitesmoke');
    
        const aabb = new AABB(new Vec2(canvas.width / 2, canvas.height / 2), halfDimension);
        currentMaxDepth = 0;

        // create anew each time !
        const t0 = performance.now();
        const qd = new Quadtree(aabb);
        points.forEach(point => {
            qd.insert(point.position);
        });
        const t1 = performance.now();
        //console.log(`Quadtree generation took ${t1 - t0} milliseconds`); // 0.1 ms ?!
        
        // draw points
        points.forEach(point => drawPointAt(ctx, point.position.x, point.position.y, RADIUS, 'blue'));
        
        // draw quadrants
        let currentQuadrants = [qd.NW, qd.NE, qd.SW, qd.SE];
        while(currentQuadrants.length) {
            //console.log("quadrants:", currentQuadrants)
            currentQuadrants.forEach((quadrant, i) => {

                if(!quadrant) return;

                const x = quadrant.boundary.center.x - quadrant.boundary.halfDimension;
                const y = quadrant.boundary.center.y - quadrant.boundary.halfDimension;
                const size = quadrant.boundary.halfDimension * 2;
                //console.log(x, y, size)

                ctx.strokeStyle = 'black';
                ctx.lineWidth = 0.5;
                ctx.setLineDash([4, 2]);
                
                /*
                ctx.beginPath();
                ctx.rect(
                    x,
                    y,
                    size,
                    size
                )
                ctx.stroke();
                */

                if(i % 4 === 3) { // SE -> left
                    ctx.beginPath();
                    //ctx.strokeStyle = 'red';
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, y + size);
                    ctx.stroke();
                } else if (i % 4 === 2) { // SW -> top
                    ctx.beginPath();
                    //ctx.strokeStyle = 'green';
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + size, y);
                    ctx.stroke();
                } else if (i % 4 === 1) { // NE -> below
                    ctx.beginPath();
                    //ctx.strokeStyle = 'blue';
                    ctx.moveTo(x, y + size);
                    ctx.lineTo(x + size, y + size);
                    ctx.stroke();
                } else if(i % 4 === 0) { // NW -> right
                    ctx.beginPath();
                    //ctx.strokeStyle = 'purple';
                    ctx.moveTo(x + size, y);
                    ctx.lineTo(x + size, y + size);
                    ctx.stroke();
                }
            })

            // continue with next depth level if any
            currentQuadrants = currentQuadrants?.flatMap(quadrant => [quadrant?.NW, quadrant?.NE, quadrant?.SW, quadrant?.SE]) ?? [];

            if(currentQuadrants.filter(o => o).length === 0) {
                break;
            }
        }

        document.getElementById('debug').innerHTML = 'max depth = ' + currentMaxDepth;

        reqFrameId = window.requestAnimationFrame(step);
    }
    step();
}

class Point {
    constructor(position) {
        this.position = position;
        this.velocity = new Vec2(...normalize([Math.random() - 0.5, Math.random() - 0.5]));
    }
}

class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(other) {
        return new Vec2(
            this.x + other.x,
            this.y + other.y
        )
    }
}

class AABB {

    center;
    halfDimension;

    constructor(center, halfDimension) {
        this.center = center;
        this.halfDimension = halfDimension;
    }

    contains(point) {
        if(point.x >= this.center.x - this.halfDimension && point.x <= this.center.x + this.halfDimension
            && point.y >= this.center.y - this.halfDimension && point.y <= this.center.y + this.halfDimension
        ) {
            return true;
        }
        return false;
    }
}


class Quadtree {

    boundary; // type AABB
    NW; NE; // 4 nodes
    SW; SE;

    points = []; // points in this node

    depth;

    constructor(boundary, depth=0) {
        this.boundary = boundary;
        this.depth = depth;

        if(depth > currentMaxDepth) {
            currentMaxDepth = depth;
        }
    }

    // create 4 children
    subdivide() {

        const halfDim = this.boundary.halfDimension;

        this.NW = new Quadtree(new AABB(this.boundary.center.add(new Vec2(-halfDim/2, -halfDim/2)), halfDim / 2), this.depth+1);
        this.NE = new Quadtree(new AABB(this.boundary.center.add(new Vec2(halfDim/2, -halfDim/2)), halfDim / 2), this.depth+1);
        this.SW = new Quadtree(new AABB(this.boundary.center.add(new Vec2(-halfDim/2, halfDim/2)), halfDim / 2), this.depth+1);
        this.SE = new Quadtree(new AABB(this.boundary.center.add(new Vec2(halfDim/2, halfDim/2)), halfDim / 2), this.depth+1);
    }
    
    //
    insert(point) {

        if(! this.boundary.contains(point)) {
            return false;
        }

        //console.log("inserting point:", point, "at depth=", this.depth)

        if(this.points.length < QD_NODE_CAPACITY && ! this.NW) {
            this.points.push(point)
            return true;
        }

        if(! this.NW) {
            //console.log("subdivide!")
            if(this.depth > 15) {
                console.error("??")
                return;
            } else {
                this.subdivide();
            }
        }

        // transfert all the points at current levels into the leaves
        this.points.forEach(pt => {
            if(this.NW.insert(pt)) return;
            if(this.NE.insert(pt)) return;
            if(this.SW.insert(pt)) return;
            if(this.SE.insert(pt)) return;
        });
        this.points = []; // emptied

        //
        // now, insert initial point...
        //
        if(this.NW.insert(point)) return true;
        if(this.NE.insert(point)) return true;
        if(this.SW.insert(point)) return true;
        if(this.SE.insert(point)) return true;

        return false; // should never happen
    }

    // TODO : query a point ...
}



main();