
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../_common/canvas.helper.js';
import { randInt, randFloat } from '../_common/common.helper.js';
import { round } from '../_common/math.helper.js';
import { BST } from '../_common/bst.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const debugEl = document.getElementById("debug");
const stepButtonEl = document.getElementById("step_button");
const prevStepButtonEl = document.getElementById("prev_step_button");
const retryButtonEl = document.getElementById("refresh");
const methodEl = document.getElementById("method");
const newSetEl = document.getElementById("new");
const numberEl = document.getElementById("number");
const showDebugEl = document.getElementById("show_debug");

const colors = ['red', 'orange', 'blue', 'green', 'purple', 'pink', 'darkorange', 'darkred', 'darkblue', 'gray'];
let NB_SEGMENTS = 10;

let segments = [],
    intersections = [],
    Q, // event points
    T, // sweep line status
    untilStep = 1,
    debugHTML = '',
    showDebug = true,
    xMin, xMax, yMin, yMax;

function main() {

    numberEl.value = NB_SEGMENTS;

    retryButtonEl.addEventListener('click', (e) => {
        untilStep = null; // all step at once
        redraw();
    });
    stepButtonEl.addEventListener('click', (e) => {
        untilStep += 1;
        redraw();
    });
    prevStepButtonEl.addEventListener('click', (e) => {
        untilStep -= 1;
        redraw();
    })
    methodEl.addEventListener('click', (e) => {
        stepButtonEl.disabled = e.target.value == "naive";
        untilStep = 1;
    });
    newSetEl.addEventListener('click', (e) => {
        createRandomSegments(false);
        redraw();
    })
    numberEl.addEventListener('input', (e) => {
        NB_SEGMENTS = e.target.value;
    })
    showDebugEl.addEventListener('input', (e) => showDebug = e.target.checked);
    showDebugEl.checked = showDebug;

    createRandomSegments(); // default segments list
    redraw();
}

function createRandomSegments(fixed=true)
{
    segments = []; // reinit.
    if(fixed) {
        //segments = [[[7.5,2.2],[4.4,3.1],"red"],[[3.4,0.9],[5.1,8.5],"orange"],[[5.4,1.2],[0.7,2],"blue"],[[8.1,2.3],[2.6,2.5],"green"]];
        //segments = [[[8.9,1.1],[3,6.9],"red"],[[8.1,1.2],[5.9,2.5],"purple"],[[8.5,2.2],[4.5,4.8],"pink"]];
        //segments = [[[2.1,4.3],[3.5,9.9],"red"],[[1.3,5.5],[5.3,9.2],"green"],[[4.8,3.2],[0.2,7.6],"pink"]];
        segments = [[[0.3,6.4],[8.6,7.4],"red"],[[5.4,1.6],[1.9,3.6],"orange"],[[5.2,3],[5.8,7.6],"green"],[[2.2,2.1],[6,4.5],"purple"]];
        //segments = [[[1.3,4],[4,8.4],"red"],[[7,7.2],[0.4,9],"orange"],[[9.9,2.1],[3.8,4.4],"blue"]];
    } else {
        for(let i = 0; i < NB_SEGMENTS; i++) {
            const pt1 = [
                Math.round(randFloat(0, 10) * 10) / 10,
                Math.round(randFloat(0, 10) * 10) / 10
            ];
            const pt2 = [
                Math.round(randFloat(0, 10) * 10) / 10,
                Math.round(randFloat(0, 10) * 10) / 10
            ];
            const points = [pt1, pt2];
            
            // order from upper-left to down-right
            points.sort((a, b) => {
                const yDiff = b[1] - a[1];
                if(yDiff > 0) {
                    return -1;
                } else if(yDiff < 0) {
                    return 1;
                } else {
                    return b[0] - a[0] > 0 ? -1 : 1;
                }
            });
            segments.push([points[0], points[1], colors[i % colors.length]]);
        }
    }
}

