/**
 * Source:
 * - Mark de Berg, Computational Geometry (2008)
 * - https://ti.inf.ethz.ch/ew/lehre/CG12/lecture/Chapter%205.pdf
 * - ?
 */

export class DCEL {

    vertices = [];
    faces = [];
    halfEdges = []; // used ?

    faceCounter = 0; // if no face name is given

    addVertex(value = {}) {
        const v = new Vertex();     // no initialization ? (half-edge, ...)
        v.value = value;            // additional information to the vertex (eg. A, B, ...)
        v.dcelRef = this;           // useful... to have a reference to this DCEL object
        this.vertices.push(v);      // store it there
        return v;
    }

    addFace(name) {
        const f = new Face(name ?? `Face ${this.faceCounter++}`);
        this.faces.push(f);         // store it there
        return f;
    }

    addHalfEdge(u, v) {
        const h = new HalfEdge(u, v)
        this.halfEdges.push(h);     // stored here
        return h;
    }

    joinFaces(f1, f2) {
        // TODO
        throw "Not implemented";
    }
}



export class HalfEdge {

    origin;
    target;
    name; // eg. "A->B"

    //
    // filled by "addVertexAt" & "splitFace"
    //
    face; // incident face, CCW=Counterclockwise (so this face is at the left of this edge)
    twin; // opposite half edge
    next; // next in the face
    prev; // previous in the face

    constructor(originVertex, targetVertex) {
        //console.log("creating an HALFEDGE between vertices:", originVertex.value, "and", targetVertex.value)
        this.origin = originVertex;
        this.target = targetVertex;
        this.name = `${originVertex.value.name}->${targetVertex.value.name}`;
    }

    splitEdge(newVertex) {
        // TODO
        throw "Not implemented";
    }
}

export class Vertex {

    dcelRef;

    halfEdge; // arbitrary half-edge ?
    value = {}; // stored vertex informations

    constructor(x, y, halfEdge = null) {
        this.halfEdge = halfEdge;
    }

    /* // TODO
    toString() {
        return `Vertex: value=${this.value}`
    }
    */




    /**
     * v = the new vertex to be "linked" to this one
     * h = incident halfedge to this vertex "u" (in the same face as this new "v")
     */
    addVertexAt(v, h) {
        const h1 = this.dcelRef.addHalfEdge(this, v); // from:   this vertex    to:   new
        const h2 = this.dcelRef.addHalfEdge(v, this); // from:   new            to:   this vertex

        // indicent edge to v ?
        v.halfEdge = h1; // v is a "new vertex" __without any previous information__
        // if h2 -> bug...?


        if(this.dcelRef.vertices.length > 1) {
            console.assert(h?.next, "h.next should not be null now!", h)
        }


        // both are opposite of each other...
        h1.twin = h2;
        h2.twin = h1;
        // their endpoints :
        h1.target = v;
        h2.target = this; // this existing vertex in the DCEL

        if(h?.face) { // if any ?!
            h1.face = h.face;
            h2.face = h.face;
        } else {
            console.warn("no face information to copy from, in given (incident to 'u') halfedge 'h' ?!")
        }




        h1.next = h2; // link "next" to opposite too

        if(h?.next) { // if existing edge was connected to a "next" edge -> use it as the next of h2
            h2.next = h.next;
        } else {
            console.warn("no next on this halfedge ?!", h)
        }
        

        h1.prev = h; // h becomes prev of (new edge to v) : h1
        h2.prev = h1; // link h1 and h2

        if(h) { // h = null, only on first added vertex ?
            h.next = h1; // modify current edge's next edge
            console.log("updating h.next to new h1", h1)
        }
        console.log(">>>>>", h2, h2.next)

        if(h2.next) {
            h2.next.prev = h2; // TODO at 2nd added vertex -> is it done OK?
        } else {
            console.error("no h2.next")
        }

        return this;
    }








