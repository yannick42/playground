
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

function main() {
    document.querySelector("#refresh").addEventListener('click', (e) => redraw());

    redraw();
}

function redraw() {

    setUpCanvas(ctx, 500, 500, 'whitesmoke');
    maxDepth = 0;

    const halfDimension = canvas.width / 2;
    const aabb = new AABB(new Vec2(canvas.width / 2, canvas.height / 2), halfDimension);
    
    const qd = new Quadtree(aabb);
    
    const points = [];
    for(let i = 0; i < 100; i++) {
        points.push(new Vec2(randInt(1, canvas.width), randInt(1, canvas.height)));
    }
    
    points.forEach(point => {
        qd.insert(point);
        drawPointAt(ctx, point.x, point.y, 2.5, 'blue');
    });
    
    // draw quadrants
    let currentQuadrants = [qd.NW, qd.NE, qd.SW, qd.SE];
    while(currentQuadrants.length) {
        //console.log("quadrants:", currentQuadrants)
        currentQuadrants.forEach(quadrant => {
            const x = quadrant.boundary.center.x - quadrant.boundary.halfDimension;
            const y = quadrant.boundary.center.y - quadrant.boundary.halfDimension;
            const size = quadrant.boundary.halfDimension * 2;
            //console.log(x, y, size)

            ctx.strokeStyle = 'black';
            ctx.lineWidth = 0.25;
            ctx.setLineDash([2.5, 2.5]);
            ctx.beginPath();
            ctx.rect(
                x,
                y,
                size,
                size
            )
            ctx.stroke();
        })

        // continue with next depth level if any
        currentQuadrants = currentQuadrants.flatMap(quadrant => [quadrant.NW, quadrant.NE, quadrant.SW, quadrant.SE].filter(q => q));
    }

    document.getElementById('debug').innerHTML = 'max depth = ' + maxDepth;

}



class Vec2 {
    x;
    y;
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

const QD_NODE_CAPACITY = 1;

let maxDepth = 0;

class Quadtree {

    boundary; // type AABB
    NW; NE; // 4 nodes
    SW; SE;

    points = []; // points in this node

    depth;

    constructor(boundary, depth=0) {
        this.boundary = boundary;
        this.depth = depth;

        if(depth > maxDepth) {
            maxDepth = depth;
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
            this.subdivide();
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
}



main();
