
import { Color, hslColorToRgb, hueToRgb, transitionOfHueRange } from './color.js';

// /!\ not too big !
const CANVAS_WIDTH = 400,
			CANVAS_HEIGHT = 400;
let C = 1;

const schemaIndexSelect = document.querySelector("#schemaIndex");
const upButton = document.querySelector("#button-up");
const downButton = document.querySelector("#button-down");
const leftButton = document.querySelector("#button-left");
const rightButton = document.querySelector("#button-right");
const zoomOutButton = document.querySelector("#zoom-out");

const schemas = ['ABBACC', 'AB', 'BABAAAA', 'BBBCCAABBABBC', 'BBBBBBAAAAAA']; // 'BBBBBBAAAAAA' ?
let schema = schemaIndexSelect.value;
const schemaSize = schemas[schema].length;

const resolution = 1;


schemaIndexSelect.addEventListener('change', (evt) => {
	schema = evt.target.value;
	init();
});

leftButton.addEventListener('click', (evt) => {
	const shift = (end_B - start_B) / 2;
	start_A -= shift;
	end_A -= shift;
	init();
});

rightButton.addEventListener('click', (evt) => {
	const shift = (end_B - start_B) / 2;
	start_A += shift;
	end_A += shift;
	init();
});

upButton.addEventListener('click', (evt) => {
	const shift = (end_B - start_B) / 2;
	start_B -= shift;
	end_B -= shift;
	init();
});

downButton.addEventListener('click', (evt) => {
	const shift = (end_B - start_B) / 2;
	start_B += shift;
	end_B += shift;
	init();
});

zoomOutButton.addEventListener('click', (evt) => {
	start_A -= (end_A - start_A) / 2;
	end_A += (end_A - start_A) / 2;
	start_B -= (end_B - start_B) / 2;
	end_B += (end_B - start_B) / 2;
	init();
});


function createCanvas() {
    const canvas = document.querySelector('#canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    return [canvas, ctx];
}










function logistic_map(mu, x) {
    return mu * x * (1 - x);
}

// for the lyapunov exponent formula
function logistic_map_derivative(r, x) {
    return r * (1 - 2 * x);
}

/**
 * 
 * @returns	array of length "n"
 */
function generateChartData(R, n, x_0) {
    const data = [x_0]

    let x = x_0;
    for(let i = 0; i < n; i++) {
        const schemaIdx = i%schemaSize;
        const currentLetter = schemas[schema][schemaIdx];
        const idx = currentLetter === 'B' ? 1 : (currentLetter === 'C' ? 2 : 0 /* A */);

        x = logistic_map(R[idx], x)
        data.push(x)
    }
    return data;
}

/**
 * calculate "lambda"
 * @params	R			array [a, b, C]
 * @params  data	result of "generateChartData" function
 */
function lyapunov_exponent(R, data) {
    let sum = 0;
    let schemaIdx, currentLetter;

    for(let i = 1; i < data.length; i++) {
        schemaIdx = i%schemaSize; // iterate over the schema letters (A, B and eventually C)
        currentLetter = schemas[schema][schemaIdx];
        
        let idx = currentLetter == 'B' ? 1 : (currentLetter == 'C' ? 2 : 0);

        sum += Math.log(
					Math.abs(
						logistic_map_derivative(R[idx], data[i])
					)
				);
    }
    return sum / data.length;
}

function displayPlot(ctx, data) {
  for(let i = 0; i < data.length; i++) {
		// add 1 pixel
    ctx.fillRect(i, data[i]*100 + CANVAS_HEIGHT/2, 1, 1);
  }
}






const [canvas, ctx] = createCanvas();

//const data = generateChartData([A, B], CANVAS_WIDTH, 0.5);
//console.log(data);
//displayPlot(ctx, data);
//console.log("lambda:", lambda);

let start_A = 0;
let end_A = 4;
let start_B = 0;
let end_B = 4;

function init() {
    visualize(start_A, end_A, start_B, end_B);
}

init();



function visualize(A_start, A_end, B_start, B_end) {

    const start = Date.now();

    const it_a = (A_end - A_start)/CANVAS_WIDTH;
    const it_b = (B_end - B_start)/CANVAS_HEIGHT;

    let color;
		const imageData = ctx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);

		let i = 0;
    for(let a = A_start; a < A_end; a=a+it_a)
    {
				let j = 0;
        for(let b = B_start; b < B_end; b=b+it_b)
        {
            const data = generateChartData([a, b, C], CANVAS_WIDTH, 0.5);
            const lambda = lyapunov_exponent([a, b, C], data);

            if(Math.abs(lambda) == Infinity) {
                color = "black";
            } else {
                // https://stackoverflow.com/questions/46928277/trying-to-convert-integer-range-to-rgb-color
                if(lambda < 0) {
                    let percentage = - lambda / 5;
                    color = transitionOfHueRange(percentage, 200, 90); // stable
                } else {
                    let percentage = lambda * 10;
                    color = transitionOfHueRange(percentage, 225, 240); // chaos
                }
            }
            
						imageData.data[i * 4 + j * CANVAS_WIDTH * 4 + 0] = color.red; // R value
						imageData.data[i * 4 + j * CANVAS_WIDTH * 4 + 1] = color.green; // G value
						imageData.data[i * 4 + j * CANVAS_WIDTH * 4 + 2] = color.blue; // B value
						imageData.data[i * 4 + j * CANVAS_WIDTH * 4 + 3] = 255;    // A value
						// slower ?
						//ctx.fillStyle = color;
            //ctx.fillRect((a-A_start)/it_a, (b-B_start)/it_b, resolution, resolution);
					
						j += 1;
        }
				i += 1;
    }

		ctx.putImageData(imageData, 0, 0);
	

    const durationMs = Date.now() - start;
	
    //document.querySelector('#resolution').innerHTML = "step : " + it_a + " per pixel";
    document.querySelector('#resolution').innerHTML = "<br/>" + CANVAS_WIDTH + 'x' + CANVAS_HEIGHT + " <mark>generated in <b>"+(durationMs/1000) + " sec.</b></mark>";
    document.querySelector('#resolution').innerHTML += "<br/>" + "A=X-range=[" + start_A.toFixed(3) + ", " + end_A.toFixed(3) + "]";
    document.querySelector('#resolution').innerHTML += "<br/>" + "B=Y-range=[" + start_B.toFixed(3) + ", " + end_B.toFixed(3) + "]";
    document.querySelector('#resolution').innerHTML += "<br/>C=" + C;

    console.log("Generated in:", durationMs, "ms.");
    return ctx;
}