function getSegmentByColor(color) {
    return segments.find(segment => segment[2] === color);
}

function redraw() {

    setUpCanvas(ctx, canvas.width, canvas.height, "white");

    debugHTML = '<table id="debug-table"><thead><td><b>Event</b></td><td><b>Details</b></td></thead>'; // clear

    drawSegments(canvas, segments);

    //
    // naive version
    //
    console.clear();
    console.log("method =", methodEl.value);

    const t0 = window.performance.now();
    switch(methodEl.value) {
        case "naive":
            intersections = [];
            for(let i = 0; i < segments.length; i += 1) {
                for(let j = i; j < segments.length; j += 1) {
                    if(i !== j) {
                        const inter = has_intersection(segments[i], segments[j]);
                        if(inter) {
                            //console.log(i, j)
                            intersections.push(inter);
                        }
                    }
                }
            }
            break;
        case "sweep":
            intersections = lineSegmentIntersections(segments)?.map(i => i.at);
            break
    }

    const duration_ms = window.performance.now() - t0;

    document.getElementById("nb_intersection").innerText = intersections.length + ' (in ' + round(duration_ms, 2) + ' ms.)';

    // draw them
    intersections.forEach((inter) => {
        drawPointAt(ctx, scaleX(inter[0]), scaleY(inter[1]), 5, "black");
        drawPointAt(ctx, scaleX(inter[0]), scaleY(inter[1]), 3, "white");
    });

    debugHTML += '</table>';

    debugEl.innerHTML = debugHTML;
}

const scaleX = (x) => {
    const scale = (canvas.width - 2*15) / (xMax - xMin);
    return (x - xMin) * scale + 15 /*margin*/
}

const scaleY = (y) => {
    const scale = (canvas.height - 2*15) / (yMax - yMin);
    return (y - yMin) * scale + 15 /*margin*/
}

function drawSegments(canvas, segments_) {

    xMin = Math.min(...segments_.map(([start, end]) => Math.min(start[0], end[0])));
    xMax = Math.max(...segments_.map(([start, end]) => Math.max(start[0], end[0])));
    yMin = Math.min(...segments_.map(([start, end]) => Math.min(start[1], end[1])));
    yMax = Math.max(...segments_.map(([start, end]) => Math.max(start[1], end[1])));
    //console.log("xMin:", xMin, "xMax:", xMax, "yMin:", yMin, "yMax:", yMax);

    segments_.forEach(([start, end, color]) => {
        //console.log("segment:", start, end, color)
        const startScaledX = scaleX(start[0]);
        const startScaledY = scaleY(start[1]);
        const endScaledX = scaleX(end[0]);
        const endScaledY = scaleY(end[1]);
        //console.log(">", startScaledX, startScaledY, endScaledX, endScaledY)

        // draw!
        ctx.fillStyle = color;
        ctx.fillText("<"+start[0]+", "+start[1]+">", startScaledX + 6, startScaledY - 6);
        ctx.fillText("<"+end[0]+", "+end[1]+">", endScaledX + 6, endScaledY - 6);
        drawPointAt(ctx, startScaledX, startScaledY, 5, color);
        drawPointAt(ctx, endScaledX, endScaledY, 5, color);
        drawLine(ctx, startScaledX, startScaledY, endScaledX, endScaledY, 3, color);
    });
}


/**
 * https://stackoverflow.com/a/55598451
 */
function has_intersection(segment1, segment2) {

    let intersect = false;

    const dx1 = segment1[1][0] - segment1[0][0];
    const dx2 = segment2[1][0] - segment2[0][0];
    const dy1 = segment1[1][1] - segment1[0][1];
    const dy2 = segment2[1][1] - segment2[0][1];

    const det = dx1 * dy2 - dx2 * dy1; // can be 0 if lines are parallel

    const dx3 = segment1[0][0] - segment2[0][0];
    const dy3 = segment1[0][1] - segment2[0][1];

    const det1 = dx1 * dy3 - dx3 * dy1;
    const det2 = dx2 * dy3 - dx3 * dy2;

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
        //drawPointAt(ctx, scaleX(Ix), scaleY(Iy), 5, "black");
        //drawPointAt(ctx, scaleX(Ix), scaleY(Iy), 3, "white");
    } else {
        // may intersect, but outside their segment
    }

    return intersect ? [Ix, Iy] : false;
}

