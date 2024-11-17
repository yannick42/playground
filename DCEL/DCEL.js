
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';
import { computeBézierCurve, distance } from '../common/math.helper.js';

import { DCEL, Face } from '../common/dcel.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const debugEl = document.getElementById("debug");

let dcel;

let hoveredVertex;
let selectedVertex;

function main() {
    document.querySelector("#refresh").addEventListener('click', (e) => redraw());

    canvas.addEventListener('mousemove', (e) => {
        if(!selectedVertex) {
            redraw();
        }
        dcel.vertices.forEach(vertex => {
            if(!selectedVertex && isWithinRangeOf([vertex.value.x, vertex.value.y], e.offsetX, e.offsetY, 10)) {
                drawPointAt(ctx, vertex.value.x, vertex.value.y, 10, "red");
                hoveredVertex = vertex;
                noHover = false;
            }
        });
    });

    canvas.addEventListener('click', (e) => {
        if(hoveredVertex && isWithinRangeOf([hoveredVertex.value.x, hoveredVertex.value.y], e.offsetX, e.offsetY, 10)) {
            redraw();
            if(selectedVertex !== hoveredVertex) {
                selectedVertex = hoveredVertex;
                drawPointAt(ctx, selectedVertex.value.x, selectedVertex.value.y, 10, "green");
            } else {
                selectedVertex = null;
            }

            
        } else { // click elsewhere -> stop ?
            selectedVertex = null;
            hoveredVertex = null;
            redraw();
        }
    })




    dcel = new DCEL();

    const dummyFace = dcel.addFace("dummy");

    // create 3 vertices
    const v1 = dcel.addVertex({ name: "A", x: 150, y: 150 });
    const v2 = dcel.addVertex({ name: "B", x: 350, y: 150 });
    const v3 = dcel.addVertex({ name: "C", x: 350, y: 350 });
    const v4 = dcel.addVertex({ name: "D", x: 150, y: 350 });

    console.groupCollapsed("add B")
    v1.addVertexAt(v2, null) // no halfEdge at first !!
    console.groupEnd("add B")

    // HACKS
        // ?
    //v2.halfEdge.face = dummyFace;

        // to get the A->B halfedge created by the line above (creation of A->B/B->A)
    v1.halfEdge = v2.halfEdge.twin; // .next => B->A / .prev = null / twin = A->B

    v1.halfEdge.face = dummyFace;
    v1.halfEdge.prev = v2.halfEdge; // the B->A too
    v1.halfEdge.next = v2.halfEdge;
    
    v2.halfEdge.next = v1.halfEdge; // set it now
    v2.halfEdge.face = dummyFace;

    //console.error(">>>>", v2?.halfEdge.name, v2?.halfEdge.next.name, v2?.halfEdge.next.prev.name) // B->A, A->B, B->A
    
        // use arbitrary one ?
    dummyFace.halfEdge = v2.halfEdge;

    //printHE(v1.halfEdge);
    //printHE(v2.halfEdge);


    
    // should be true
    console.assert(v1.halfEdge.twin === v2.halfEdge); // for now...?
    console.assert(v1.halfEdge.face !== v2.halfEdge.face); // should it really be true ?? as it's CCW and only 1 segment -> no inside/outside?!

    //console.log("v1:", v1, "v2:", v2);

    

    console.groupCollapsed("add C")
    v2.addVertexAt(v3, v2.halfEdge); // start to create an other vertex for the triangle
    console.groupEnd("add C")


    //printHE(v2.halfEdge); // B->A, stays the same as before... -> OK?
    //printHE(v2.halfEdge.next); // B->C
    //printHE(v3.halfEdge); // C->B

    console.groupCollapsed("add D")
    v3.addVertexAt(v4, v3.halfEdge);
    console.groupEnd("add D")


    //v4.addVertexAt(v1, v4.halfEdge); // close the loop ... ?!

    
    console.groupCollapsed("splitFace")
    //console.info("split 'dummy' face, adding an edge (v3 <-> v1)")
    v4.splitFace(v4.halfEdge, v1); // close this face with an edge between D and A
    console.groupEnd("splitFace")



    
    console.groupCollapsed("splitFace")
    //console.info("split 'dummy' face, adding an edge (v3 <-> v1)")
    v4.splitFace(v4.halfEdge, v2); // close this face with an edge between D and A
    console.groupEnd("splitFace")









    redraw();
}

