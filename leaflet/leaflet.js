import { randFloat, randInt, choice } from '../_common/common.helper.js';
import { round } from '../_common/math.helper.js';
import { RGBToHSL } from '../_common/color.js';
import KDBush from 'https://cdn.jsdelivr.net/npm/kdbush/+esm';

/*

- use web worker to speed things up at startup : show a progress bar ...
    * https://richorama.github.io/2018/08/22/rendering-leaflet-tiles-in-the-browser/


- inside a perfect "circle" around Lyon ...
- use a Poisson disk distribution ?


- draw clusters above ? (=last, or on an other group layer ?)

*/


const mapEl = document.getElementById("map"); // div container
const debugEl = document.getElementById("debug");
const percInputEl = document.getElementById("perc_input");
const percEl = document.getElementById("perc");
const skipWaterEl = document.getElementById("skip_water");

const NB_MARKERS = 15_000; // 500_000 -> 311 ms ?

const MARKER_PER_GROUP = 10_000;

let SKIPWATER = true;

let map;
//const center = [45.75, 4.85]; // Lyon
const center = [48.8666, 2.3333]; // Paris
let nbMarkersAtSamePosition = 0;
let glMarkerGroups = [];
let index;

let defaultZoom = 12;

let markerPositions = [];



let tooltip; // unique tooltip
let PERC = 0.15,
    markersClusterGroup;

function main() {
    //document.querySelector("#refresh").addEventListener('click', (e) => redraw());

    percInputEl.addEventListener('change', (e) => {
        PERC = e.target.value;
        percEl.innerText = round(PERC * 100) + "% of points at the same position";
        redraw();
    });

    skipWaterEl.addEventListener('change', (e) => {
        SKIPWATER = e.target.value;
        redraw();
    })

    percEl.innerText = round(PERC * 100) + "% of points at the same position"; // init.
    skipWaterEl.checked = SKIPWATER;

    redraw();
}

const canvases = {};

function getColorHueAt(lat, lng) {

    //console.log("map:", map, "tile layer:", tileLayer);

    var layerPoint = map.project(new L.latLng(lat, lng)).floor();
    var tilePoint = layerPoint.divideBy(256).floor();

    const key = tilePoint.x + ':' + tilePoint.y + ':' + defaultZoom;
    //console.log(key);
    var block = tileLayer._tiles[key]?.el;

    if(!block) return;
    
    var pointInTile = layerPoint.subtract(tilePoint.multiplyBy(256));

    // read in the image
    let canvas;
    if(! canvases[key]) {
        canvas = document.createElement('canvas');
        canvas.width = block.width;
        canvas.height = block.height;
        canvas.getContext('2d').drawImage(block, 0, 0, block.width, block.height);
        canvases[key] = canvas;
    } else {
        canvas = canvases[key];
    }
    
    // get the color
    var rgba = canvas.getContext('2d').getImageData(pointInTile.x, pointInTile.y, 1, 1).data;

    const HSL = RGBToHSL(rgba[0], rgba[1], rgba[2]);
    return HSL;
}


function createMarkerPositions() {
    markerPositions = [];
    for(let i = 0; i < NB_MARKERS; i++)
    {
        let latitude, longitude,
            color = choice([1, 2, 3, 4]), // green < orange < red < grey
            hsl,
                hue,
                saturation,
                lightness;
        
        if(markerPositions.length && Math.random() < PERC) {
            // reuse an older one to have them grouped
            [latitude, longitude, , ] = markerPositions[randInt(0, markerPositions.length - 1)];
        } else {

            let i = 0;
            do {
                
                latitude = center[0] + randFloat(-8/100, 8/100); // bounding box
                longitude = center[1] + randFloat(-7/100, 7/100); // 

                hsl = getColorHueAt(latitude, longitude);

                if(hsl?.length) {
                    [hue, saturation, lightness] = hsl;
                }

                i++
            } while(
                (
                    Math.sqrt(Math.pow(latitude-center[0], 2) + Math.pow(longitude-center[1], 2)) > 0.052
                    ||
                    (i < 10 && (SKIPWATER && (hue < 240 && hue > 150 /*water*/) || !hsl))
                )
            );

        }

        markerPositions.push([latitude, longitude, color, [hue, saturation, lightness]]);

        // add a point in the spatial index
        index.add(latitude, longitude);
    }
}

