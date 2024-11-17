
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const filterDescEl = document.getElementById("filter_desc");
const filterEl = document.getElementById("filter_name");

const standardFilters = {
    'Identity kernel': {
        desc: 'no change',
        type: 'identity',
        values: [
            [0, 0, 0],
            [0, 1, 0],
            [0, 0, 0]
        ]
    },
    'GaussianBlur (3x3)': {
        desc: 'to blur an image',
        values: [
            [1 / 16, 2 / 16, 1 / 16],
            [2 / 16, 4 / 16, 2 / 16],
            [1 / 16, 2 / 16, 1 / 16]
        ]
    },
    'Sharpen': {
        desc: 'to sharpen an image',
        values: [
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0]
        ]
    },
    'Sobel operator (1968)': {
        desc: 'a discrete differential operator for edge detection',
        type: 'Sobel',
        values: [[
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1]
        ],[
            [-1, -2, -1],
            [0, 0, 0],
            [1, 2, 1]
        ]]
    },
    'Laplacian 3x3': {
        desc: 'approximation for edge detection',
        values: [
            [-1, -1, -1],
            [-1, 8, -1],
            [-1, -1, -1]
        ]
    },
    'LoG 9x9 (Laplacian of Gaussian)': {
        desc: 'for edge detection',
        type: 'LoG',
        greyscale: true,
        values: [
            [0, 1, 1, 2, 2, 2, 1, 1, 0],
            [1, 2, 4, 5, 5, 5, 4, 2, 1],
            [1, 4, 5, 3, 0, 3, 5, 4, 1],
            [2, 5, 3, -12, -24, -12, 3, 5, 2],
            [2, 5, 0, -24, -40, -24, 0, 5, 2],
            [2, 5, 3, -12, -24, -12, 3, 5, 2],
            [1, 4, 5, 3, 0, 3, 5, 4, 1],
            [1, 2, 4, 5, 5, 5, 4, 2, 1],
            [0, 1, 1, 2, 2, 2, 1, 1, 0]
        ]
    },
};

const defaultFilterName = 'Identity kernel';
let loadedImageData;

function main() {
    document.querySelector("#loadRandom").addEventListener('click', (e) => apply());

    // fill filter list
    Object.keys(standardFilters).forEach(filterName => {
        filterEl.insertAdjacentHTML('beforeend', `<option value="${filterName}" ${filterName === defaultFilterName ?' selected':''}>${filterName}</option>`);
    });

    filterEl.addEventListener('change', (e) => {
        const filter = loadFilter(e.target.value); // in user interface

        // change visible desc
        filterDescEl.innerHTML = filter?.desc;

        applyFilter(filter, loadedImageData);
    })

    apply();
}

async function apply() {
    const response = await fetch("https://dog.ceo/api/breeds/image/random");
    const imageUrl = (await response.json())?.message;
    const image = loadImageFromUrl(ctx, imageUrl);
}



function loadImageFromUrl(ctx, url) {
    const image = new Image();
    image.src = url;
    // to prevent :
    // Uncaught SecurityError: Failed to execute 'getImageData' on 'CanvasRenderingContext2D':
    //      The canvas has been tainted by cross-origin data.
    image.crossOrigin = "Anonymous";
    image.onload = function(e){
        //console.log("e:", e)

        if(image.width > 650) {
            console.error("Too large image, retrying with an other one !");
            apply(); // retry...
        } else {
            // resize canvas to image
            canvas.width = image.width;
            canvas.height = image.height;
    
            ctx.drawImage(image, 0, 0);
            loadedImageData = ctx.getImageData(0, 0, image.width, image.height)

            // Sobel, Sharpen, ...
            const filterName = document.querySelector("#filter_name").value;
            const filter = loadFilter(filterName); // in user interface
            applyFilter(filter, loadedImageData);
        }
    }
    return image;
}

function loadFilter(filterName) {
    return standardFilters[filterName];
}