function printHE(he) {
    console.log('-------------------')
    console.log("NAME:", he.name, he)
    console.log("twin half-edge = ", he.twin.name, he.twin)
    console.log("PREV =", he.prev?.name, he.prev)
    console.log("NEXT =", he.next?.name, he.next)
    console.log('-------------------')
}


function isWithinRangeOf(point, x, y, byHowManyPixels) {
    return distance(point[0], point[1], x, y) <= byHowManyPixels;
}

function redraw() {
    // show it on canvas
    console.groupCollapsed("drawing")
    drawDCEL(dcel);
    console.groupEnd("drawing")
}






const colors = ['midnightblue', 'steelblue', 'royalblue'];

function drawDCEL(dcel) {
    console.log(dcel)
    
    setUpCanvas(ctx, 500, 500, 'whitesmoke')
    
    dcel.faces.forEach((face, i) => {

        console.error("Draw FACE:", face.name, face)
        const halfEdges = face.traverse();
        console.error("having those halfEdges:", halfEdges)

        halfEdges.forEach((he, index) => {
            const originValue = he.origin.value;
            const targetValue = he.target.value;

            console.log("drawing an half-edge between:", he.origin.value, "and", he.target.value)

            const minPerc = 50;
            const perc = 100 - minPerc - Math.round(index / (halfEdges.length - 1) * (100 - minPerc)) + minPerc;
            //console.warn("perc:", perc, index, halfEdges.length);
            const color = `color-mix(in srgb, ${colors[i%colors.length]} ${perc}%, transparent)`;
            //drawArrow(ctx, originValue.x, originValue.y, targetValue.x, targetValue.y, color, 2, 5)


            const amplitude = 8 * i;
            const rand = amplitude; //randInt(-amplitude, amplitude);
            const arrows = [
                [originValue.x, originValue.y, originValue.x-rand, originValue.y-rand],
                [targetValue.x, targetValue.y, targetValue.x-rand, targetValue.y-rand]
            ];
            const curvePoints = computeBézierCurve(ctx, [[originValue.x, originValue.y], [targetValue.x, targetValue.y]], arrows, 1/25);
    
            // draw curve
            const nbCurvePoints = curvePoints.length;
            curvePoints.forEach((point, j) => {
                if(j + 1 === nbCurvePoints) return; // last point
                drawLine(ctx, point[0], point[1], curvePoints[j+1][0], curvePoints[j+1][1], 2*(i+1), color);
            });
            
            // final end : arrow
            drawArrow(ctx, curvePoints[nbCurvePoints-2][0], curvePoints[nbCurvePoints-2][1], curvePoints[nbCurvePoints-1][0], curvePoints[nbCurvePoints-1][1], color, 2 /*width*/, /*head_len*/ 10);
    


            // draw its twin ? TODO: use Bézier curve ?
            // drawArrow(ctx, he.twin.origin.value.x, originValue.y, targetValue.x, targetValue.y, 'lightblue', 2, 5)

        })
    });

    dcel.vertices.forEach(vertex => {
        console.log(vertex)
        const x = vertex.value.x;
        const y = vertex.value.y;
        drawPointAt(ctx, x, y, 5, "red")
		ctx.font = "bold 15px monospace";
        ctx.fillText(vertex.value.name, x + 8, y - 8)
    });

    debugEl.innerHTML = `
        Number of vertices : <b>${dcel.vertices.length}</b> <br/>
        Number of faces : <b>${dcel.faces.length}</b> <br/>
        Number of half-edges : <b>${dcel.halfEdges.length}</b> <br/>
    `;

}

main();
