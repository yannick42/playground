
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';
import { BST } from '../common/bst.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const debugEl = document.getElementById("debug");

function main() {
    document.querySelector("#refresh").addEventListener('click', (e) => redraw());

    redraw();
}

const segments = [];
const colors = ['red', 'orange', 'blue', 'green', 'purple', 'pink'];

function createRandomSegments() {
    segments.splice(0, segments.length);
    for(let i = 0; i < 6; i++) {
        segments.push([
            [
                randInt(0, 10),
                randInt(0, 10)
            ],[
                randInt(0, 10),
                randInt(0, 10)
            ],
            colors[i]
        ])
    }
}

function getSegmentByColor(color) {
    return segments.find(segment => segment[2] === color);
}

function redraw() {

    setUpCanvas(ctx, canvas.width, canvas.height, "white")
    createRandomSegments();

    const bst = new BST();

    const keys = [1, 100, 2, 20, 75, 50];
    const values = ['one', 'one hundred', 'two', 'twenty', 'seventy five', 'fifty'];

    keys.forEach((key, i) => {
        console.log("adding:", key, "(value =", values[i], ")")
        bst.insert(key, values[i]);
    })

    const   inOrder = [],
            preOrder = [],
            postOrder = [];

    bst.printInOrder(bst.root, inOrder);
    console.log("In-order:", inOrder);

    bst.printPreOrder(bst.root, preOrder);
    console.log("Pre-order:", preOrder);

    bst.printPostOrder(bst.root, postOrder);
    console.log("Post-order:", postOrder);

    console.log("delete key=2")
    bst.delete(2);

    const newInOrder = []
    bst.printInOrder(bst.root, newInOrder);
    console.log("In-order:", newInOrder);

    drawSegments(canvas, segments);


    //
    // naive version
    //

    for(let i = 0; i < segments.length; i += 1) {
        for(let j = 0; j < segments.length; j += 1) {
            if(i !== j) {
                has_intersection(segments[i], segments[j]);
            }
        }
    }

    //const intersections = lineSegmentIntersections(segments);

}


const scaleX = (x) => {
    const scale = (canvas.width - 2*15) / (xMax - xMin);
    return (x - xMin) * scale + 15 /*margin*/
}

const scaleY = (y) => {
    const scale = (canvas.height - 2*15) / (yMax - yMin);
    return (y - yMin) * scale + 15 /*margin*/
}

let xMin, xMax, yMin, yMax;

function drawSegments(canvas, segments) {

    const context = canvas.getContext("2d");

    xMin = Math.min(...segments.map(([start, end]) => Math.min(start[0], end[0])));
    xMax = Math.max(...segments.map(([start, end]) => Math.max(start[0], end[0])));
    yMin = Math.min(...segments.map(([start, end]) => Math.min(start[1], end[1])));
    yMax = Math.max(...segments.map(([start, end]) => Math.max(start[1], end[1])));

    //console.log("xMin:", xMin, "xMax:", xMax, "yMin:", yMin, "yMax:", yMax);

    segments.forEach(([start, end, color]) => {
        const startScaledX = scaleX(start[0]);
        const startScaledY = scaleY(start[1]);
        const endScaledX = scaleX(end[0]);
        const endScaledY = scaleY(end[1]);
        //console.log(">", startScaledX, startScaledY, endScaledX, endScaledY)

        drawPointAt(context, startScaledX, startScaledY, 5, color);
        drawPointAt(context, endScaledX, endScaledY, 5, color);

        drawLine(context, startScaledX, startScaledY, endScaledX, endScaledY, 3, color);
    })

}


/**
 * https://stackoverflow.com/a/55598451
 */
function has_intersection(segment1, segment2) {

    let intersect = false;

    const dx1 = segment1[1][0] - segment1[0][0];
    const dx2 = segment2[1][0] - segment2[0][0]
    const dy1 = segment1[1][1] - segment1[0][1]
    const dy2 = segment2[1][1] - segment2[0][1]

    const det = dx1 * dy2 - dx2 * dy1; // can be 0 if lines are parallel

    const dx3 = segment1[0][0] - segment2[0][0]
    const dy3 = segment1[0][1] - segment2[0][1];

    const det1 = dx1 * dy3 - dx3 * dy1
    const det2 = dx2 * dy3 - dx3 * dy2

    if(det1 == 0) {
        const s = segment2[0][0] / dx1;
        const t = segment2[1][0] / dx1;
    }

    const s = det1 / det
    const t = det2 / det
    if (s < 0 || s > 1 || t < 0 || t > 1) {
        intersect = false;
    } else {
        intersect = true;
    }

    const Ix = segment1[0][0] + t * dx1;
    const Iy = segment1[0][1] + t * dy1;

    if(intersect) {
        drawPointAt(ctx, scaleX(Ix), scaleY(Iy), 5, "black");
        drawPointAt(ctx, scaleX(Ix), scaleY(Iy), 3, "white");
    } else {
        // may intersect, but outside their segment
    }

    return intersect ? [Ix, Iy] : false;
}












