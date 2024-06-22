
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const heightmapResizeToWidth = 750;
let heightmap,
    normalMap;

function main() {
    document.querySelector("#refresh").addEventListener('click', (e) => redraw());
    window.onload = function(e) {
        loadHeightMap();
    }
}

function redraw() {
    if (heightmap) {
        //console.log(heightmap);

        // 
        // Compute normal map
        // 
        const normalData = computeNormals(heightmap);

        normalMap = new ImageData(normalData, canvas.width, canvas.height);
        //ctx.putImageData(normalMap, 0, 0); // show normal map


        function normalize(vec) {
            const length = Math.sqrt(vec.map(v => v*v).reduce((partialSum, a) => partialSum + a, 0));
            return vec.map(v => v / length);
        }




        //let iter = 0;
        //setInterval(() => {
                
            // 
            // 
            // 
            const lightDir = normalize([
                0.5, //Math.sin(2 * Math.PI * iter) / 10, // x dir
                0.5, //Math.cos(4 * Math.PI * iter) / 10, // y dir
                1
            ]);
            //console.log("Normalized light direction :", lightDir)


            // new empty image data
            const data = new Uint8ClampedArray(canvas.width * canvas.height * 4);

            for (let h = 0; h < canvas.height; h++) {
                for (let w = 0; w < canvas.width; w++) {

                    // current pixel
                    const idx = h * canvas.width + w;
                    const offset = idx * 4;

                    const norm_x = normalMap.data[offset];
                    const norm_y = normalMap.data[offset + 1];

                    const dotProduct = norm_x * lightDir[0] + norm_y * lightDir[1];
                    const brightness = Math.max(0, dotProduct) / 255;

                    //if(brightness == 0) {
                    //    data[offset] = 0;
                    //    data[offset + 1] = 0;
                    //    data[offset + 2] = 255;
                    //} else {
                        data[offset] = 136 * brightness;
                        data[offset + 1] = 199 * brightness;
                        data[offset + 2] = 153 * brightness;
                    //}
                    data[offset + 3] = 255; // no change... TODO: do not use alpha
                }
            }


            const map = new ImageData(data, canvas.width, canvas.height);
            ctx.putImageData(map, 0, 0); // show normal map

            //iter++;

        //}, 100);

    }
}

function computeNormals(heightmap) {
    
    // new empty image data
    const normalData = new Uint8ClampedArray(canvas.width * canvas.height * 4);

    for (let h = 0; h < canvas.height; h++) {
        for (let w = 0; w < canvas.width; w++) {

            // current pixel
            const idx = h * canvas.width + w;
            const offset = idx * 4;

            const leftIdx = h * canvas.width + w - 1;
            const leftOffset = leftIdx * 4;
            const rightIdx = h * canvas.width + w + 1;
            const rightOffset = rightIdx * 4;

            const upIdx = (h - 1) * canvas.width + w;
            const upOffset = upIdx * 4;
            const downIdx = (h + 1) * canvas.width + w;
            const downOffset = downIdx * 4;

            //let diffX = heightmap.data[offset] - heightmap.data[leftOffset];
            let diffX = heightmap.data[rightOffset] - heightmap.data[leftOffset];
            //let diffY = heightmap.data[offset] - heightmap.data[upOffset];
            let diffY = heightmap.data[upOffset] - heightmap.data[downOffset];

            const length = Math.sqrt(diffX*diffX + diffY*diffY);

            diffX = Math.round(diffX / length * 255);
            diffY = Math.round(diffY / length * 255);

            normalData[offset] = diffX; // norm x
            normalData[offset + 1] = diffY; // norm y
            normalData[offset + 2] = 255; // nothing... (=> blueish image)
            normalData[offset + 3] = 255; // no change... TODO: do not use alpha
        }
    }

    return normalData;
}

function loadHeightMap() {
    const image = new Image();
    image.src = './world-heightmap.png';
    image.onload = function(e) {
        // resize
        canvas.width = heightmapResizeToWidth;
        canvas.height = heightmapResizeToWidth * image.height / image.width; // conserve ratio

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        heightmap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
}

main();
