import { randInt, choice } from '../common/common.helper.js';
import { round } from '../common/math.helper.js';

function main() {
    //document.querySelector("#refresh").addEventListener('click', (e) => redraw());

    redraw();
}

const vertexCode = `
attribute vec2 aCRSCoords;
attribute vec2 aExtrudeCoords;
uniform mat4 uTransformMatrix;
uniform vec2 uPixelSize;

attribute float size;
attribute float color;
varying float vColor;

// A "varying" is a value that passes from the vertex shader to the frag shader.
// In this case, we want the interpolated extrude coords.
varying vec2 vExtrudeCoords;

void main(void) {
	// Copy the input extrude coords to the varying
    vExtrudeCoords = aExtrudeCoords;

    // Let the frag shader know about the other attribute
    vColor = color;

	gl_Position =
		uTransformMatrix * vec4(aCRSCoords, 1.0, 1.0) +
		vec4(aExtrudeCoords * uPixelSize * size, 0.0, 0.0);
}
`;

const fragCode = `
// All the varyings and variables in the vertex shader should be "high" (24 bit) precision
precision highp float;

varying float vColor;

// Get the varying from the vertex shader
varying vec2 vExtrudeCoords;

void main(void) {
	// Calculate the (square) distance to the marker's
	// center
	float radiusSquared =
    	vExtrudeCoords.x * vExtrudeCoords.x +
        vExtrudeCoords.y * vExtrudeCoords.y;

	// Make the pixel opaque only if inside the circle
    if (radiusSquared <= 1.0) {
        if(vColor == 1.0) {
    		gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        } else if (vColor == 2.0) {
            gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
        } else if (vColor == 3.0) {
            gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
        }
    } else {
		gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
}
`;

let map;
const center = [48.866, 2.333];

function redraw() {
    map = L.map('map').setView(center, 13);

    console.log("map:", map)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);


    function createGroup() {
        return new L.GLMarkerGroup({
            // The "attributes" option lets you write "attribute float megacity",
            // "attribute float rank_min", etc in your vertex shader.
            // These attributes will be populated with the values in each GLMarker.
            attributes: ['color', 'size'],
            
            // The "texture" option lets you use up to 8 images as textures.
            // In this example, we'll have an image of a kitten in the first 
            // texture, which has to be referred to as "uniform Sampler2D uTexture0"
            // in the fragment shader.
            textures: [], //'http://placekitten.com/g/128/128'],
            
            // And the GLMarkerGroup needs the vertex and fragment shaders
            // code as strigns.
            vertexShader: vertexCode,
            fragmentShader: fragCode
        }).addTo(map);
    }

    const t0 = window.performance.now();

    const NB_MARKERS = 100_000; // 500_000 -> 311 ms ?

    const MARKER_PER_GROUP = 10_000;
    const glMarkerGroups = [];

    for(let i = 0; i < NB_MARKERS; i++) {

        if (i % MARKER_PER_GROUP === 0) {
            console.log("create new !")
            // every SIZE marker -> add a new WebGL marker group layer
            glMarkerGroups.push(createGroup());
        }  

        const [latitude, longitude] = [
            center[0] + randInt(-3000, 3000)/100000,
            center[1] + randInt(-6000, 6000)/100000
        ];
        glMarkerGroups[glMarkerGroups.length - 1].addMarker(new L.GLMarker(
            [latitude, longitude],
            {
                color: choice([1, 2, 3]), // Only 3 choices
                size: choice([5, 7, 9]),
            }
        ));
    }
    const t1 = window.performance.now();

    console.log("number of glMarkerGroups:", glMarkerGroups.length);

    document.getElementById('number_of_markers').innerText = NB_MARKERS + ' markers inserted in ' + round(t1 - t0, 2) + ' ms.';

}

main();