function getCanvasCoordinates(event) {
    const x = event.clientX - canvas.getBoundingClientRect().left,
        y = event.clientY - canvas.getBoundingClientRect().top;
    return {x: x, y: y};
}

let startPosition;
let dragging = false;

function dragStart(e) {
    dragging = true;
    startPosition = getCanvasCoordinates(event);
    console.log("START:", startPosition);
};

function dragStop(event) {
    dragging = false;
    
    var endPosition = getCanvasCoordinates(event);
    console.log("END:", endPosition);


    if(startPosition.x < endPosition.x && startPosition.y < endPosition.y) {

        let a_st = (end_A - start_A) * startPosition.x / CANVAS_WIDTH + start_A;
        let a_en = (end_A - start_A) * endPosition.x / CANVAS_WIDTH + start_A;
        console.log(a_st, a_en);

        let b_st = (end_B - start_B) * startPosition.y / CANVAS_HEIGHT + start_B;
        let b_en = (end_B - start_B) * endPosition.y / CANVAS_HEIGHT + start_B;
        console.log(b_st, b_en);

        start_A = a_st;
        end_A = a_en;
        start_B = b_st;
        end_B = b_en;

        visualize(a_st, a_en, b_st, b_en);
    }
}

canvas.addEventListener('mousedown', dragStart, false);
canvas.addEventListener('mouseup', dragStop, false);

document.querySelector('#prev').addEventListener('click', function(e) {
    C -= 0.05;
    visualize(start_A, end_A, start_B, end_B);
});
document.querySelector('#next').addEventListener('click', function(e) {
    C += 0.05;
    visualize(start_A, end_A, start_B, end_B);
});




const noOfFrames = 10; //24*2;



document.querySelector('#save').addEventListener('click', function(evt) {
		evt.target.disabled = true;
		
    //
    // https://javascript.plainenglish.io/how-to-create-an-animated-gif-from-custom-canvas-frames-with-client-side-javascript-696b1ba933ba
    //
    const encoder = new GIFEncoder(CANVAS_WIDTH, CANVAS_HEIGHT);
    encoder.setRepeat(0);
    encoder.setDelay(1000 / 24); // in milliseconds

    encoder.start();
    
    for(let f=0; f < noOfFrames; f++) {
        C += 0.015;

        console.log("frame", f+1, "/", noOfFrames);
				evt.target.innerHTML = 'Generating frame ' + (f + 1) + ' / ' + noOfFrames;
			
        const ctx = visualize(start_A, end_A, start_B, end_B);

        encoder.addFrame(ctx);
    }
		encoder.finish();

		addGifImage(encoder);
	
		evt.target.disabled = false;
});

function addGifImage(encoder) {
    const fileType = 'image/gif';
    const readableStream = encoder.stream();
    const binary_gif = readableStream.getData();
    const b64Str = 'data:'+fileType+';base64,'+encode64(binary_gif);
    let dwnlnk = document.createElement('a');
    dwnlnk.download = 'lyapunov-fractal-logistic-map.gif';
    dwnlnk.innerHTML = 'Save';
    dwnlnk.href = b64Str;
    document.body.appendChild(dwnlnk);
    document.body.innerHTML += "<img id='outputGif' src='"+b64Str+"' />";
}
