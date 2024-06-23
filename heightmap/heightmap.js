
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';
import { normalize, round } from '../common/math.helper.js';




const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

let WORLD_HEIGHTMAP_FILE = './world-heightmap.png'; // 1920 x 1118 (same for UK.png)

let heightmap,
    normalMap,
    intervalId,
    stopAnimation,
    MOUSE_X,
    MOUSE_Y;

function main() {
    document.querySelector("#show_heightmap").addEventListener('click', (e) => loadHeightMap());
    document.querySelector("#animate").addEventListener('click', (e) => computeMaps());
    document.querySelector("#select_map").addEventListener('change', (e) => {
        WORLD_HEIGHTMAP_FILE = './' + e.target.value + '.png';
        loadHeightMap();
    })
    canvas.addEventListener('mousemove', (e) => {
        MOUSE_X = 2 * (e.offsetX - canvas.width / 2) / canvas.width;
        MOUSE_Y = 2 * (e.offsetY - canvas.height / 2) / canvas.height;
    })
    
    canvas.addEventListener('mouseout', (e) => {
        MOUSE_X = null;
        MOUSE_Y = null;
    })
    

    window.onload = function(e) {
        loadHeightMap();
    }
}

function loadHeightMap() {

    stopAnimation = true; // will show the heightmap only

    const image = new Image();
    image.src = WORLD_HEIGHTMAP_FILE;

    // when file loaded -> put it in its own temporary canvas
    image.onload = function(e) {

        const heightMapCanvas = document.createElement('canvas');
        const hmCtx = heightMapCanvas.getContext('2d');

        // resize to its full size
        heightMapCanvas.width = image.width;
        heightMapCanvas.height = image.height;

        //console.log("image:", image); // <img .../>
        hmCtx.drawImage(image, 0, 0, image.width, image.height);
        heightmap = hmCtx.getImageData(0, 0, image.width, image.height); // store it globally (ready to pursue "computeMaps")
        //console.log("heightmap:", heightmap);
        /*
            ImageData {
                data: Uint8ClampedArray(8 547 840),
                width: 1920,
                height: 1113,
                colorSpace: 'srgb'
            }
        */

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height); // auto resized
    }
}

let iter = 0;

/**
 * compute normal map + light illumination
 */
function computeMaps()
{
    if(false) {
        clearInterval(intervalId); // if any
    }

    if (! heightmap) return; // if heightmap is loaded
        
    // 
    // Compute normal map
    // 

    //console.log("heightmap:", heightmap);
    
    const normalData = computeNormals(heightmap);
    //console.log("normalData:", normalData); // Uint8ClampedArray

    normalMap = new ImageData(normalData, heightmap.width, heightmap.height);
    //ctx.putImageData(normalMap, 0, 0); // show normal map

    if(false) {
        intervalId = setInterval(fn, 250);
    } else {
        stopAnimation = false;
        fn();
    }
}

function fn() {
    // 
    // black if both negative ?! or both 0 ??
    // 
    const xDir = MOUSE_X === null ?
        Math.sin(Math.PI * iter + Math.PI / 4) * 0.5 + 0.5
        : MOUSE_X; // PI/4 so not both are sometimes at 0 (black view)
    const yDir = MOUSE_Y === null ?
        Math.cos(2 * Math.PI * iter) * 0.5 + 0.5
        : MOUSE_Y;
    const zDir = 1;
    //console.log("light direction :", [xDir, yDir, zDir]); // TODO : understand this !!

    const xy = normalize([
        xDir,
        yDir,
        zDir
    ]);

    const lightDir = [
        xy[0],
        xy[1],
        //zDir
        xy[2]
    ];
    //console.log("Normalized light direction :", lightDir)

    document.querySelector("#lightDirX").innerText = round(lightDir[0], 2);
    document.querySelector("#lightDirY").innerText = round(lightDir[1], 2);
    document.querySelector("#lightDirZ").innerText = round(lightDir[2], 2);

    const timeIt = false;
    let t0, t1;
    if(timeIt) {
        t0 = window.performance.now();
    }
    computeImage(lightDir);
    if(timeIt) {
        const t1 = window.performance.now();
        console.warn(`time taken : ${t1 - t0} ms.`)
    }

    iter += 0.05;

    if(!stopAnimation) {
        requestAnimationFrame(fn);
    }
}

