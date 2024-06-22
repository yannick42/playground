
import { setUpCanvas, drawPointAt, drawArrow, drawLine } from '../common/canvas.helper.js';
import { randInt } from '../common/common.helper.js';

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const standardFilters = {
    'Identity kernel': {
        desc: 'no change',
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
    'Sobel (unfinished)': {
        desc: 'for edge detection',
        values: [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1]
        ]
    }
};

const defaultFilterName = 'Identity kernel';
let loadedImageData;

function main() {
    document.querySelector("#apply").addEventListener('click', (e) => apply());

    const filterEl = document.querySelector("#filterName");
    // fill filter list
    Object.keys(standardFilters).forEach(filterName => {
        filterEl.insertAdjacentHTML('beforeend', `<option value="${filterName}" ${filterName === defaultFilterName ?' selected':''}>${filterName}</option>`);
    });

    filterEl.addEventListener('change', (e) => {
        const filter = loadFilter(e.target.value); // in user interface
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
            const filterName = document.querySelector("#filterName").value;
            const filter = loadFilter(filterName); // in user interface
            applyFilter(filter, loadedImageData);
        }
    }
    return image;
}

function loadFilter(filterName) {
    const values = standardFilters[filterName]?.values;

    // TODO :
    // fill table (possibly adapt its size !!!)
    return values;
}

function applyFilter(filter, imageData) {

    console.log("filter:", filter)

    // new empty image data
    const data = new Uint8ClampedArray(canvas.width * canvas.height * 4);

    for(let h = 0; h < canvas.height; h++) {
        for(let w = 0; w < canvas.width; w++) {

            // current pixel
            const idx = h * canvas.width + w;
            const offset = idx * 4;
            
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
            
            const red = imageData.data[leftUpOffset] * filter[0][0] + imageData.data[upOffset] * filter[0][1] + imageData.data[rightUpOffset] * filter[0][2] + 
                        imageData.data[leftOffset] * filter[1][0] + imageData.data[offset] * filter[1][1] + imageData.data[rightOffset] * filter[1][2] + 
                        imageData.data[leftDownOffset] * filter[2][0] + imageData.data[downOffset] * filter[2][1] + imageData.data[rightDownOffset] * filter[2][2];

            const green = imageData.data[leftUpOffset + 1] * filter[0][0] + imageData.data[upOffset + 1] * filter[0][1] + imageData.data[rightUpOffset + 1] * filter[0][2] + 
                        imageData.data[leftOffset + 1] * filter[1][0] + imageData.data[offset + 1] * filter[1][1] + imageData.data[rightOffset + 1] * filter[1][2] + 
                        imageData.data[leftDownOffset + 1] * filter[2][0] + imageData.data[downOffset + 1] * filter[2][1] + imageData.data[rightDownOffset + 1] * filter[2][2];

            const blue = imageData.data[leftUpOffset + 2] * filter[0][0] + imageData.data[upOffset + 2] * filter[0][1] + imageData.data[rightUpOffset + 2] * filter[0][2] + 
                        imageData.data[leftOffset + 2] * filter[1][0] + imageData.data[offset + 2] * filter[1][1] + imageData.data[rightOffset + 2] * filter[1][2] + 
                        imageData.data[leftDownOffset + 2] * filter[2][0] + imageData.data[downOffset + 2] * filter[2][1] + imageData.data[rightDownOffset + 2] * filter[2][2];

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