async function createGLMarkers(markerPositions) {

    glMarkerGroups.forEach(glGroup => glGroup.remove());
    glMarkerGroups = []; // reinit.
    
    for await (let [i, marker] of markerPositions.entries()) {

        let [latitude, longitude] = marker;

        let group;
        // create new group ?
        if (i % MARKER_PER_GROUP === 0) {
            // every SIZE marker -> add a new WebGL marker group layer
            group = await createGroup();
            glMarkerGroups.push(group);
        } else {
            group = glMarkerGroups[glMarkerGroups.length - 1];
        }

        const neighbors = index.within(latitude, longitude, 0);

        const colorMax = Math.max(...neighbors.map(i => markerPositions[i][2])); // use "worst" color !

        group.addMarker(
            new L.GLMarker(
                [latitude, longitude],
                {
                    color: colorMax,
                    size: neighbors.length > 1 ? 9 : 5,
                }
            )
        );
    };
}

async function createGroup() {

    const vertexCode = await (await fetch("./shaders/vertex-shader.glsl")).text();
    const fragCode = await (await fetch("./shaders/fragment-shader.glsl")).text();

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

let tileLayer;
var canvas = document.createElement('canvas');
canvas.width = 256;
canvas.height = 256;
var ctx = canvas.getContext('2d');


function addEvents () {

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
            const [lat, lng, colorIndex, tileColor] = first;
            if(neighborIds.length > 0) {
                tooltip = L.popup()
                    .setLatLng(L.latLng(lat, lng))
                    .setContent(`
                        <b>id</b> : ${neighborIds.join(", ")}<br/>
                        ${neighborIds.length == 1 ? `
                        <b style="color: hsl(${tileColor[0]}deg 100% 50%);">pixel hue at initial zoom=${defaultZoom}</b>: ${tileColor[0]}<br/>
                        <b style="color: hsl(${tileColor[0]}deg ${tileColor[1]}% 50%);">Pixel saturation</b>: ${tileColor[1]}<br/>
                        <b style="color: hsl(${tileColor[0]}deg ${tileColor[1]}% ${tileColor[2]}%);">Pixel lightness</b>: ${tileColor[2]}<br/>
                        ` : ''}
                    `)
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


let loaded = false;





function redraw() {
    loaded = false;

    index = null; // important ?
    index = new KDBush(NB_MARKERS); // init kd-tree index
    console.log(index)

    debugEl.innerHTML = '';
    nbMarkersAtSamePosition = 0;

    if(!map) {
        map = L.map('map').setView(center, defaultZoom);
    } else {
        console.info("map already initialized")
    }
    console.log("map:", map);

    const t = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        options: {
            id: 'TileLayer'
        },
        crossOrigin: true,
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });
    t.addTo(map);

    console.log("t:", t)
    t.on('load', async function(e) {

        if(!loaded) {
            console.warn("start!")
            await start();
            addEvents();

            loaded = true;
        }
    
    });
    

    map.eachLayer( function(layer) {
        if( layer instanceof L.TileLayer ) {
            console.log("found TileLayer:", layer)
            tileLayer = layer;
        }
    });
    
}


async function start() {

    console.time("createMarkerPositions")
    createMarkerPositions();
    console.timeEnd("createMarkerPositions")

    let t0 = window.performance.now();
    // perform the indexing
    index.finish();
    document.getElementById('number_of_markers').innerHTML = `
        <a href="https://en.wikipedia.org/wiki/K-d_tree">Kd-tree</a> indexation in <b> ${round(window.performance.now() - t0, 1)} ms.</b> (to speed up point search, when clicking a GlMarker to show a tooltip or on mouse over)
    `;
    console.log("1");

    t0 = window.performance.now();
    await createGLMarkers(markerPositions);
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
        id: 'markerCluster',
        //spiderfyOnMaxZoom: true, // default
        maxClusterRadius: 1,
        showCoverageOnHover: false,
        removeOutsideVisibleBounds: true, // for performance
        spiderLegPolylineOptions: { weight: 1.5, color: '#222', opacity: 1 },
        iconCreateFunction: function(cluster) {
            return L.divIcon({ html: '' }); // important for speed !
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
                options: {
                    type: 'test'
                }
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
        if(layer instanceof L.MarkerCluster) {
            c += layer._childCount;
            numberOfClusters++;
        }
    });

    console.assert(c === nbMarkersAtSamePosition, c, "and", nbMarkersAtSamePosition);
  
    debugEl.innerHTML += `<ul>
        <li>Number of points at the same place : <b>${nbMarkersAtSamePosition}</b> (${round(nbMarkersAtSamePosition/NB_MARKERS*100, 0)}%)</li>
        <li>Number of glMarkerGroups : <b>${glMarkerGroups.length}</b></li>
        <li>Number of clusters : <b>${numberOfClusters}</b> (with mean nb of point = ${round(nbMarkersAtSamePosition/numberOfClusters, 2)})</li>
    </ul>`;

}

main();
