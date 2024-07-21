
/*
FIX:
- color flickering ?
- why the top most color wins currently -> because of "raster scan"
    -> at the relabeling use the most common ?
- understand why I had to use (x/y)offsets to align arrays..... (with HK results)

TODO
- show HK different values on a grid (get labels from the union-find)
- use color of the "biggest radius" ball ?
- add gradient field arrows

*/

import { Hoshen_Kopelman } from './Hoshen-Kopelman.js';


//
// Config.
//
let LINE_COLOR = 'green'; // transparent|lightgreen|red
const X_MAX = 800,          // canvas sizes
      Y_MAX = 500,
      NB_BALLS = 10,
      MIN_RADIUS = 15,
      MAX_RADIUS = 35,      // NOT in pixel ... used to cap random radius size
      GRID_SIZE = 5,        // lower grid should be SLOWER (must be above 0 !)
                            // must be multiple of X_MAX ?! why ?? FIXME
      DT = 1.4,            // animation speed
      UNIFORM_COLOR = true, // BUG: blank screen...
      BACKGROUND = 'white', // white|black
      NO_OUTLINE = false,     // hide contour line
      LINE_WIDTH = 5,
      WITH_BALL_TEXT = false, // show ball name + color name inside
      SIN_WAVE = false,     // change shape => but slower ?! (BUG: blank screen...)
        NUM_PIKES = 9,
        PIKE_DEPTH = 0.33,  // in radius % ratio
      SHOW_GRID = '',       // huge|big|small (can be slow! because of fillRect(s)?)
      MAX_LOOP = Infinity, //Infinity,  // 1|100|Infinity
      // if SHOW_GRID :
        BALL_COLOR = 'orange', // red|darkorange|...
        BG_COLOR = 'blue',  // transparent|lightblue|...
      // HK = Hoshen-Kopelman algorithm (1976) to color contiguous areas ...
      HK_RELABEL = false,
      HK_GRID = false,
      HK_GRID_SIZE = 16,
      SHOW_CONTOUR_GRADIENT = false;

// NOT USED YET
import tinycolor from "https://esm.sh/tinycolor2";

//
// init canvas
//
var canvas = document.querySelector('canvas');
canvas.width = X_MAX;
canvas.height = Y_MAX;
var ctx = canvas.getContext('2d');


const availableColors = [
  'lightgreen', 'orangered', 'yellow', 'red',
  'aqua', 'olive', 'silver', 'lightblue',
  'darkred', 'grey', 'fuchsia',
  'teal', 'lightsalmon',
];


//
// Helper functions
//
const randomNumber = (min, max) => Math.random() * (max - min) + min;

let i = 1; // numbered balls starting from 1 ...
const createMetaBall = function()
{
  let x = randomNumber(MAX_RADIUS, canvas.width - MAX_RADIUS); // random x position
  let y = randomNumber(MAX_RADIUS, Y_MAX - MAX_RADIUS); // random y position
  let velocity_range = 3;
  let rnd = randomNumber(0, availableColors.length - 1);
  let color = availableColors[Math.round(rnd)];
  
  return {
    name: 'Ball '+(i++),
    color: color,
    x: Math.round(x),
    y: Math.round(y),
    radius: randomNumber(MIN_RADIUS, MAX_RADIUS), // radius
    x_velocity: randomNumber(-velocity_range, velocity_range),
    y_velocity: randomNumber(-velocity_range, velocity_range),
    a: 1, // a != b -> for a "standard ellipse"
    b: 1, //
    fn: function (x, y) { // implicit function of circle
      
      if(SIN_WAVE) { // slower?! to add a sin wave on each circle
        let theta = Math.atan2(this.y - y, this.x - x);
        let r = this.radius + this.radius*PIKE_DEPTH * Math.sin(NUM_PIKES * theta);
        delta_x = r * Math.cos(theta);
        delta_y = r * Math.sin(theta);

        // return this instead ...
        return this.radius / Math.sqrt(
            ((delta_x + x) - this.x)**2
          + ((delta_y + y) - this.y)**2
        );
      }
      
      // 
      // INFO : in evaluatedValueAt() all balls' f(x,y) are added into a simple sum
      ///
      
      // nearer = higher value (>= 1 if inside shape)
        // "inverse distance function"
      return this.radius / (
        Math.sqrt((x - this.x)**2/(this.a**2) + (y - this.y)**2/(this.b**2))
      );
    },
    //
    // tests ...
    //
    fn_2: (x, y) => Math.sin(x)*Math.cos(y) // not moving ?
  };
}


