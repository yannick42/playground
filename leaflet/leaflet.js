import { randFloat, randInt, choice } from '../common/common.helper.js';
import { round } from '../common/math.helper.js';
import KDBush from 'https://cdn.jsdelivr.net/npm/kdbush/+esm';



/*

draw clusters above ?


*/






//const mapEl = document.getElementById("map");
const debugEl = document.getElementById("debug");
const percInputEl = document.getElementById("perc_input");
const percEl = document.getElementById("perc");

let PERC = 0.2,
    markersClusterGroup;

function main() {
    //document.querySelector("#refresh").addEventListener('click', (e) => redraw());

    percInputEl.addEventListener('change', (e) => {
        PERC = e.target.value;
        percEl.innerText = round(PERC * 100) + "% of points at the same position";
        redraw();
    });

    percEl.innerText = round(PERC * 100) + "% of points at the same position"; // init.

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

attribute vec2 a_texcoord;
varying vec2 v_texcoord;

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


// Passed in from the vertex shader.
varying vec2 v_texcoord;
uniform sampler2D u_texture;

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

        if (radiusSquared <= 0.4) {
            if(vColor == 1.0) { // green
                gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
            } else if (vColor == 2.0) { // orange
                gl_FragColor = vec4(1.0, 0.647, 0.0, 1.0);
            } else if (vColor == 3.0) { // red
                gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
            } else if (vColor == 4.0) { // grey
                gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
            }
        }
        else // outline
        {
            if(vColor == 1.0) { // darkgreen
                gl_FragColor = vec4(0.0, 0.392, 0.0, 1.0);
            } else if (vColor == 2.0) { // darkorange
                gl_FragColor = vec4(1.0, 0.55, 0.0, 1.0);
            } else if (vColor == 3.0) { // darkred
                gl_FragColor = vec4(0.545, 0.0, 0.0, 1.0);
            } else if (vColor == 4.0) { // darkgrey
                gl_FragColor = vec4(0.25, 0.25, 0.25, 1.0);
            }
        }
    } else {
		gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
}
`;

const NB_MARKERS = 20_000; // 500_000 -> 311 ms ?

const MARKER_PER_GROUP = 10_000;

let map;
const center = [45.75, 4.85];
let nbMarkersAtSamePosition = 0;
let glMarkerGroups = [];
let index;

const markerPositions = [];
function createMarkerPositions() {
    for(let i = 0; i < NB_MARKERS; i++) {
        let latitude, longitude;
        if(markerPositions.length && Math.random() < PERC) {
            // reuse an older one to have them grouped
            [latitude, longitude] = markerPositions[randInt(0, markerPositions.length - 1)];
        } else {
            latitude = center[0] + randFloat(-8/100, 8/100);
            longitude = center[1] + randFloat(-10/100, 10/100);
        }

        const color = choice([1, 2, 3, 4]); // green < orange < red < grey

        markerPositions.push([latitude, longitude, color]);

        // add a point in the spatial index
        index.add(latitude, longitude);
    }
}

function createGLMarkers(markerPositions) {

    glMarkerGroups.forEach(glGroup => glGroup.remove());

    glMarkerGroups = []; // reinit.
    
    markerPositions.forEach(([latitude, longitude], i) => {

        // create new group ?
        if (i % MARKER_PER_GROUP === 0) {
            // every SIZE marker -> add a new WebGL marker group layer
            glMarkerGroups.push(createGroup());
        }  

        const neighbors = index.within(latitude, longitude, 0);

        const colorMax = Math.max(...neighbors.map(i => markerPositions[i][2]));

        glMarkerGroups[glMarkerGroups.length - 1].addMarker(new L.GLMarker(
            [latitude, longitude],
            {
                color: colorMax,
                size: neighbors.length > 1 ? 9 : 5,
            }
        ));
    });
}

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


function getNeighborSize(currentZoom) {
    // 13 -> 0.00055
    // 19 -> 0.000022
    const slope = (0.00055 - 0.000022) / (13 - 19);
    return (currentZoom - 19) * slope + 0.000022;
}


function redraw() {

    index = null; // important ?!
    index = new KDBush(NB_MARKERS); // init kd-tree index
    console.log(index)

    debugEl.innerHTML = '';
    nbMarkersAtSamePosition = 0;

    if(!map) {
        map = L.map('map').setView(center, 13);
    } else {
        console.info("map already initialized")
    }
    console.log("map:", map);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    createMarkerPositions()

    let t0 = window.performance.now();
    // perform the indexing
    index.finish();
    document.getElementById('number_of_markers').innerHTML = "Kd-tree indexation in <b>" + round(window.performance.now() - t0, 1) + " ms.</b> (to speed up point search, when clicking a GlMarker to show a tooltip)";

    t0 = window.performance.now();
    createGLMarkers(markerPositions);
    let t1 = window.performance.now();

    console.log("number of glMarkerGroups:", glMarkerGroups.length);

    document.getElementById('number_of_markers').innerHTML += `<br/><b>${NB_MARKERS}</b> markers inserted in <b>${round(t1 - t0, 2)} ms.</b>`;


    // create text texture.
    // +2 shaders needed ?!
    /*
    glMarkerGroups.forEach(grp => {

        // Puts text in center of canvas.
        function makeTextCanvas(text, width, height) {
            textCtx.canvas.width  = width;
            textCtx.canvas.height = height;
            textCtx.font = "20px monospace";
            textCtx.textAlign = "center";
            textCtx.textBaseline = "middle";
            textCtx.fillStyle = "black";
            textCtx.clearRect(0, 0, textCtx.canvas.width, textCtx.canvas.height);
            textCtx.fillText(text, width / 2, height / 2);
            return textCtx.canvas;
        }

        const gl = grp.getGlContext();
        
        var textCtx = document.createElement("canvas").getContext("2d");
        var textCanvas = makeTextCanvas("Hello!", 100, 26);
        var textWidth  = textCanvas.width;
        var textHeight = textCanvas.height;
        var textTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, textTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
        // make sure we can render it even if it's not a power of 2
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);  
    })
    */
    


    markersClusterGroup?.getLayers().forEach((layer, index) => {
        /*if(index == 0) {
            console.log(layer);
        }*/
        markersClusterGroup.removeLayer(layer);
        layer.remove();
    });

    markersClusterGroup = L.markerClusterGroup({
        //spiderfyOnMaxZoom: true, // default
        maxClusterRadius: 1,
        showCoverageOnHover: false,
        removeOutsideVisibleBounds: true, // for performance
        spiderLegPolylineOptions: { weight: 1.5, color: '#222', opacity: 1 },
        iconCreateFunction: function(cluster) {
            return L.divIcon({ html: '' });
            /*
            <div style="width: 10px; height: 16px; text-align: center; transform: translate(-2px, -2px); border-radius: 8px; padding: 0px 3px; background-color: lime; font-weight: bold; margin: 0;"> '
                + cluster.getChildCount()
            + ' </div>' });
            */
        },
        spiderfyShapePositions: function(count, centerPt) {
            var distanceFromCenter = 35,
                markerDistance = 45,
                lineLength = markerDistance * (count - 1),
                lineStart = centerPt.y - lineLength / 2,
                res = [],
                i;

            res.length = count;

            for (i = count - 1; i >= 0; i--) {
                res[i] = new Point(centerPt.x + distanceFromCenter, lineStart + markerDistance * i);
            }

            return res;
        },
        chunkedLoading: true,
    });
    // if points are exactly at the same spot
    markerPositions.forEach(([latitude, longitude, color], i) => {
        const neighborIds = index.within(latitude, longitude, 0 /* same position */);
        const count = neighborIds.length;
        
        if(count > 1) { // if markers are on top of one another -> add to a cluster
            const colors = {
                'green': 'darkgreen',
                'orange': 'darkorange',
                'red': 'darkred',
                'grey': 'darkgrey',
            };
            const fillColor = Object.keys(colors)[color-1];
            const marker = L.circleMarker([latitude, longitude], {
                radius: 5,
                color: colors[fillColor],
                fill: true,
                fillOpacity: 1,
                fillColor,
            });
            markersClusterGroup.addLayer(marker); // add it to the cluster

            marker.bindPopup('<b>id:</b> : ' + i);

            nbMarkersAtSamePosition += 1;
        }
    });
    map.addLayer(markersClusterGroup);

    console.warn(markersClusterGroup);

    let numberOfClusters = 0;
    let c = 0;
    map.eachLayer(layer => {
        if(layer.getChildCount) {
            /*console.log(layer)
            console.log(layer._childClusters?.length)        
            console.log(layer._childCount);*/
            c += layer._childCount;
            numberOfClusters++;
        }
    });

    console.assert(c === nbMarkersAtSamePosition);
  
    debugEl.innerHTML += `<ul>
        <li>Number of points in the same place : <b>${nbMarkersAtSamePosition}</b> (${round(nbMarkersAtSamePosition/NB_MARKERS*100, 0)}%)</li>
        <li>Number of glMarkerGroups : <b>${glMarkerGroups.length}</b></li>
        <li>Number of clusters : <b>${numberOfClusters}</b> (with mean nb of point = ${round(nbMarkersAtSamePosition/numberOfClusters, 2)})</li>
    </ul>`;

    let tooltip; // unique tooltip
   
    /*
    map.on('zoom', (event) => {
        console.log("e:", event);
        console.log("zoom=", event.target.getZoom())
    })
    */

    //
    // Open a tooltip if necessary
    //
    map.on('click', (e) => {
        const currentZoom = e.target.getZoom();

        // radius query
        const neighborIds = index.within(e.latlng.lat, e.latlng.lng, getNeighborSize(currentZoom));
        //console.log("neighborIds:", neighborIds);

        const first = markerPositions[neighborIds[0]]

        if(first) {
            const [lat, lng, colorIndex] = first;
            if(neighborIds.length > 0) {
                tooltip = L.popup()
                    .setLatLng(L.latLng(lat, lng))
                    .setContent('<b>id</b> : ' + neighborIds.join(", "))
                    .addTo(map);
            }
        }
    });

    map.on('mousemove', (e) => {
        const nbMarkersHovered = index.within(e.latlng.lat, e.latlng.lng, getNeighborSize(e.target.getZoom())).length;
        if(nbMarkersHovered > 0) {
            map.getContainer().style.cursor = 'pointer';
        } else {
            map.getContainer().style.cursor = 'default';
        }
    });
    map.on('mouseout', (e) => map.getContainer().style.cursor = 'default');

    markersClusterGroup.on('click', function (event) {
        console.log('cluster group click event:', event);
    });
    
    markersClusterGroup.on('clusterclick', function (event) {
        // a.layer is actually a cluster
        console.log('Number of points in that cluster:', event.layer.getAllChildMarkers().length);
    });

}

main();
