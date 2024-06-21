// execute : `python3 -m http.server 5000`

const GRID_SIZE = 350,
			DT = 1,
			D_a = 1.0,
			D_b = 0.5,
			//feed = 0.055,
			feed = 0.07976,
			//kill = 0.062,
			kill = 0.05923;

let canvas,
		ctx,
		gl,
		intervalId,
		grid;

const discrete_laplacian_2D = [
	[0.05, 	0.2,	0.05],
	[0.2, 	-1, 	0.2],
	[0.05, 	0.2,	0.05]
];

class Cell {
	constructor(A, B) {
		this.A = A;
		this.B = B;
	}
}

function main() {

	canvas = document.querySelector('canvas');
	canvas.width = GRID_SIZE;
	canvas.height = GRID_SIZE;

	const radioButton = document.querySelector('input[name=context]:checked');
	const currentContext = radioButton.id;

	console.log("context:", currentContext);
	ctx = canvas.getContext(currentContext);

	if (currentContext == '2d') {
		init_2D();
	} else {
		init_3D();
	}

	document.getElementById('2d').addEventListener('click', function(e) {
		canvas = document.getElementById('canvas_2d');
		document.getElementById('canvas_3d').style.display = 'none';
		canvas.style.display = 'block';
		
		ctx = canvas.getContext('2d');
		init_2D();
	});
	document.getElementById('webgl').addEventListener('click', function(e) {
		canvas = document.getElementById('canvas_3d');
		document.getElementById('canvas_2d').style.display = 'none';
		canvas.style.display = 'block';
		
		ctx = canvas.getContext('webgl2');
		init_3D();
	});
}

function init_2D() {
	
	grid = Array(GRID_SIZE).fill().map(()=>Array(GRID_SIZE).fill())
	for (let x = 0; x < GRID_SIZE; x++) {
		for (let y = 0; y < GRID_SIZE; y++) {
			grid[x][y] = new Cell(1, 0);
		}
	}
	
	// x2
	for (let nb = 0; nb < 15; nb++) {
		const size = getRandomInt(3, 5);
		drop(getRandomInt(size, GRID_SIZE - size), getRandomInt(size, GRID_SIZE - size), size);
	}
	
	intervalId = setInterval(compute_frame, 1000 / (24 * 100));
	//window.requestAnimationFrame(compute_frame);
}

function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

function laplace_2D_discrete(grid, letter, x, y) {
	let sum = 0;
	for(let i = -1; i <= 1; i++) {
		for(let j = -1; j <= 1; j++) {
			sum += grid[x + i][y + j][letter] * discrete_laplacian_2D[i+1][j+1];
		}
	}
	return sum;
}

// add a "big" drop of B in the middle
function drop(x, y, radius = 5) {
	for(let i = x - radius; i < x + radius; i++) {
		for(let j = y - radius; j < y + radius; j++) {
	    grid[i][j].A = 0
	    grid[i][j].B = 1
		}
	}
}

function compute_frame()
{
	const t0 = performance.now();
	
	const data = new Uint8ClampedArray(GRID_SIZE * GRID_SIZE * 4);
	for(let x = 0; x < GRID_SIZE; x++)
	{
		for(let y = 0; y < GRID_SIZE; y++)
		{
			const idx = x * canvas.width + y;
			const offset = idx * 4;
			if(x == 0 || y == 0 || x == GRID_SIZE - 1 || y == GRID_SIZE - 1) {
				data[offset] = 255;
				data[offset + 1] = 255;
				data[offset + 2] = 255;
			} else {
				// update
				const A = grid[x][y].A;
				const B = grid[x][y].B;
				const newA = A + (D_a * laplace_2D_discrete(grid, 'A', x, y) - A * B * B + feed * (1 - A)) * DT
				const newB = B + (D_b * laplace_2D_discrete(grid, 'B', x, y) + A * B * B - (kill + feed) * B) * DT
				grid[x][y].A = newA;
				grid[x][y].B = newB;
	
				data[offset] = Math.floor(155 * (1 - newA)) + 100;
				data[offset + 1] = 130;
				data[offset + 2] = Math.floor(110 * newB) + 100;
			}
			data[offset + 3] = 255; // alpha/opacity
		}
	}
	
	const imageData = new ImageData(data, canvas.width, canvas.height);
	ctx.putImageData(imageData, 0, 0);	
	//window.requestAnimationFrame(compute_frame);

	const t1 = performance.now();
	//console.log(`Time : ${t1 - t0}, Frequency : ${1000 / (t1 - t0)} Hz.`);
}

function init_3D() {
	// stop 2d
	if(intervalId) {
		clearInterval(intervalId);
	}
	
	gl = ctx;
	
	// executed once per vertex
	const vertexShaderCode = `#version 300 es

//attribute float a_loc; // attributes : supported in vertex shaders only
//attribute float b_loc; // 'attribute' : Illegal use of reserved word (attribute et varying : deprecated)

in vec2 a_position;

in float a_loc;
in float b_loc;

out float test_a;
out float test_b;

void main() {
	 test_a = a_loc;
	 test_b = b_loc;
	 
   gl_Position = vec4((vec3(0.0, 0.0, -1.0) * vec3(a_position, 1)).xy, 0, 1);
}
`;

	// once per pixel ?
	const fragmentShaderCode = `#version 300 es

precision highp float; // mediump -> ?

in float test_a;
in float test_b;

uniform float u_time; 			// the number of seconds since the shader started running
uniform vec2 u_resolution; 	// Width and height of the canvas
uniform vec2 u_mouse;

out vec4 fragColor; // gl_FragColor is obsolete

void main() {
	vec2 st = gl_FragCoord.xy / u_resolution;
	
	//vec4 color = vec4(test_a[int(gl_FragCoord.x * 350 + gl_FragCoord.y)] / 255, 0.0, 1.0, 1.0);
  
	fragColor = vec4(st.x, st.y, 0.0, 1.0);
}
`;


	// DEBUG
	//const maxAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
	//console.log("maximum number of attributes:", maxAttributes); // 16


	gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	const program = gl.createProgram();

	const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderCode);
  gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(vertexShader);
    gl.deleteShader(vertexShader);
    throw "Unable to compile WebGL program (vertex shader).\n\n" + info;
  }

	const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderCode);
  gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(fragmentShader);
    gl.deleteShader(fragmentShader);
    throw "Unable to compile WebGL program (fragment shader).\n\n" + info;
  }

	//gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  	// there was an error
  	console.error(gl.getProgramInfoLog(program));
	}
	
  gl.useProgram(program);



	const As = [], Bs = [];
	for (let x = 0; x < GRID_SIZE; x++) {
		for (let y = 0; y < GRID_SIZE; y++) {
			As.push(grid[x][y].A);
			Bs.push(grid[x][y].B);
		}
	}
	const data_A = new Float32Array(As);
	const buffer_A = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer_A);
	gl.bufferData(gl.ARRAY_BUFFER, data_A, gl.STATIC_DRAW);

	var aLoc = gl.getAttribLocation(program, "a_loc");
	gl.enableVertexAttribArray(aLoc);

	const data_B = new Float32Array(Bs);
	const buffer_B = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer_B);
	gl.bufferData(gl.ARRAY_BUFFER, data_B, gl.STATIC_DRAW);

	var bLoc = gl.getAttribLocation(program, "b_loc");
	gl.enableVertexAttribArray(bLoc);
	
}




main();