const findNearestBall = (x, y) => {
  let my_array = metaballs.map(ball => {
    //console.log(ball.fn(x, y));
    return ball.fn(x, y);
  })
  return metaballs[my_array.indexOf(Math.max(...my_array))];
}

let metaballs = []; // array of objects { name: , x: , y: , ... }
let loop = 0; // Infinity/...
// to save computations ... !!
let cache = [];
let my_balls;

let segGrid = [];
let disjointSet;
let interval; // from setInterval (main loop)


//
// Init a cache (fill with Infinity)
//
console.log("cache size:", Math.round(Y_MAX / GRID_SIZE), "*", Math.round(canvas.width / GRID_SIZE), ":", Math.round(Y_MAX / GRID_SIZE) * Math.round(canvas.width / GRID_SIZE), "floats");

function initCache() {
	const _cacheValue = Array(Math.round(Y_MAX / GRID_SIZE)).fill(Infinity).map(x => Array(Math.round(canvas.width / GRID_SIZE)).fill(Infinity));
	cache = _cacheValue;
}

let myReq;

function main() {
  
  // resize the canvas to fill browser window dynamically
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
  }, false);
	canvas.width = window.innerWidth;

	
  // initializations
  console.clear();
  //loop = 0;
  i = 1;
  //my_balls = Array(Math.round(i)).fill(0);
  
  //
  // create N metaballs at random points (x,y)
  //
  metaballs = [...Array(NB_BALLS).keys()].map((i) => createMetaBall());
  console.log(metaballs.length, "metaballs :", metaballs);
  
  //
  // main animation loop
  //
  if(myReq) {
    cancelAnimationFrame(myReq)
  }
	myReq = window.requestAnimationFrame(mainLoop);
  //interval = setInterval(mainLoop, 1000/24); // 24 frames per sec.

}