    /**
     * h = incident halfedge to this vertex ? (but why not use this.halfEdge => it's an arbitrary one ? not just the one we need)
     * v = 
     */
    splitFace(h, v) {

        console.log("incident edge h (to u) :", h.name, h)
        console.log("target vertex v:", v.value.name, v)

        // pre-conditions
        //      - "v" is incident to f
        const f = h.face;

        const halfEdgesTraversed = f.traverse();
        console.log("traversed:", halfEdgesTraversed)
        if(!halfEdgesTraversed.includes(h)) {
            throw `${v.value.name} is not in this face (${f.name})!`;
        }

        //      - and NOT adjacent to "u" (this vertex object)
        const u = h.target;
        console.table(u);



        // create the new faces
        const f1 = this.dcelRef.addFace();
        const f2 = this.dcelRef.addFace();

        //  & halfedges
        const h1 = this.dcelRef.addHalfEdge(this, v);
        const h2 = this.dcelRef.addHalfEdge(v, this);
        console.warn("(splitFace) -> 2 new halfedges h1:", h1, "h2:", h2);

        f1.halfEdge = h1;
        f2.halfEdge = h2;

        h1.twin = h2;
        h2.twin = h1;

        // NOT DESCRIBED IN ALGO ?! automatic ?
        //h1.origin = u;
        //h2.origin = v;
        // WHY ?
        //h1.target = v;  // : as the constructor above already set it to v ...
        //h2.target = u;  // and this to this vertex = u (this) ...
        
        //console.log("updating h2.next with the next of", h.name, "which is named", h.next.name, ":", h.next)
        h2.next = h.next; // to link h2 and h.next (see Figure 5.4)

        //h2.next = structuredClone(h.next); // loop forever !

        if(h2.next) {
            //console.log("updating h2.next.prev which was:", h2.next?.prev?.name, "with h2=", h2.name)
            h2.next.prev = h2; // modify it also in h2...
        } else {
            console.error("no h.next here ?")
        }

        h1.prev = h; // 
        h.next = h1;



        console.log(">>>>>>>>>>>", h2, h2.next)





        //
        // Update the face information of all incident halfedges
        //   (not O(1), complexity proportional to the size of f)
        //
        let h_ = h2;
        let iter = 0;
        while(true && iter < 15) {
            iter++;

            console.error(h_)
            h_.face = f2;

            console.log(h_.target.value.name, v.value.name)
            if(/*h_.target == v ||*/ h_.target.value.name === v.value.name) { // stop if looped
                break;
            }

            if(h_.next == null) {
                console.error(`no 'next' halfedge for this ${h_.name} edge :`, h_)
                break;
            }

            h_ = h_.next; // continue with next one
        }
        console.error("number of iterations (=nb of halfEdges) to update face information about f2 :", iter)
        console.error("h_=", h_)

        /**
         * for vertices : "A->B->C->D" then a split with D->A add (F1="Face 2" is outside/left ? only one?! because here h_=B->A next is null !!!!)
         * "Face 3" is inside
         * 
         * loop (above) start at h2 (newly created from v to u (=A->D)) starting with the edge "h.next" (A->D then D->C, C->B, B->A)
         * 
         * but at B->A their is no link to the "new D" between A & D
         *         B -> A was add in the first steps with A->B (its twin)
         * 
         */
        if(h_.next) { // cannot be null !!
            console.error(h_.next)
            h1.next = h_.next;
            h1.next.prev = h1; // ...?
        } else {
            console.error("no h_.next !!");
        }

        h_.next = h2;
        if(h_) {
            h2.prev = h_;
        } else {
            console.error("no h_");
        }





        // start again in the other direction (=other "contiguous" face)
        h_ = h1;
        iter = 0;
        do {
            iter++;
            
            console.log(`current h_ ${h_.name} target.name: ${h_.target.value.name} u.name: ${u.value.name}`)
            h_.face = f1; // update face information (for this new face, too)
            console.log("info face:", f1)

            if(h_.next) {
                console.log("updating halfedge", h_.name, "to", h_.next.name)
                h_ = h_.next;
            } else {
                console.error("(while updating F1 new face info. into halfedges): h_", h_, "has no next")
                break; // STOP !
            }
        } while(h_.target.value.name == u.value.name && iter < 10); // for all ?

        console.error("number of iterations to update face informations about F1 :", iter);







        console.log("f:", f);
        if(f) { // add halfedges have a ref to the 2 new faces (no more f, so we delete it from the array...)
            const faceIndex = this.dcelRef.faces.indexOf(f);
            if(faceIndex !== - 1) {
                this.dcelRef.faces.splice(faceIndex, 1);

                /* // filter... (same bug)
                this.dcelRef.faces = this.dcelRef.faces.filter((face, index) => {
                    console.log(face, index, faceIndex)
                    return index !== faceIndex;
                });
                */

                console.error(this.dcelRef.faces.length);
                console.log("face " + f.name + " removed !")
            } else {
                console.error("face '" + f.name + "' not found !")
            }
            h.face = f1; // ???
            console.log("????", h.face); // remove face from the given "h" ?!
            // delete f; // Uncaught SyntaxError: Delete of an unqualified identifier in strict mode.
        }
    }


}






export class Face {
    halfEdge; // arbitrary half-edge of this face
    name;
    constructor(name = null) {
        this.name = name;
    }

    traverse() { // counterclockwise
        const s = this.halfEdge; // starting from the "representative" arbitrary face halfEdge
        let h = s;
        const halfEdges = []; // vertices traversed
        console.groupCollapsed("traverse")
        console.warn("traversing face CCW? using .next on each halfedges on the path")
        do {
            console.log(`Current h in face ${this.name} from ${h.origin.value.name} to ${h.target.value.name}`, h);
            
            halfEdges.push(h);

            if(h.next == null) {
                console.error("What?! The LOOP breaks, as this face has one of its halfedge without a 'next' halfedge attached !?", )
                break;
            } else {
                h = h.next; // go to next one !
            }
        } while(h !== s); // until we are back to the beginning (= an arbitrary halfEdge for this face)
        console.groupEnd("traverse")
        return halfEdges;
    }
}