function applyFilter(filter, imageData) {

    console.log("(applyFilter) filter=", filter)

    const filterValues = filter.values;

    // new empty image data
    const data = new Uint8ClampedArray(canvas.width * canvas.height * 4);

    for(let h = 0; h < canvas.height; h++) {
        for(let w = 0; w < canvas.width; w++) {

            // current pixel
            const idx = h * canvas.width + w;
            const offset = idx * 4;
            
            let red = 0, green = 0, blue = 0;

            if(filter.type == 'Sobel')
            {

                const leftIdx = h * canvas.width + w - 1;
                const leftOffset = leftIdx * 4;
                const rightIdx = h * canvas.width + w + 1;
                const rightOffset = leftIdx * 4;
                
                const upIdx = (h - 1) * canvas.width + w;
                const upOffset = upIdx * 4;
                const downIdx = (h + 1) * canvas.width + w;
                const downOffset = downIdx * 4;

                const leftUpIdx = (h - 1) * canvas.width + w - 1;
                const leftUpOffset = leftUpIdx * 4;
                const rightUpIdx = (h - 1) * canvas.width + w + 1;
                const rightUpOffset = rightUpIdx * 4;
                
                const leftDownIdx = (h + 1) * canvas.width + w - 1;
                const leftDownOffset = leftDownIdx * 4;
                const rightDownIdx = (h + 1) * canvas.width + w + 1;
                const rightDownOffset = rightDownIdx * 4;
                
                //
                // Gx
                //
                const redX = imageData.data[leftUpOffset] * filterValues[0][0][0] + imageData.data[upOffset] * filterValues[0][0][1] + imageData.data[rightUpOffset] * filterValues[0][0][2] + 
                            imageData.data[leftOffset] * filterValues[0][1][0] + imageData.data[offset] * filterValues[0][1][1] + imageData.data[rightOffset] * filterValues[0][1][2] + 
                            imageData.data[leftDownOffset] * filterValues[0][2][0] + imageData.data[downOffset] * filterValues[0][2][1] + imageData.data[rightDownOffset] * filterValues[0][2][2];

                const greenX = imageData.data[leftUpOffset + 1] * filterValues[0][0][0] + imageData.data[upOffset + 1] * filterValues[0][0][1] + imageData.data[rightUpOffset + 1] * filterValues[0][0][2] + 
                            imageData.data[leftOffset + 1] * filterValues[0][1][0] + imageData.data[offset + 1] * filterValues[0][1][1] + imageData.data[rightOffset + 1] * filterValues[0][1][2] + 
                            imageData.data[leftDownOffset + 1] * filterValues[0][2][0] + imageData.data[downOffset + 1] * filterValues[0][2][1] + imageData.data[rightDownOffset + 1] * filterValues[0][2][2];

                const blueX = imageData.data[leftUpOffset + 2] * filterValues[0][0][0] + imageData.data[upOffset + 2] * filterValues[0][0][1] + imageData.data[rightUpOffset + 2] * filterValues[0][0][2] + 
                            imageData.data[leftOffset + 2] * filterValues[0][1][0] + imageData.data[offset + 2] * filterValues[0][1][1] + imageData.data[rightOffset + 2] * filterValues[0][1][2] + 
                            imageData.data[leftDownOffset + 2] * filterValues[0][2][0] + imageData.data[downOffset + 2] * filterValues[0][2][1] + imageData.data[rightDownOffset + 2] * filterValues[0][2][2];
                //
                // Gy
                //
                const redY = imageData.data[leftUpOffset] * filterValues[1][0][0] + imageData.data[upOffset] * filterValues[1][0][1] + imageData.data[rightUpOffset] * filterValues[1][0][2] + 
                            imageData.data[leftOffset] * filterValues[1][1][0] + imageData.data[offset] * filterValues[1][1][1] + imageData.data[rightOffset] * filterValues[1][1][2] + 
                            imageData.data[leftDownOffset] * filterValues[1][2][0] + imageData.data[downOffset] * filterValues[1][2][1] + imageData.data[rightDownOffset] * filterValues[1][2][2];

                const greenY = imageData.data[leftUpOffset + 1] * filterValues[1][0][0] + imageData.data[upOffset + 1] * filterValues[1][0][1] + imageData.data[rightUpOffset + 1] * filterValues[1][0][2] + 
                            imageData.data[leftOffset + 1] * filterValues[1][1][0] + imageData.data[offset + 1] * filterValues[1][1][1] + imageData.data[rightOffset + 1] * filterValues[1][1][2] + 
                            imageData.data[leftDownOffset + 1] * filterValues[1][2][0] + imageData.data[downOffset + 1] * filterValues[1][2][1] + imageData.data[rightDownOffset + 1] * filterValues[1][2][2];

                const blueY = imageData.data[leftUpOffset + 2] * filterValues[1][0][0] + imageData.data[upOffset + 2] * filterValues[1][0][1] + imageData.data[rightUpOffset + 2] * filterValues[1][0][2] + 
                            imageData.data[leftOffset + 2] * filterValues[1][1][0] + imageData.data[offset + 2] * filterValues[1][1][1] + imageData.data[rightOffset + 2] * filterValues[1][1][2] + 
                            imageData.data[leftDownOffset + 2] * filterValues[1][2][0] + imageData.data[downOffset + 2] * filterValues[1][2][1] + imageData.data[rightDownOffset + 2] * filterValues[1][2][2];

                red = Math.sqrt(redX*redX + redY*redY);
                green = Math.sqrt(greenX*greenX + greenY*greenY);
                blue = Math.sqrt(blueX*blueX + blueY*blueY);

            } else {
            
                const filterSize = filter.values[0].length;

                for(let i = -Math.floor(filterSize / 2); i < filterSize / 2; i++) { // vertically
                    for(let j = -Math.floor(filterSize / 2); j < filterSize / 2; j++) { // horizontally
                        const idx_ = (h + i) * canvas.width + (w + j);
                        const offset_ = idx_ * 4;
                        if(idx_ >= 0 && idx_ < canvas.width * canvas.height) {

                            if(filter.greyscale) {
                                const grey = imageData.data[offset_] * 0.299 + imageData.data[offset_ + 1] * 0.587 + imageData.data[offset_ + 2] * 0.114;
                                red += grey * filterValues[i+Math.floor(filterSize/2)][j+Math.floor(filterSize/2)];
                                green += grey * filterValues[i+Math.floor(filterSize/2)][j+Math.floor(filterSize/2)];
                                blue += grey * filterValues[i+Math.floor(filterSize/2)][j+Math.floor(filterSize/2)];
                            } else {
                                red += imageData.data[offset_] * filterValues[i+Math.floor(filterSize/2)][j+Math.floor(filterSize/2)];
                                green += imageData.data[offset_ + 1] * filterValues[i+Math.floor(filterSize/2)][j+Math.floor(filterSize/2)];
                                blue += imageData.data[offset_ + 2] * filterValues[i+Math.floor(filterSize/2)][j+Math.floor(filterSize/2)];
                            }    
                            
                        }
                    }
                }

            }

            data[offset] = red;
            data[offset + 1] = green;
            data[offset + 2] = blue;
            data[offset + 3] = 255; // alpha/opacity
        }
    }

    const imageData2 = new ImageData(data, canvas.width, canvas.height);
    
    ctx.putImageData(imageData2, 0, 0); // replace with modified image
}

main();