function mainLoop() {

    // reset before each frame !
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);








		const offsets = [0, 0.2, 0.33, 0.4, 0.6, 0.8, 1]
		const colors = ["green", "lawngreen", "yellowgreen", "yellow", "orange", "orangered", "red"]
		const lineWidths = [LINE_WIDTH, 4, 4, 3, 3, 2, 1]

		const shown = SHOW_CONTOUR_GRADIENT ? [0, 3, 6] : [0];
	
		for(let line_idx = 0; line_idx < offsets.length; line_idx++) {

			if(!shown.includes(line_idx)) continue;
			
	    initCache(); // reset evaluated (x, y) points to Infinity...
			
			// line color
	    if(UNIFORM_COLOR) {
	       LINE_COLOR = colors[line_idx];
	    }

      // evaluated function(s) on a grid
      // first pass to determine ball positions
      const coloredGrid = evaluateOnGrid(offsets[line_idx]);
      
			// find contiguous zones
	    // TODO: not necessary if UNIFORM_COLOR = true ?!
      if (!UNIFORM_COLOR) {
        console.log(coloredGrid);     
        [segGrid, disjointSet] = Hoshen_Kopelman(coloredGrid, BG_COLOR, HK_RELABEL)
      }

	    ctx.lineWidth = lineWidths[line_idx];
	    ctx.lineCap = "round"; // round|square -> useful ??
	
			//
	    // display all the balls' outline with the "marching squares" method
			//
	    marchingSquares(segGrid, coloredGrid);
		}
	





    //console.log("my_balls:", my_balls);
    
    // show colored grid
    if(HK_GRID && segGrid.length) {
	
	    let distinct = [...new Set(segGrid.flat())];
	    //console.log(distinct.length, " different values (with the 0)");
	    
      let color_idx, color, ball;
      for(let x = 0; x < segGrid[0].length; x++) {
        for(let y = 0; y < segGrid.length; y++) {
          let label = segGrid[y][x]; // 0 ou ...
          //console.log(color_idx);
          
          ball = my_balls[label];
          color = ball?.color;
          //console.log(color);
          
          if(ball) {
            //console.log(color);
            //let filtered = my_balls.filter(b => b === ball);
            //console.log(ball.name, filtered);
            
            // https://github.com/bgrins/TinyColor
            // TODO : tinycolor(color).darken(percentage).toString();
            //color = tinycolor(color);
            //.darken(color_idx / distinct.length * 100).toString();
          }
          // newColor = <find order in set from UF ...> -> to percentage
          // ??? shades of the chosen ball color (same as always.....)
          
          if(label) {
            //console.log(color);
            ctx.fillStyle = color;
            ctx.fillRect(x*GRID_SIZE-HK_GRID_SIZE, y*GRID_SIZE-HK_GRID_SIZE, HK_GRID_SIZE+2, HK_GRID_SIZE+2);
            
            ctx.fillStyle = 'grey';
            ctx.fillText(label, x*GRID_SIZE - GRID_SIZE/2, y*GRID_SIZE - 3)
          }
        }
      }
    }


    // show ball name ?
    if(WITH_BALL_TEXT) {
      metaballs.forEach((ball) => {
        if(HK_GRID) {
          ctx.font = "12px Arial";
          ctx.strokeStyle = 'black';
          ctx.lineJoin = 'bevel';
          ctx.lineWidth = 4;
          ctx.strokeText(ball.name, ball.x - 15, ball.y + 3);
          ctx.fillStyle = ball.color;
          ctx.fillText(ball.name, ball.x - 15, ball.y + 3);
        } else {
          ctx.font = "9px Arial";
          ctx.fillStyle = ball.color;
          ctx.fillText(ball.name, ball.x - 11, ball.y + 0);
        }
        //ctx.fillText('('+ball.color+')', ball.x - (ball.color.length)*2.5, ball.y + 10);
      });
    }



    //
    // CHECKS: wall collisions + updating ball positions
    //
    metaballs.forEach((ball) => {
      ball.x = ball.x + ball.x_velocity * DT;
      ball.y = ball.y + ball.y_velocity * DT;

      // Inversion if collision with canvas' border
      if(ball.x <= ball.radius) ball.x_velocity = -ball.x_velocity;
      if(ball.x >= canvas.width - ball.radius) ball.x_velocity = -ball.x_velocity;

      if(ball.y <= ball.radius) ball.y_velocity = -ball.y_velocity;
      if(ball.y >= Y_MAX - ball.radius) ball.y_velocity = -ball.y_velocity;
    })

    loop++;
    if(loop >= MAX_LOOP) {
			clearInterval(interval);
		} else {
			myReq = window.requestAnimationFrame(mainLoop);
		}
	
  }



document.getElementById('reload').addEventListener('click', function() {
  if(interval) clearInterval(interval);
  main();
});


// evaluate the "scalar field"
// - then the lines are where the threshold passes through 1
//   (= isolines/isocontour, with constant "height")
function evaluatedValueAt(metaballs, x, y) {
  const i = Math.round(y/GRID_SIZE);
  const j = Math.round(x/GRID_SIZE);
  const cachedValue = cache[i] ? (cache[i][j] ?? Infinity) : Infinity;
  
  // -> time saved ?
  if(cachedValue !== Infinity) return cachedValue;
  
  // **simply** sum every implicit functions ! (as in an electric field ?)
    // see : https://youtu.be/6oMZb3yP_H8?t=1288
    // = constructive interference ?
  let value = metaballs.reduce((accumulator, currentValue) => accumulator + currentValue.fn(x, y), 0 /* initial value */);
  
  // Save in cache
  cache[i][j] = value;
  return value;
}