/**
 * using a sweep line algorithm (not "continuously"...)
 */
function lineSegmentIntersections(segments) {

    intersections = [];
    /**
     * inserting and deleting takes O(log m) time (m=number of events in Q)
     * 
     * We do not use a heap to implement the event queue, because we have to
     * be able to test whether a given event is already present in Q. -> ?
     * 
     */

    Q = new BST(); // queue: event point (those are endpoints of the segments)
    T = new BST(); // status (start empty) -> it is the ordered (x-axis) segments intersecting the sweep line
    // -> used to access the neighbors of a given segment s, to test them for intersection with s
    // -> BST can store any set of elements (in .value), as long as their is an order on the elements (y, then x if "tie")
    // ----> "ordered in the leaves ?!?"

    // fill it with endpoints
    // TODO: order them from up-left to down-right !
    const copy = structuredClone(segments); // /!\ or else some segments disapears ?!
    copy.forEach(segment => {
        Q.insert(segment[0][1], { x: segment[0][0], y: segment[0][1], segments: [segment] }); // "starting" point
        Q.insert(segment[1][1], { x: segment[1][0], y: segment[1][1], segments: [segment] }); // "ending" point
    });

    console.log(">>> INITIAL SEGMENTS :", JSON.stringify(segments))

    let i = 0;
    while(
        ! Q.isEmpty() // still point to process ?
        && (untilStep === null || (untilStep !== null && i < untilStep)) // "step-by-step" mode
    )
    {
        processNextPoint();
        i += 1;
    }
    return intersections;
}



function processNextPoint() {

    // if same y-coordinate, take the left most (TODO ?)
    const eventPoint = Q.min(); // retrieve it in the BST, it's the highest event below the sweep line

    const p = eventPoint.value; // { x: ..., y: ..., segments: [...] }

    const x = Array.isArray(eventPoint.value.x) ? Math.min(...eventPoint.value.x) : eventPoint.value.x;
    const y = eventPoint.key; // as it is indexed by horizontal line

    handleEventPoint([x, y]);

    drawStepAtY(y); // (refresh) update sweep line, ...

    //
    // write debugging information on screen
    //
    const out = [];
    T.printInOrder(T.root, out);
    addDebug([`<b><i>Sweep line</i></b> 'status' (ordered) at y=${y}`, `${JSON.stringify(out.map(e => {
        //console.log(">", e)
        return e[1].segments.map(seg => seg[2]).join(",") + ' (' + e[0] + ')';
    }))}`]);


    // now, delete it as it now has been processed
    Q.delete(eventPoint.key);

    const out2 = [];
    Q.printInOrder(Q.root, out2);
    addDebug(['Remaining points at loop end after delete', `<mark>${Q.counter}</mark>`]);

    // separator
    addDebug(['<hr/>', ``]);
    addDebug(['<hr/>', ``]);
    addDebug(['<hr/>', ``]);
}

// redraw
function drawStepAtY(y) {
    setUpCanvas(ctx, canvas.width, canvas.height, "white")

    drawSegments(canvas, segments.slice(0));

    // draw sweep line
    drawLine(ctx, 0, scaleY(y), canvas.width, scaleY(y), 1, "black");

    // draw current intersections
    intersections.forEach((inter) => {
        ctx.font = "10px sans-serif";
        ctx.fillStyle = "black";
        ctx.fillText("<"+inter[0]+", "+inter[1]+">", scaleX(inter[0]) + 6, scaleY(inter[1]) - 6);
        drawPointAt(ctx, scaleX(inter[0]), scaleY(inter[1]), 5, "black");
        drawPointAt(ctx, scaleX(inter[0]), scaleY(inter[1]), 3, "white");
    })
}


