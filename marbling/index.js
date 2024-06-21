//console.time("main");

import { NB_VERTICES, Drop } from './drop.js';

//
// Constants / parameters
//
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;
const MARGIN = 20;

const NB_DROPS = 100;
const DROP_RATE = 20; // milliseconds
//const MIN_RADIUS = 25, MAX_RADIUS = 25; // same size
const MIN_RADIUS = 40;
const MAX_RADIUS = 70;
const DROP_OUTLINE_COLOR = 'black';

const colorsHues = {
    'reds': ['DarkRed', 'FireBrick', 'Red', 'Crimson', 'LightSalmon', 'DarkSalmon', 'Salmon', 'LightCoral', 'IndianRed'],
    'greens': ['MediumSpringGreen', 'SpringGreen', 'MediumSeaGreen', 'SeaGreen', 'ForestGreen', 'Green', 'DarkGreen', 'YellowGreen', 'OliveDrab'],
    'blues': ['cyan', 'lightblue', 'blue', 'SteelBlue', 'LightSkyBlue', 'LightSteelBlue', 'DodgerBlue', 'DarkBlue', 'Navy', 'MidnightBlue'],
};

const canvas = document.querySelector('canvas');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext('2d');





//
// UI (colors)
//
const colorSelect = document.querySelector('#color');
const color = localStorage.getItem("color") || colorSelect.value; // set starting value
colorSelect.value = color;

let colors = colorsHues[color]; // get colors to pick from



// 
// UI event listeners
//

// when a color class is selected in the <select>
window.changeColor = function () {
    const color = colorSelect.value;
    localStorage.setItem("color", color);
    colors = colorsHues[color];
    main();
}

// when button is clicked
window.refresh = function () { main(); }






//
// Helper functions
//
function getRandomInt(min, max)
{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createRandomDrop()
{
    const   //x = CANVAS_WIDTH / 2,
            x = getRandomInt(MARGIN, CANVAS_WIDTH - MARGIN),
            //y = CANVAS_HEIGHT / 2,
            y = getRandomInt(MARGIN, CANVAS_HEIGHT - MARGIN),
            r = getRandomInt(MIN_RADIUS, MAX_RADIUS);
    return new Drop(x, y, r);
}

function drawDrop(ctx, drop, color='red', strokeColor='black', lineWidth=1)
{
    ctx.beginPath();
    drop.vertices2D.forEach(v => ctx.lineTo(v.x, v.y));
    
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;

    ctx.fillStyle = color;
    ctx.fill();
    
    ctx.closePath();
    ctx.stroke(); // to make the "outline" appear
}


function dropFn ()
{
    // should stop ?
    if(drops.length >= NB_DROPS) { // max reached
        clearInterval(intervalId); // stop iterating
        const end = window.performance.now();

        // show time taken
        timeSpan.innerText = '(in ' + (Math.round((end - start) / 1000 * 1000) / 1000) + ' seconds)'; // with millisec.
        return;
    }

    // clear canvas (with white color)
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    addDrop(createRandomDrop()); // can be placed anywhere on the canvas within the MARGIN

    nbDropsSpan.innerText = drops.length; // update visible counter (HTML)

    // (re-)draw all of them, as most of them have moved..
    drops.forEach((drop, index) => drawDrop(ctx, drop, colors[index % colors.length], DROP_OUTLINE_COLOR, 2));

}


function addDrop(drop) {
    // change shapes of existing drops
    drops.forEach(otherDrop => otherDrop.marbledBy(drop));
    // add to all the drops
    drops.push(drop);
}









const drops = [];

// UI
const nbDropsSpan = document.querySelector("#nb_drops");
const timeSpan = document.querySelector("#time");
let intervalId,
    start;


function main() {

    //
    // Draw every drops
    //
    timeSpan.innerText = '';
    start = window.performance.now();

    // erase previous drops
    drops.splice(0, drops.length);

    // create each drop (gradually), one at a time
    //      at a rate of "1000 / DROP_RATE" per second
    intervalId = setInterval(dropFn, DROP_RATE); // = delay in ms.

    //console.timeEnd("main");
}

main();