// 
// Linear interpolation (LERP) of drawn lines (x or y) coordinates
// (x, y) is the upper-left point of the "square"
// -> faster than "true" root-finding
// 
function lerpAt(x, y, side) {
  let value_1, value_2;
  switch(side) {
    case "lower":
      value_1 = evaluatedValueAt(metaballs, x,              y + GRID_SIZE);
      value_2 = evaluatedValueAt(metaballs, x + GRID_SIZE,  y + GRID_SIZE);
      // lerp
      return x + (1 - value_1) / (value_2 - value_1) * GRID_SIZE;
    case "upper":
      value_1 = evaluatedValueAt(metaballs, x,              y);
      value_2 = evaluatedValueAt(metaballs, x + GRID_SIZE,  y);
      // lerp
      return x + (1 - value_1) / (value_2 - value_1) * GRID_SIZE;
    case "left":
      value_1 = evaluatedValueAt(metaballs, x, y);
      value_2 = evaluatedValueAt(metaballs, x, y + GRID_SIZE);
      // lerp
      return y + (1 - value_1) / (value_2 - value_1) * GRID_SIZE;
    case "right":
      value_1 = evaluatedValueAt(metaballs, x + GRID_SIZE, y);
      value_2 = evaluatedValueAt(metaballs, x + GRID_SIZE, y + GRID_SIZE);
      // lerp
      return y + (1 - value_1) / (value_2 - value_1) * GRID_SIZE;
  }
}




//
// used to display a single frame with all the balls
//
function evaluateOnGrid(offset=0) {
  
  const coloredGrid = []
  
  // navigate vertically jumping by "GRID_SIZE"
  for (let y = 0; y < Y_MAX; y = y + GRID_SIZE) {
    const colors = [];
    
    // navigate horizontally first
    for (let x = 0; x < canvas.width; x = x + GRID_SIZE) {
      
      // current evaluated point: to determine which object we're on (background / a ball)
      // -> it extract isocontour lines from the "implicit function" = C (here 1)
      const color = evaluatedValueAt(metaballs, x, y) >= (1 + offset) ? BALL_COLOR : BG_COLOR;
// to store current "state" : background / ball
			
      //
      // saved for later ... (in line drawing loop)
      //
      colors.push(color);
      
      // show point "grid"
      if(SHOW_GRID == 'small') {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      } else if(SHOW_GRID == 'big') {
        ctx.fillStyle = color;
        ctx.fillRect(x-2, y-2, 4, 4);
      } else if(SHOW_GRID == 'huge') {
        ctx.fillStyle = color;
        ctx.fillRect(x-3, y-3, 5, 5);
      }
      
    } // Xs
    coloredGrid.push(colors);
  } // Ys 
  return coloredGrid;
}


// if any
function getBall(segmentedGrid, i, j, xOffset, yOffset) {
  let label = segmentedGrid[j+xOffset][i+yOffset];
  if(label && !my_balls[label]) {
      my_balls[label] = findNearestBall((j+xOffset)*GRID_SIZE, (i+yOffset)*GRID_SIZE);
    return my_balls[label];
  }
}

// find which balls we draw
// FIXME : the first nearest found (top most) is the one chosen ... ?!        
function getBallColor(segmentedGrid, i, j, xOffset, yOffset) {
  let color;
  
  if(!UNIFORM_COLOR) {
    let ball = getBall(segmentedGrid, i, j, xOffset, yOffset);
    color = ball?.color;
  } else {
    color = LINE_COLOR;
  }
  return color;
}