const groundColor = [61, 203, 49]

function computeImage(lightDir) {

    // new empty image data
    const data = new Uint8ClampedArray(heightmap.width * heightmap.height * 4);

    for (let h = 0; h < heightmap.height; h++) {
        for (let w = 0; w < heightmap.width; w++) {

            // current pixel
            const idx = h * heightmap.width + w;
            const offset = idx * 4;

            const norm_x = normalMap.data[offset];
            const norm_y = normalMap.data[offset + 1];
            const norm_z = normalMap.data[offset + 2];

            const min = 0; // ??
            const dotProduct = norm_x * lightDir[0] + norm_y * lightDir[1]; // + norm_z * lightDir[2];
            const brightness = Math.max(min, dotProduct) / 255; // from "min" to 1

            //console.log(brightness);

            const multiplyBy = 50; // ??

            const offsetBy = 0;

            data[offset] = groundColor[0] * brightness * multiplyBy - min + offsetBy;
            data[offset + 1] = groundColor[1] * brightness * multiplyBy - min + offsetBy;
            data[offset + 2] = groundColor[2] * brightness * multiplyBy - min + offsetBy;
            data[offset + 3] = 255; // no change... TODO: do not use alpha

        }
    }

    const map = new ImageData(data, heightmap.width, heightmap.height);

    const dataCanvas = document.createElement('canvas');
    const dataCtx = dataCanvas.getContext('2d');

    // resize
    dataCanvas.width = heightmap.width;
    dataCanvas.height = heightmap.height;

    dataCtx.putImageData(map, 0, 0);

    const imageObject = new Image();
    imageObject.onload = function() {
        const ratio = heightmap.height / heightmap.width;
        const width = canvas.width;
        const height = canvas.width * ratio;
        const scale = heightmap.width / canvas.width;

        // ???
        canvas.height = height;

        // show world map with its light illumination
        //console.log(`convert resolution (decreased by ${scale}) from ${heightmap.width} x ${heightmap.height} to ${width} x ${height}, keep aspect ratio to ${ratio}`)

        //ctx.scale(1 / scale, 1 / scale);
        ctx.drawImage(imageObject, 0, 0, width, height); // conserve ratio
    }
    imageObject.src = dataCanvas.toDataURL();
}


function computeNormals(heightmap) {

    const width = heightmap.width;
    const height = heightmap.height;
    
    // new empty image data
    const normalData = new Uint8ClampedArray(width * height * 4);

    for (let h = 0; h < height; h++) {
        for (let w = 0; w < width; w++) {

            // current pixel
            const idx = h * width + w;
            const offset = idx * 4;

            const leftIdx = h * width + w - 1;
            const leftOffset = leftIdx * 4;
            const rightIdx = h * width + w + 1;
            const rightOffset = rightIdx * 4;

            const upIdx = (h - 1) * width + w;
            const upOffset = upIdx * 4;
            const downIdx = (h + 1) * width + w;
            const downOffset = downIdx * 4;

            //let diffX = heightmap.data[offset] - heightmap.data[leftOffset];
            let diffX = heightmap.data[rightOffset] - heightmap.data[leftOffset];
            //let diffY = heightmap.data[offset] - heightmap.data[upOffset];
            let diffY = heightmap.data[upOffset] - heightmap.data[downOffset];

            const diffZ = 255;

            const length = Math.sqrt(diffX*diffX + diffY*diffY + diffZ*diffZ);

            diffX = Math.round(diffX / length * 255);
            diffY = Math.round(diffY / length * 255);

            normalData[offset] = diffX; // norm x
            normalData[offset + 1] = diffY; // norm y
            normalData[offset + 2] = 255; // nothing... (=> blueish image)
            normalData[offset + 3] = 255; // no change... TODO: optimize to not use alpha channel (always 1)
        }
    }

    return normalData;
}

main();
