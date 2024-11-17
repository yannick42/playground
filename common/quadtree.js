import { AABB } from './aabb.js';

export let currentMaxDepth = 0;
const QD_NODE_CAPACITY = 1;

export class Vec2 {
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

export class Quadtree {

    boundary; // type AABB
    NW; NE; // 4 nodes
    SW; SE;

    points = []; // points in this node

    depth;

    constructor(boundary, depth=0) {
        this.boundary = boundary;
        this.depth = depth;

        if(depth == 0) {
            currentMaxDepth = 0;
        }

        if(depth > currentMaxDepth) {
            currentMaxDepth = depth;
        }
    }

    getMaxDepth() {
        return currentMaxDepth;
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
            if(this.depth > 8 || this.boundary.halfDimension < 1 /* ? */) {
                /*if(this.boundary.halfDimension < 1) {
                    console.warn(">>", this.boundary.halfDimension, this.depth);
                }*/
                this.points.push(point);
                return; // exit !
            } else {
                //console.log("subdivide:", this.depth, this.boundary.halfDimension)
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

    queryRange(range) {
        let pts = [];

        if(!this.boundary.intersect(range)) {
            return pts; // returns an empty array
        }

        // add points at this level (no, if not leaf ?)
        this.points.forEach(pt => {
            if(range.contains(pt)) {
                pts.push(pt);
            }
        });

        if(!this.NW) return pts; // no child

        pts = pts.concat(this.NW.queryRange(range));
        pts = pts.concat(this.NE.queryRange(range));
        pts = pts.concat(this.SW.queryRange(range));
        pts = pts.concat(this.SE.queryRange(range));
        return pts;
    }
}
