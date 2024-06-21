
/*
- given an edge : query neighboring faces ...etc (adjacency informations)
	- https://en.wikipedia.org/wiki/Winged_edge
	- https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/model/winged-e.html
*/

class Face {
	constructor(name) {
    this.edge = null;
		this.name = name;
  }
}

class Vertex {
	constructor(letter, position) {
    this.letter = letter; // A, B, C, ...
    this.position = position; // [x, y, ...]
    this.edge = null;
  }
}

class Edge {
	constructor(src, dest) {
		// Vertex
    this.src = src;
    this.dest = dest;
    // 2 Faces
		this.left = null;
    this.right = null;
		// 4 Edges
    this.left_cw = null;
    this.left_ccw = null;
    this.right_cw = null;
    this.right_ccw = null;
  }
}


/**
 * triangles in Clock-Wise order
 */
export function createWingedEdge(points, triangles) {
	
	const vertexes = {};
	const edges = {};
	const faces = {};
	
	triangles.forEach(triangle => {
		
		for (let i = 0; i < 3; i++) {
			const letter1 = triangle[i];
			const letter2 = triangle[(i + 1) % 3];
    	const letter3 = triangle[(i + 2) % 3];
		
			const v1 = vertexes[letter1] || new Vertex(letter1, points[letter1]);
			const v2 = vertexes[letter2] || new Vertex(letter2, points[letter2]);
			const v3 = vertexes[letter3] || new Vertex(letter3, points[letter3]);

			vertexes[letter1] = v1;
			vertexes[letter2] = v2;
			vertexes[letter3] = v3;

			// create edges between 2 adjacent triangle points
			const edge1Name = letter1 + letter2;
			const edge2Name = letter2 + letter3;
			const edge3Name = letter3 + letter1;

			if (!edges[edge1Name]) {
				edges[edge1Name] = new Edge(v1, v2);
			}

			if (!edges[edge2Name]) {
				edges[edge2Name] = new Edge(v2, v3);
			}

			if (!edges[edge3Name]) {
				edges[edge3Name] = new Edge(v3, v1);
			}

			// Create faces and set edge references
			const currentEdge1 = edges[edge1Name];
			const currentEdge2 = edges[edge2Name];
			const currentEdge3 = edges[edge3Name];

			const face = new Face(triangle);
			face.edge = currentEdge1;

			if (currentEdge1.left === null) {
				currentEdge1.left = face;
				currentEdge2.right_cw = currentEdge3;
				currentEdge2.right_ccw = currentEdge1;
				currentEdge3.right_cw = currentEdge1;
				currentEdge3.right_ccw = currentEdge2;
			} else {
				currentEdge1.right = face;
				currentEdge2.left_ccw = currentEdge3;
				currentEdge2.left_cw = currentEdge1;
				currentEdge3.left_ccw = currentEdge2;
				currentEdge3.left_cw = currentEdge1;
			}

			// Set the CCW (counterclockwise) and CW (clockwise) edge references for each edge
			currentEdge1.left_ccw = currentEdge3;
			currentEdge1.left_cw = currentEdge2;

			currentEdge2.left_ccw = currentEdge1;
			currentEdge2.left_cw = currentEdge3;

			currentEdge3.left_ccw = currentEdge2;
			currentEdge3.left_cw = currentEdge1;


			if (!v1.edge) {
				v1.edge = currentEdge1;
			}
			if (!v2.edge) {
				v2.edge = currentEdge2;
			}
			if (!v3.edge) {
				v3.edge = currentEdge3;
			}
		};
	});
	
	return {
		// 
		findFaces(edgeName) {
			const inverse = edgeName.split("").reverse().join('');
			const edge = edges[edgeName];
			const edge2 = edges[inverse];
      if (edge || edge2) {
        return [edge?.left ?? edge2?.right, edge?.right ?? edge2?.left];
      } else {
        return [];
      }
		}
	}	
}