function marchingSquares(segmentedGrid, coloredGrid)
{
	// (x,y) points on a grid (separated by GRID_SIZE)
  let x, y;
  
  //console.log(segmentedGrid);
	
  // reset
  my_balls = Array(Math.round(i)).fill(0);
  
  //
  // Traverse colored points grid 2 by 2 and skip "fast" ... if uninteresting
  //
  for(let i = 0; i < coloredGrid.length - 1; i++) { // vertically
			
    for(let j = 0; j < coloredGrid[i].length - 1; j++) { // horizontally first
    
      let upper_left = coloredGrid[i][j],
          upper_right = coloredGrid[i][j+1],    //
          lower_left = coloredGrid[i+1][j],     // warning : +1 ...
          lower_right = coloredGrid[i+1][j+1];  //
      
      //
      // SKIP uninteresting cases (when all 4 with same color)
      //
      if((upper_left == BALL_COLOR && upper_right == BALL_COLOR && lower_left == BALL_COLOR && lower_right == BALL_COLOR)
         || (upper_left == BG_COLOR && upper_right == BG_COLOR && lower_left == BG_COLOR && lower_right == BG_COLOR)) {
        continue; // SKIP IT !
      }

      // get back the coordinates x, y (upper-left corner)
      x = j * GRID_SIZE;
      y = i * GRID_SIZE;
			
      // 
      // INTERESTING cases (if not all same color)
      // - then calculate the appropriate "LERP" on the various sides ...
      //        where need (when a line should be present)

      //
      // 12 other cases "only"
      //  -> missing 2 cases... when on diagonal... it's ok if convex shapes ONLY!
      //
      
      // TODO : we get 0s sometimes : so we must use this xOffset/yOffset ?!
      
      //console.log("i:", i, "j:", j, segmentedGrid[i+yOffset][j+xOffset], my_colors[segmentedGrid[i+yOffset][j+xOffset] % my_colors.length]);
      
      let xOffset, yOffset, ball;
      
      // at upper-left position
      if ((upper_left === BALL_COLOR && upper_right === BG_COLOR && lower_left === BG_COLOR && lower_right === BG_COLOR)
          || (upper_left === BG_COLOR && upper_right === BALL_COLOR && lower_left === BALL_COLOR && lower_right === BALL_COLOR)) {
        
        if(upper_left === BALL_COLOR) {
          xOffset = 0;
          yOffset = 0;
        } else {
          xOffset = 1;
          yOffset = 0;
        }
        
        let color = getBallColor(segmentedGrid, i, j, xOffset, yOffset);
        if(!NO_OUTLINE) {
					ctx.beginPath(); // make animation fast, here ...
		
          ctx.strokeStyle = color;
        
          ctx.moveTo(lerpAt(x, y, 'upper'),   y);
          ctx.lineTo(x,                       lerpAt(x, y, 'left'));
      		ctx.stroke();
        }
        
        
        
        // at upper-right
      } else if (
        (upper_left === BALL_COLOR && upper_right === BG_COLOR && lower_left === BALL_COLOR && lower_right === BALL_COLOR)
        || (upper_left === BG_COLOR && upper_right === BALL_COLOR && lower_left === BG_COLOR && lower_right === BG_COLOR)) {
        
        if(upper_right === BALL_COLOR) {
          xOffset = 1; // to the right
          yOffset = 0;
        } else {
          xOffset = 1; // to the right
          yOffset = 1; // to the bottom
        }
        
        let color = getBallColor(segmentedGrid, i, j, xOffset, yOffset);
        if(!NO_OUTLINE) {
					ctx.beginPath(); // make animation fast, here ...
		
          ctx.strokeStyle = color;
          
          ctx.moveTo(lerpAt(x, y, 'upper'),   y);
          ctx.lineTo(x + GRID_SIZE,           lerpAt(x, y, 'right'));
      		ctx.stroke();
        }

        
        
        
        // at lower-right   
      } else if (
        (upper_left === BALL_COLOR && upper_right === BALL_COLOR && lower_left === BALL_COLOR && lower_right === BG_COLOR)
        || (upper_left === BG_COLOR && upper_right === BG_COLOR && lower_left === BG_COLOR && lower_right === BALL_COLOR)) {

        if(upper_right === BALL_COLOR) {
          xOffset = 1;
          yOffset = 0;
        } else {
          xOffset = 1;
          yOffset = 1;
        }
        
        let color = getBallColor(segmentedGrid, i, j, xOffset, yOffset);
        if(!NO_OUTLINE) {
					ctx.beginPath(); // make animation fast, here ...
		
          ctx.strokeStyle = color;
          
          ctx.moveTo(lerpAt(x, y, 'lower'),   y + GRID_SIZE);
          ctx.lineTo(x + GRID_SIZE,           lerpAt(x, y, 'right'));
      		ctx.stroke();
        }
        
        
        
        // at lower-left
      } else if (
        (upper_left === BALL_COLOR && upper_right === BALL_COLOR && lower_left === BG_COLOR && lower_right === BALL_COLOR)
        || (upper_left === BG_COLOR && upper_right === BG_COLOR && lower_left === BALL_COLOR && lower_right === BG_COLOR)) {

        if(upper_right === BALL_COLOR) {
          xOffset = 0;
          yOffset = 0;
        } else {
          xOffset = 0;
          yOffset = 1;
        }
        
        let color = getBallColor(segmentedGrid, i, j, xOffset, yOffset);
        if(!NO_OUTLINE) {
					ctx.beginPath(); // make animation fast, here ...
		
          ctx.strokeStyle = color;
          
          ctx.moveTo(lerpAt(x, y, 'lower'),   y + GRID_SIZE);
          ctx.lineTo(x,                       lerpAt(x, y, 'left'));
      		ctx.stroke();
        }
        
        
        
        // horizontal lines
      } else if ((upper_left === BALL_COLOR && upper_right === BALL_COLOR && lower_left === BG_COLOR && lower_right === BG_COLOR)
                 || (upper_left == BG_COLOR && upper_right === BG_COLOR && lower_left === BALL_COLOR && lower_right === BALL_COLOR)) {

        
        if(upper_right === BALL_COLOR) {
          xOffset = 1;
          yOffset = 0;
        } else {
          xOffset = 1;
          yOffset = 1;
        }
        
        let color = getBallColor(segmentedGrid, i, j, xOffset, yOffset);
        if(!NO_OUTLINE) {
					ctx.beginPath(); // make animation fast, here ...
		
          ctx.strokeStyle = color;
          
          ctx.moveTo(x,               lerpAt(x, y, 'left'));
          ctx.lineTo(x + GRID_SIZE,   lerpAt(x, y, 'right'));
      		ctx.stroke();
        }
        
        
        
        // vertical lines
      } else if ((upper_left === BALL_COLOR && upper_right === BG_COLOR && lower_left === BALL_COLOR && lower_right === BG_COLOR)
                 || (upper_left === BG_COLOR && upper_right === BALL_COLOR && lower_left === BG_COLOR && lower_right === BALL_COLOR)) {
        
        if(upper_right === BALL_COLOR) {
          xOffset = 1;
          yOffset = 0;
        } else {
          xOffset = 0;
          yOffset = 1;
        }
        
        let color = getBallColor(segmentedGrid, i, j, xOffset, yOffset);
        if(!NO_OUTLINE) {
					ctx.beginPath(); // make animation fast, here ...
		
          ctx.strokeStyle = color;
          
          ctx.moveTo(lerpAt(x, y, 'upper'),   y);
          ctx.lineTo(lerpAt(x, y, 'lower'),   y + GRID_SIZE);
      		ctx.stroke();
        }
        
        
        
      } else {
        // 
        // cases NOT IMPLEMENTED YET ...
        //  -> so it only works with circles (or convex shapes?) or not too sharp shapes...)
        // 
      }
      
	    
    } // j
		
  } // i

  
} // marching function


main();
