
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';
import { normalize, distance } from '../common/math.helper.js';
import { Vec2, Quadtree } from '../common/quadtree.js';
import { AABB } from '../common/aabb.js';

class Object {
    constructor(position) {
        this.position = position;
        this.velocity = new Vec2(...normalize([Math.random() - 0.5, Math.random() - 0.5]));
    }
}

/**
INFO: it was slow when objects were allowed to colide (-> overlap), why ??
*/

/**
 * TODO:
 *  - show counts (number of objects) at level each level -> add opacity "red-ish" color
 *  
 * BARNES-HUT
 *  - ?
 */

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

let objects = [],
    reqFrameId;

const halfDimension = canvas.width / 2,
    NB_OBJECTS = 500,
    RADIUS = 1.5;

function main() {
    document.querySelector("#refresh").addEventListener('click', (e) => redraw());
    redraw();
}

// initial settings (modified by mouse interactions)
let rangeHalfSize = 50;
let mouseX = 100, mouseY = 100;

canvas.addEventListener('mousemove', function(e) {
    [mouseX, mouseY] = [e.offsetX, e.offsetY];
});
canvas.addEventListener("wheel", event => {
    const minSize = 5;
    rangeHalfSize += -event.deltaY * 0.5 /*slowdown*/;
    if(rangeHalfSize < minSize) {
        rangeHalfSize = minSize;
    }
    if(rangeHalfSize > 1.5 * halfDimension) {
        rangeHalfSize = 1.5 * halfDimension;
    }
    event.preventDefault(); // prevents scrolling the page
});



/**
 * ~ same methods as in Verlet int. page /!\
 */
function collide(pt1, pt2) {
    return distance(pt1.position.x, pt1.position.y, pt2.position.x, pt2.position.y) < 2 * RADIUS;
}

function solveCollision(pt1, pt2) {
    const dx = pt2.position.x - pt1.position.x;
    const dy = pt2.position.y - pt1.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
  
    if (distance === 0) return; // Avoid division by zero
  
    const overlap = 0.5 * (2 * RADIUS - distance);
  
    // normalized collision vector
    const nx = dx / distance;
    const ny = dy / distance;
  
    // Simply push objects apart to resolve overlap... (but not realistic)
    pt1.position.x -= nx * overlap;
    pt1.position.y -= ny * overlap;
    pt2.position.x += nx * overlap;
    pt2.position.y += ny * overlap;
}

function findCollisions() {
    objects.forEach(pt1 => {
        objects.forEach(pt2 => {
            if(pt1 == pt2) return;
            if(collide(pt1, pt2)) {
                solveCollision(pt1, pt2);
            }
        })
    })
}









function redraw() {

    window.cancelAnimationFrame(reqFrameId);
    
    objects = [];
    for(let i = 0; i < NB_OBJECTS; i++) {
        objects.push(new Object(new Vec2(randInt(1, canvas.width), randInt(1, canvas.height))));
    }


    function step(datetime) {
        //console.log(datetime);

        // move everything for next frame
        objects.forEach(object => {
            object.position.x += object.velocity.x;
            object.position.y += object.velocity.y;

            // TODO: we slowly lose points from the viewport ?!
            if(object.position.x > canvas.width) {
                object.velocity.x *= -1;
            }
            if(object.position.x < 0) {
                object.velocity.x *= -1;
            }
            if(object.position.y > canvas.height) {
                object.velocity.y *= -1;
            }
            if(object.position.y < 0) {
                object.velocity.y *= -1;
            }
        });

        findCollisions();

        setUpCanvas(ctx, 500, 500, 'whitesmoke');
    
        const aabb = new AABB(new Vec2(canvas.width / 2, canvas.height / 2), halfDimension);
        
        // create anew each time !
        const t0 = performance.now();
        const qd = new Quadtree(aabb);
        objects.forEach(object => {
            qd.insert(object.position);
        });
        const t1 = performance.now();
        //console.log(`Quadtree generation took ${t1 - t0} milliseconds`); // 0.1 ms ?!
        
        // draw objects (points)
        objects.forEach(object => drawPointAt(ctx, object.position.x, object.position.y, RADIUS, 'blue'));
        
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

        document.getElementById('debug').innerHTML = 'Current quadtree depth = ' + qd.getMaxDepth();

        const range = new AABB(new Vec2(mouseX, mouseY), rangeHalfSize /*halfDim*/);
        //drawPointAt(ctx, mouseX, mouseY, 5, 'red');
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.strokeStyle = 'red'
        ctx.rect(mouseX - rangeHalfSize, mouseY - rangeHalfSize, rangeHalfSize*2, rangeHalfSize*2);
        ctx.stroke();
        const pts = qd.queryRange(range);
        pts.forEach(pt => drawPointAt(ctx, pt.x, pt.y, RADIUS * 1.5, 'red'));
        document.getElementById('debug').innerHTML += '<br/> number of objects in range = ' + pts.length;

        reqFrameId = window.requestAnimationFrame(step);
    }
    step();
}

main();