/**
 * p = [4, 5] ?? TODO: add associated segments (2 at least...)
 */
function handleEventPoint(p)
{
    //console.log("-----------------------")

    addDebug(["Analyzing event point <b>p</b>", "x="+p.join(' y=')])

    //
    // T is ordered by x-axis value ? => order of the segments at the sweep line
    //
    const Tp = T.get(p[0]);
    const segmentsThatMayContainsP = []; // they are adjacent in T => ?
    if(Tp && Tp?.value) {
        segmentsThatMayContainsP.push(Tp.value?.segments[0]); // "value" contains only 1 segment
    } else {
        addDebug(['at exactly x='+p[0]+' no *point* was found on the sweep line ?', '-'])
    }

    let key = Tp?.key;

    // if nothing search in T ... (O(log n))
    if(segmentsThatMayContainsP.length === 0) {
        let node = T.root;
        while(node) {
            addDebug(['searching node in T, at x=' + p[0], JSON.stringify({ key: node.key, value: node.value })])
            if(p[0] > node.key) {
                if(node.right) {
                    node = node.right;
                } else {
                    break; // stop, this "current" node is the nearest ?
                }
            } else if (p[0] < node.key) {
                if(node.left) {
                    node = node.left;
                } else {
                    break; // stop
                }
            } else {
                break; // exact ?!
            }
        }


        if(node?.key) {
            addDebug(['This ?', "x=" + node.key + " / value=<span style='color: " + node.value[2] + "'>" + node.value[2] + '</span>']);
            segmentsThatMayContainsP.push(node.value?.segments[0]);
            key = node.key;
        }
    }

    addDebug(['Finding nearest (rightest if any?) x-key in sweep line T', key ?? '-']);

    let predPredKey, predKey, succKey;

    if(key) {
        succKey = T.getSuccessorOf(p[0]);
        addDebug(['succKey (of '+p[0]+')', succKey]);
        const rightSegment = succKey ? T.get(succKey) : null;
        if(rightSegment) {
            segmentsThatMayContainsP.push(rightSegment?.value?.segments[0]);
        }
    }

    if(key) {
        predKey = T.getPredecessorOf(p[0]);
        addDebug(['predKey (of y='+p[0]+')', predKey]);

        const leftSegment = predKey ? T.get(predKey) : null;
        if(leftSegment) {
            segmentsThatMayContainsP.push(leftSegment?.value?.segments[0]);
        }
    }

    if(segmentsThatMayContainsP.length <= 2 && predKey) {
        const predPredKey = T.getPredecessorOf(predKey);
        addDebug(['predPredKey (of '+predKey+')', predPredKey]);

        const leftLeftSegment = predPredKey ? T.get(predPredKey) : null;
        if(leftLeftSegment) {
            segmentsThatMayContainsP.push(leftLeftSegment?.value?.segments[0]);
        }
    }

    addDebug([`Segments (in T) that contains p(${p[0]},${p[1]}) "inside" them, are :`, segmentsThatMayContainsP]);



    const L_p = L(segmentsThatMayContainsP, p) ?? []; // as lower point
    const U_p = U(p); // get the list of segments having "p" as it upper endpoint
    const C_p = (C(segmentsThatMayContainsP, p) ?? []).filter(seg => !L_p.includes(seg)); // as a contained point..
    
    addDebug(['p is <b>Upper</b> ?', U_p]);
    addDebug(['p is <b>Lower</b> ?', L_p]);
    addDebug(['p is <b>"Center"</b> ?', C_p]); // TODO? : missing segments on the same horizontal ?! to reorder by x-key...

    const LCU_p = [...L_p, ...C_p, ...U_p];

    // if contains more than one segment -> intersection found..? (????)
    if(LCU_p.length > 1) {
        // report "p" as an intersection, together with L(p), U(p), and C(p) ...
        
        addDebug(['LCU contains more than 1 segment', LCU_p])

        /*
        intersections.push({
            type: 'what?',
            at: p,
            segments: LCU_p
        });
        */

        Q.insert(p[1], { x: p[0], y: p[1], segments: LCU_p });
    }

    //console.warn("BEFOR:", L_p, C_p);

    /**
     * Delete from the sweep if : the line is no more present below (=L_p)
     *      OR      a "center" point
     */
    [...L_p, ...C_p].forEach(segment => {
        //let key = segment[0][0]; // use its upperleft point ?!
        let test = T.get(key); // utile

        // 
        

        //const key = p[0];
        addDebug(['<mark>Deleting a <b>Lower</b> point or a <b>Center</b> point...</mark>', segment])
        addDebug(['key', key])

        //console.log("delete from T :", segment, "x-key=", key)
        
        /*
        let i = 0;
        while(!test && i < 1) { // find an other one ?!?
            test = T.getSuccessorOf(test.key);
            i += 1;
        }*/


        addDebug(['test', JSON.stringify(test)]);

        //console.error("keyyy:", key, "nb segments at this :", test?.value?.segments?.length);

        if(test?.value?.segments?.length > 1)
        {
            // Here, do NOT delete the whole segments at a "key" x-coordinate !

            test.value.segments = test.value.segments.filter(seg => seg[2] !== segment[2]); // remove the segment from the sweep line

            //
            // check intersection, here too...
            //

            // predecessor & key     /      key & successor ?
            const predKey = T.getPredecessorOf(key);
            const succKey = T.getSuccessorOf(key);

            // check for intersection (for its 2 neighbors... even if many..)

            const s_l_list = T.get(predKey)?.value?.segments;
            const s_r_list = T.get(succKey)?.value?.segments;
            const s_m_list = test?.value?.segments;

            s_l_list.forEach(s_l => {
                s_m_list.forEach(s_m => {
                    if(s_l && s_m) {
                        findNewEvent(s_l, s_m, p);
                    }
                })
            });
            s_m_list.forEach(s_m => {
                s_r_list.forEach(s_r => {
                    if(s_m && s_r) {
                        findNewEvent(s_m, s_r, p);
                    }
                })
            })
            
        } else {

            const predKey = T.getPredecessorOf(key);
            const succKey = T.getSuccessorOf(key);

            console.log("delete key", key)
            T.delete(key); // delete from the "status" T as it stops intersecting the sweep line

            // check for intersection (for its 2 neighbors)

            const s_l_list = T.get(predKey)?.value?.segments;
            const s_r_list = T.get(succKey)?.value?.segments;
            s_l_list?.forEach(s_l => {
                s_r_list?.forEach(s_r => {
                    findNewEvent(s_l, s_r, p); // even if multiple segments at pred or succ ... (?)
                })
            })
        }
    })


    // TODO: order the segment as they intersect the sweep line (x-axis)
    //
    // beware: TODO: handle the horizontal segments !
    //
    const U_union_C = [...U_p, ...C_p];
    addDebug(['p is <b>Upper</b> ∪ <b>Center</b> ?', U_union_C]);



    //T = new BST(); // erase all ?! NO!

    U_union_C.sort((a, b) => {
        // TODO: find the x -> check intersection with the sweep line (order with those "x" values ?)
        //console.warn("a:", a, "b:", b)

        // a bit below the sweep line ...
        const y = p[1] + 0.01;

        const intersectA = has_intersection([a[0], a[1]], [[0, y], [10, y]]);
        const intersectB = has_intersection([b[0], b[1]], [[0, y], [10, y]]);
        console.log("intersectA", intersectA)
        console.log("intersectB", intersectB)

        return intersectB !== false ? intersectA[0] - intersectB[0] : -1;

    }).forEach((segment, i) => {
        
        // find segments key ? by "color?!"

        const out = [];
        T.printInOrder(T.root, out);

        console.log(out)
        
        const previousKey = out?.find(a => a[1].segments.map(s => s[2]).includes(segment[2])) ?? null;
        //const previousKey = segment[0][0]; // Upper endpoint of this segment ? (or also a C_p ?)
        const key = p[0]; // at current point -> new position on the line (of this same)
        
        // TODO: if multiples ??!
        if(T.get(previousKey)) {
            T.delete(previousKey);
        }

        T.insert(key, { segments: [segment] }); // it merges if other segments are present here (at x = p[0])

        addDebug([
            `Insert a (ordered) segment in sweep line T at X=${key}`,
            `<span style="color: ${segment[2]}">${segment[2]} segment</span>`
        ]);
        // INFO: the "U_p" segment(s) are the new/arriving segments crossing the sweep line
    });





    //
    // INFO: deleting and reinserting the segments of C(p) reverses their order !!?? sure?
    //


    //console.log(">", U_union_C)


    if(U_union_C.length == 0) {

        const predKey = T.getPredecessorOf(p[0]);
        const s_l = T.get(predKey)?.value?.segments[0];    // left neighbor in T
        const s_r = T.get(T.getSuccessorOf(predKey))?.value?.segments[0];      // right neighbor in T
        //console.error("search left/right segments of p.x=", p[0], s_l, s_r)
        if(s_l && s_r) {
            findNewEvent(s_l, s_r, p);
        }

    } else {

        const s_prime = U_union_C[0]; // the leftmost segment in U(p) union C(p)      in T?
        const leftNeighKey = T.getPredecessorOf(s_prime[0][0]);
        //console.log("precessor of ", s_prime[0][0], "is leftNeighKey =", leftNeighKey);
        const s_l_list = T.get(leftNeighKey)?.value?.segments; // left neighbor of s_prime in T

        //console.log(s_prime, s_l);

        if(s_prime) {
            //console.warn("s_prime:", s_prime); // segment...
            //console.warn("s_l:", s_l)
            if(s_prime && s_l_list) {
                s_l_list.forEach(s_l => {
                    findNewEvent(s_prime, s_l, p);
                })
            }
        }

        const s_prime_prime = U_union_C[U_union_C.length - 1]; // the rightmost segment of U(p) union C(p) in T
        const rightNeighKey = T.getSuccessorOf(s_prime_prime[0][0]);
        //console.log("successor of ", s_prime_prime[0][0], "is rightNeighKey =", rightNeighKey);
        const s_r_list = T.get(rightNeighKey)?.value?.segments; // right neighbor of s_prime_prime in T

        if(s_prime_prime) {
            //console.warn("s_prime_prime:", s_prime_prime); // a segment [ptUL, ptDR, color] ??
            //console.warn("s_r:", s_r)
            s_r_list.forEach(s_r => {
                if(s_prime_prime && s_r && s_prime != s_prime_prime && !s_l_list.includes(s_r)) {
                    findNewEvent(s_prime_prime, s_r, p);
                }
            })
        }
    }












    // reorder ?!?
    
    if(T.counter) {
        console.log("-----")
        let prevElement;
        let element;

        element = T.min();

        console.log(">>>", T.counter);

        while(element?.key) {
            console.log("(next) min:", element.key);
            
            const sweepLine = [[0, p[1]], [10, p[1]]]

            for (let segment of element.value.segments) {
                const segm = [segment[0], segment[1]];
                const color = segment[2];
                console.log("intersection of", color, "with sweepline at y=", p[1])
                console.log(sweepLine);
                console.log(segm)
                const inter = has_intersection(sweepLine, segm); // eg. [4.525, 2.1]

                if(element.key !== inter[0]) {
                    console.log("move from key=", element.key, "to", round(inter[0], 2))
                    T.delete(element.key); // delete from the "status" T as it stops intersecting the sweep line
                    T.insert(round(inter[0], 2), { segments: [segment] }); // TODO: not only the first [0] ?!
                } else {
                    console.log("nothing to move")
                }
            }

            element = T.get(T.getSuccessorOf(element.key));
            if(prevElement?.key >= element.key) {
                break; // END ??!
            } else {
                console.log("next of ", prevElement?.key, "is:", element.key)
            }
            prevElement = element;
        }
    }

    const out = [];
    T.printInOrder(T.root, out);
    addDebug([
        `(after reorder) <b><i>Sweep line</i></b> 'status' (ordered) at y=${p[1]}`,
        `${JSON.stringify(out.map(e => {
            //console.log(">", e)
            return e[1].segments.map(seg => seg[2]).join(",") + ' (' + JSON.stringify(e[0]) + ')';
        }))}`
    ]);
    


/*
    let element = T.min();
    while(element?.key) {
        

        el = T.get(T.getSuccessorOf(element.key));
        if(el.key <= element.key) {
            break; // END ?
        }
    }
*/



}