/**
 * using a sweep line algorithm (not "continuously"...)
 */
function lineSegmentIntersections(segments) {

    function findNewEvent(s_l, s_r, p) {
        /**
         * INTERSECTION TEST : check if 2 segments intersect
         */
        const intersect = has_intersection(s_l, s_r);

        // check if s_l & s_r intersect below the sweep line (or to the right of p, if horizontal)
        if(intersect != false) {
            if(intersect[1] > p[1]) { // if below the line ? TODO: Check
                // insert the "intersection point" as event point (in Q)
                Q.insert(intersect[1], [s_l, s_r]);
            } else {
                // if above, it has been detected already
            }
        }
    }


    /**
     * set of segments whose upper endpoint is p
     * 
     * for an horizontal line, it is the left endpoint
     */
    function U(p) {
        return segments.filter(segment => p[0] === segment[0][0] && p[1] === segment[0][1])
    }
    function L(segs, p) {
        return segs.filter(segment => p[0] === segment[1][0] && p[1] === segment[1][1])
    }
    // segments that contains p in their interior
    function C(segs, p) {
        return segs.filter(segment => {
            p[0] === segment[1][0] && p[1] === segment[1][1]
        })
    }


    /**
     * p = [4, 5] ?? TODO: add associated segments (2 at least...)
     */
    function handleEventPoint(p)
    {
        const U_p = U(p);

        // T is ordered by x-axis value ? => order of the segments at the sweep line
        const segmentsThatContainsP = T.find(p); // they are adjacent in T

        const L_p = L(segmentsThatContainsP, p); // as lower point
        const C_p = C(segmentsThatContainsP, p); // as a contained point..

        // if contains more than one segment
        if([...L_p, ...C_p, ...U_p].length >= 2) {
            // report "p" as an intersection, together with L(p), U(p), and C(p)
            // ???
        }

        [...L_p, ...C_p].forEach(segment => {
            T.delete(segment); // delete from the "status" T as it stops intersecting the sweep line
        })


        // TODO: order the segment as they intersect the sweep line (x-axis)
        //
        // beware the horizontal lines
        //
        U_union_C = [...U_p, ...C_p];
        U_union_C.sort((a, b) => {
            // TODO: find the x -> intersection with the sweep line (order with that...)

            return a[0] - b[0]
        }).forEach(segment => {
            T.insert(segment);
            // U_p are the new segment crossing the line l ?
        })



        //
        // INFO: deleting and reinserting the segments of C(p) reverses their order !!
        //



        if(U_union_C.length == 0) {
            const s_l = p . left // left neighbor in T
            const s_r = p . right // right neighbor in T
            if(s_l && s_r) {
                findNewEvent(s_l, s_r, p);
            }
        } else {
            const s_prime = ''; // the leftmost segment in U(p) union C(p) in T
            const s_l = ''; // left neighbor of s_prime in T
            if(s_prime && s_l) {
                findNewEvent(s_prime, s_l, p);
            }

            const s_prime_prime = ''; // the rightmost segment of U(p) union C(p) in T
            const s_r = ''; // right neighbor of s_prime_prime in T
            if(s_prime_prime && s_r) {
                findNewEvent(s_prime_prime, s_r, p);
            }
        }

    }




    /**
     * inserting and deleting takes O(log m) time (m=number of events in Q)
     * 
     * We do not use a heap to implement the event queue, because we have to
     * be able to test whether a given event is already present in Q. -> ?
     * 
     */

    const Q = new BST(); // queue: event point (those are endpoints of the segments)
    const T = new BST(); // status (start empty) -> it is the ordered (x-axis) segments intersecting the sweep line
    // -> used to access the neighbors of a given segment s, to test them for intersection with s
    // -> BST can store any set of elements (in .value), as long as their is an order on the elements (y, then x if "tie")
    // ----> "ordered in the leaves ?!?"

    // fill it with endpoints ?
    segments.forEach(segment => {
        Q.insert(segment[0][1], [segment]);
        Q.insert(segment[1][1], [segment]);
    })

    while(!Q.isEmpty()) {

        const nextEvent = Q.delete(); // should retrieve it ! (while deleting it)

        console.log("nextEvent:", nextEvent); // it's the highest event below the sweep line
        // TODO: if same y-coordinate, take the left most

        handleEventPoint(p);
    }

}

main();