function findNewEvent(s_l, s_r, p) {
    /**
     * INTERSECTION TEST : check if 2 segments intersect
     */

    //console.warn("search intersection of:", s_l, "and", s_r)
    const intersect = has_intersection(s_l, s_r);
    
    // check if s_l & s_r intersect below the sweep line (or to the right of p, if horizontal)
    if(intersect != false) {
        if(intersect[1] > p[1]) { // if below the line ? TODO: Check
            // insert the "intersection point" as event point (in Q)

            //console.warn(`NEW INTERSECTION POINT at x:${intersect[0]}, y:${intersect[1]}`)

            Q.insert(intersect[1], { x: round(intersect[0], 2), y: round(intersect[1], 2), segments: [s_l, s_r] });

            debugHTML += `<tr><td><mark>New intersection</mark></td><td>${round(intersect[0], 2)}, ${round(intersect[1], 2)}</td></tr>`;

            // save it...?
            intersections.push({
                type: 'intersection',
                at: intersect,
                segments: [s_l, s_r]
            });
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
    const eventPoint = Q.get(p[1]); // O(log n) ?
    //console.error("segs:", eventPoint?.value.segments);
    return eventPoint?.value.segments.filter(seg => p[0] == seg[0][0] && p[1] == seg[0][1]);
}

function isInsideSegment(pt, linePt1, linePt2) {

    const isCollinear = (pt, linePt1, linePt2) => {
        const v1 = (pt[1] - linePt1[1]) * (linePt2[0] - linePt1[0]);
        const v2 = (linePt2[1] - linePt1[1]) * (pt[0] - linePt1[0]);
        const value = Math.round(v1 * 1000) / 1000 === Math.round(v2 * 1000) / 1000;
        //console.log("isCollinear:", pt, linePt1, linePt2, "->", v1, v2, value);
        return value;
    };

    const isWithinBounds = (pt, linePt1, linePt2) => Math.min(linePt1[0], linePt2[0]) <= pt[0]
        && Math.max(linePt1[0], linePt2[0]) >= pt[0]
        && Math.min(linePt1[1], linePt2[1]) <= pt[1]
        && Math.max(linePt1[1], linePt2[1]) >= pt[1]

    return isCollinear(pt, linePt1, linePt2) && isWithinBounds(pt, linePt1, linePt2);
}

function L(segs, p) {
    console.log("L: segs=", segs, p)
    return segs?.filter(segment => p[0] === segment[1][0] && p[1] === segment[1][1])
}
// segments that contains p in their interior
function C(segs, p) {
    //console.log("C: segs=", segs, p)
    return segs?.filter(segment => {
        const isInside = isInsideSegment(p, segment[0], segment[1]);
        //console.log(p, segment[2], isInside);
        return isInside;
    })
}

function addDebug(arr) {
    if(showDebug) {
        debugHTML += '<tr><td>' + arr.join('</td><td>') + '</td></tr>';
    }
}


main();
