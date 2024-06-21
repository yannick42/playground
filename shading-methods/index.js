
function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }
   
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      return program;
    }
   
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

function degToRad(d) {
    return d * Math.PI / 180;
}

function matmul(a, b) {
    var a00 = a[0 * 4 + 0];
    var a01 = a[0 * 4 + 1];
    var a02 = a[0 * 4 + 2];
    var a03 = a[0 * 4 + 3];
    var a10 = a[1 * 4 + 0];
    var a11 = a[1 * 4 + 1];
    var a12 = a[1 * 4 + 2];
    var a13 = a[1 * 4 + 3];
    var a20 = a[2 * 4 + 0];
    var a21 = a[2 * 4 + 1];
    var a22 = a[2 * 4 + 2];
    var a23 = a[2 * 4 + 3];
    var a30 = a[3 * 4 + 0];
    var a31 = a[3 * 4 + 1];
    var a32 = a[3 * 4 + 2];
    var a33 = a[3 * 4 + 3];
    var b00 = b[0 * 4 + 0];
    var b01 = b[0 * 4 + 1];
    var b02 = b[0 * 4 + 2];
    var b03 = b[0 * 4 + 3];
    var b10 = b[1 * 4 + 0];
    var b11 = b[1 * 4 + 1];
    var b12 = b[1 * 4 + 2];
    var b13 = b[1 * 4 + 3];
    var b20 = b[2 * 4 + 0];
    var b21 = b[2 * 4 + 1];
    var b22 = b[2 * 4 + 2];
    var b23 = b[2 * 4 + 3];
    var b30 = b[3 * 4 + 0];
    var b31 = b[3 * 4 + 1];
    var b32 = b[3 * 4 + 2];
    var b33 = b[3 * 4 + 3];
    return [
        b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
        b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
        b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
        b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
        b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
        b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
        b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
        b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
        b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
        b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
        b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
        b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
        b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
        b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
        b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
        b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
    ];
}

const rotations = {

  x: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ];
  },

  y: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];
  },

  z: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
       c, s, 0, 0,
      -s, c, 0, 0,
       0, 0, 1, 0,
       0, 0, 0, 1,
    ];
  },
}

function generateAGridOfTriangles(fromX, toX, fromY, toY, fromZ, toZ, invert = false) {

    const array = [];
    const pixelSize =  10;

    // determine the number of small squares
    const stepX = Math.round(Math.abs(toX - fromX) / pixelSize) || 1;
    const stepY = Math.round(Math.abs(toY - fromY) / pixelSize) || 1;
    const stepZ = Math.round(Math.abs(toZ - fromZ) / pixelSize) || 1;

    console.log("steps :", stepX, stepY, stepZ);

    const X = fromX < toX ? fromX : toX;
    const Y = fromY < toY ? fromY : toY;
    const Z = fromZ < toZ ? fromZ : toZ;

    const start_index = 0;
    for (let i = start_index; i < stepX + start_index; i++) {
        for (let j = start_index; j < stepY + start_index; j++) {
            for (let k = start_index; k < stepZ + start_index; k++) {
                if(stepZ == 1) {
                    array.push(...[
                        // 1 st triangle
                        X + i*pixelSize,      Y + j*pixelSize,      Z,
                        ...(invert ? [X + i*pixelSize,      Y + (j+1)*pixelSize,  Z] : [X + (i+1)*pixelSize,  Y + (j+1)*pixelSize,  Z]),
                        ...(invert ? [X + (i+1)*pixelSize,  Y + (j+1)*pixelSize,  Z] : [X + (i+1)*pixelSize,  Y + j*pixelSize,      Z]),
                        // 2nd triangle
                        X + i*pixelSize,      Y + j*pixelSize,      Z,
                        ...(invert ? [X + (i+1)*pixelSize,  Y + (j+1)*pixelSize,  Z] : [X + i*pixelSize,      Y + (j+1)*pixelSize,  Z]),
                        ...(invert ? [X + (i+1)*pixelSize,  Y + j*pixelSize,      Z] : [X + (i+1)*pixelSize,  Y + (j+1)*pixelSize,  Z]),
                    ]);
                } else if (stepY == 1) {
                    array.push(...[
                        // 1 st triangle
                        X + i*pixelSize,      Y,    Z + k*pixelSize,
                        ...(invert ? [X + i*pixelSize,      Y,    Z + (k+1)*pixelSize] : [X + (i+1)*pixelSize,  Y,    Z + (k+1)*pixelSize]),
                        ...(invert ? [X + (i+1)*pixelSize,  Y,    Z + (k+1)*pixelSize] : [X + i*pixelSize,      Y,    Z + (k+1)*pixelSize]),
                        // 2nd triangle
                        X + i*pixelSize,      Y,    Z + k*pixelSize,
                        ...(invert ? [X + (i+1)*pixelSize,  Y,    Z + (k+1)*pixelSize] : [X + (i+1)*pixelSize,  Y,    Z + k*pixelSize]),
                        ...(invert ? [X + (i+1)*pixelSize,  Y,    Z + k*pixelSize] : [X + (i+1)*pixelSize,  Y,    Z + (k+1)*pixelSize]),
                    ]);
                } else if (stepX == 1) {
                    array.push(...[
                        // 1 st triangle
                        X,  Y + j*pixelSize,      Z + k*pixelSize,
                        ...(invert ? [X,  Y + (j+1)*pixelSize,  Z + (k+1)*pixelSize] : [X,  Y + j*pixelSize,      Z + (k+1)*pixelSize]),
                        ...(invert ? [X,  Y + j*pixelSize,      Z + (k+1)*pixelSize] : [X,  Y + (j+1)*pixelSize,  Z + (k+1)*pixelSize]),
                        // 2nd triangle
                        X,  Y + j*pixelSize,      Z + k*pixelSize,
                        ...(invert ? [X,  Y + (j+1)*pixelSize,  Z + k*pixelSize] : [X,  Y + (j+1)*pixelSize,  Z + (k+1)*pixelSize]),
                        ...(invert ? [X,  Y + (j+1)*pixelSize,  Z + (k+1)*pixelSize] : [X,  Y + (j+1)*pixelSize,  Z + k*pixelSize]),
                    ]);
                }
            }
        }
    }
    return array;
}











function showMorphing(gl, positions, spherePositions, positionBuffer, positionAttributeLocation, normalBuffer, normalLocation) {
    // Clear the canvas AND the depth buffer.
    //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 3;          // 2/3? components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer

    const morphedPositions = [], normals = [];

    //console.log("lenghts:", positions.length, spherePositions.length); // same lenghts

    t += 1 / (24 * 2);

    document.querySelector('#myRange').value = t * 100;

    for(let i = 0; i < positions.length; i = i + 3) {
        morphedPositions.push(...[
            (1 - t) * positions[i] + t * spherePositions[i],
            (1 - t) * positions[i+1] + t * spherePositions[i+1],
            (1 - t) * positions[i+2] + t * spherePositions[i+2]
        ]);

        if((i+3) % 9 == 0 && i > 0) { // for each faces, compute normals

            let a = [
                morphedPositions[i] - morphedPositions[i-3],
                morphedPositions[i+1] - morphedPositions[i+1-3],
                morphedPositions[i+2] - morphedPositions[i+2-3],
            ];

            let b = [
                morphedPositions[i] - morphedPositions[i-6],
                morphedPositions[i+1] - morphedPositions[i+1-6],
                morphedPositions[i+2] - morphedPositions[i+2-6],
            ];

            normal = normalize_([
                // a2*b3 - a3*b2
                a[1] * b[2] - a[2] * b[1],
                // -(a1*b3 - a3*b1)
                -(a[0] * b[2] - a[2] * b[0]),
                // a1*b2 - a2*b1
                a[0] * b[1] - a[1] * b[0],
            ]);

            /*
            normals.push(...[
                Math.abs(normal[0]), Math.abs(normal[1]), Math.abs(normal[2]),
                Math.abs(normal[0]), Math.abs(normal[1]), Math.abs(normal[2]),
                Math.abs(normal[0]), Math.abs(normal[1]), Math.abs(normal[2]),
            ]);
            */

            normals.push(...[
                normal[0], normal[1], normal[2],
                normal[0], normal[1], normal[2],
                normal[0], normal[1], normal[2],
            ]);
        }
        
    }

    // fill 9 missing ! (= last 1 triangle)
    const len = morphedPositions.length;
    let a = [
        morphedPositions[len-3] - morphedPositions[len-6],
        morphedPositions[len+1-3] - morphedPositions[len+1-6],
        morphedPositions[len+2-3] - morphedPositions[len+2-6],
    ];

    let b = [
        morphedPositions[len-3] - morphedPositions[len-9],
        morphedPositions[len+1-3] - morphedPositions[len+1-9],
        morphedPositions[len+2-3] - morphedPositions[len+2-9],
    ];
    normal = normalize_([
        // a2*b3 - a3*b2
        a[1] * b[2] - a[2] * b[1],
        // -(a1*b3 - a3*b1)
        -(a[0] * b[2] - a[2] * b[0]),
        // a1*b2 - a2*b1
        a[0] * b[1] - a[1] * b[0],
    ]);
    // missing 9 ...
    normals.push(...[
        normal[0], normal[1], normal[2],
        normal[0], normal[1], normal[2],
        normal[0], normal[1], normal[2],
    ]);

    // same sizes !
    //console.log("morphedPositions:", morphedPositions);
    //console.log("normals:", normals);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(morphedPositions), gl.DYNAMIC_DRAW);

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);



    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    // Put normals data into buffer
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.DYNAMIC_DRAW);
    
    gl.enableVertexAttribArray(normalLocation);
    gl.vertexAttribPointer(normalLocation, size, type, normalize, stride, offset);
   
    //
    // Draw call ?
    //
    gl.drawArrays(gl.TRIANGLES, offset, morphedPositions.length);

    if(t >= 1) {
        clearInterval(intervalId);
        console.log("Finished !");
    }
}




function normalize_(v, dst) {
    dst = dst || new Float32Array(3);
    var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    // make sure we don't divide by 0.
    if (length > 0.00001) {
      dst[0] = v[0] / length;
      dst[1] = v[1] / length;
      dst[2] = v[2] / length;
    }
    return dst;
}    


let t = 0, intervalId;

let Z_ROT = 0, Y_ROT = 0, X_ROT = 0;

let canvas, gl;


function main() {

    canvas = document.querySelector("#canvas");
    
    gl = canvas.getContext("webgl");
    if (!gl) {
        alert('No WebGL');
    }

    canvas.width = 500;
    canvas.height = 500;

    document.querySelector('#myRange').addEventListener('change', function(event) {
        t = event.target.value / 100;
        console.log(t);
        showMorphing(gl, positions, spherePositions, positionBuffer, positionAttributeLocation, normalBuffer, normalLocation)
    });

    document.querySelector('#go_left').addEventListener('click', function(event) {

        Y_ROT += 10;

        t -= 1 / (24 * 2);

        var rotationLocation = gl.getUniformLocation(program, "u_rotation");
        var rotation = matmul(rotations.z(degToRad(Z_ROT)), rotations.y(degToRad(Y_ROT)));
        rotation = matmul(rotation, rotations.x(degToRad(X_ROT)));
        console.log("rotation:", rotation);

        // Set the rotation.
        gl.uniformMatrix4fv(rotationLocation, false, rotation);

        showMorphing(gl, positions, spherePositions, positionBuffer, positionAttributeLocation, normalBuffer, normalLocation)
    });


    document.querySelector('#go_right').addEventListener('click', function(event) {

        Y_ROT -= 10;

        t -= 1 / (24 * 2);

        var rotationLocation = gl.getUniformLocation(program, "u_rotation");
        var rotation = matmul(rotations.z(degToRad(Z_ROT)), rotations.y(degToRad(Y_ROT)));
        rotation = matmul(rotation, rotations.x(degToRad(X_ROT)));
        console.log("rotation:", rotation);

        // Set the rotation.
        gl.uniformMatrix4fv(rotationLocation, false, rotation);

        showMorphing(gl, positions, spherePositions, positionBuffer, positionAttributeLocation, normalBuffer, normalLocation)
    });

    document.querySelector('#go_up').addEventListener('click', function(event) {

        X_ROT -= 10;

        t -= 1 / (24 * 2);

        var rotationLocation = gl.getUniformLocation(program, "u_rotation");
        var rotation = matmul(rotations.z(degToRad(Z_ROT)), rotations.y(degToRad(Y_ROT)));
        rotation = matmul(rotation, rotations.x(degToRad(X_ROT)));
        console.log("rotation:", rotation);

        // Set the rotation.
        gl.uniformMatrix4fv(rotationLocation, false, rotation);

        showMorphing(gl, positions, spherePositions, positionBuffer, positionAttributeLocation, normalBuffer, normalLocation)
    });

    document.querySelector('#go_down').addEventListener('click', function(event) {

        X_ROT += 10;

        t -= 1 / (24 * 2);

        var rotationLocation = gl.getUniformLocation(program, "u_rotation");
        var rotation = matmul(rotations.z(degToRad(Z_ROT)), rotations.y(degToRad(Y_ROT)));
        rotation = matmul(rotation, rotations.x(degToRad(X_ROT)));
        console.log("rotation:", rotation);

        // Set the rotation.
        gl.uniformMatrix4fv(rotationLocation, false, rotation);

        showMorphing(gl, positions, spherePositions, positionBuffer, positionAttributeLocation, normalBuffer, normalLocation)
    });



    gl.canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        //console.log("mouse (X, Y) :", mouseX, mouseY);

        const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
        const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;
        const data = new Uint8Array(4);
        console.log("pixel: ", pixelX, pixelY);
        gl.readPixels(
            pixelX,            // x
            pixelY,            // y
            1,                 // width
            1,                 // height
            gl.RGBA,           // format
            gl.UNSIGNED_BYTE,  // type
            data);             // typed array to hold result
        const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);
        console.log("id:", id, "data:", data);
     });

     console.warn(document.querySelector('input[name=shading]'));
     document.querySelectorAll('input[name=shading]').forEach((input) => {
        input.addEventListener('change', function(e) {
            start(e.target.value);
        });
    });

    const shadingType = document.querySelector('input[name=shading]:checked').value;
    start(shadingType);
}

let program,
    positions,
    spherePositions,
    positionBuffer,
    positionAttributeLocation,
    positionAttributeLocation_2,
    normalBuffer,
    normalLocation;

function start(shadingType='flat') {

    t = 0;

    const vertexShaderSource = document.querySelector('#vertex-shader-'+shadingType).textContent;
    const fragmentShaderSource = document.querySelector('#fragment-shader-'+shadingType).textContent;

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    program = createProgram(gl, vertexShader, fragmentShader);

     // PICKER
    const vertexShaderPickerSource = document.querySelector('#vertex-shader-picker').textContent;
    const fragmentShaderPickerSource = document.querySelector('#fragment-shader-picker').textContent;
    var vertexShaderPicker = createShader(gl, gl.VERTEX_SHADER, vertexShaderPickerSource);
    var fragmentShaderPicker = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderPickerSource);
    var programPicker = createProgram(gl, vertexShaderPicker, fragmentShaderPicker);




    // vertex/geometry positions
    positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    // normal buffers
    normalLocation = gl.getAttribLocation(program, "a_normal");

    positionBuffer = gl.createBuffer();
    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const posX = 0;
    const posY = 0;
    const posZ = 0;
    const cubeWidth = 100;

    positions = [
        // Front
        ...generateAGridOfTriangles(posX, posX + cubeWidth, posY, posY + cubeWidth, posZ, posZ),
        // Left Side
        ...generateAGridOfTriangles(posX, posX, posY, posY + cubeWidth, posZ, posZ + cubeWidth),
        // Right Side
        ...generateAGridOfTriangles(posX + cubeWidth, posX + cubeWidth, posY, posY + cubeWidth, posZ, posZ + cubeWidth, true),
        // Back
        ...generateAGridOfTriangles(posX, posX + cubeWidth, posY, posY + cubeWidth, posZ+cubeWidth, posZ+cubeWidth, true),
        // Bottom
        ...generateAGridOfTriangles(posX, posX + cubeWidth, posY + cubeWidth, posY + cubeWidth, posZ, posZ + cubeWidth, true),
        // Top
        ...generateAGridOfTriangles(posX, posX + cubeWidth, posY, posY, posZ, posZ + cubeWidth),
    ];

    //
    // https://stackoverflow.com/questions/14941529/morph-cube-into-sphere
    //
    spherePositions = []
    for(let a = 0; a < positions.length; a = a + 3) {
        let x = positions[a];
        let y = positions[a+1];
        let z = positions[a+2];

        const d = Math.sqrt((x-50)**2+(y-50)**2+(z-50)**2);

        const theta = Math.acos((z-50)/d);
        const phi = Math.atan2(y-50, x-50); // with Math.atan(y/x) -> don't work ...

        spherePositions.push(...[
            cubeWidth * Math.sin(theta) * Math.cos(phi) + 50,
            cubeWidth * Math.sin(theta) * Math.sin(phi) + 50,
            cubeWidth * Math.cos(theta) + 50
        ]);
    }



    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);



    gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);


    //
    // PICKER PROGRAM
    //
    gl.useProgram(programPicker);

    // object id
    var idLocation = gl.getUniformLocation(programPicker, "u_id");
    // projection matrix
    var matrixLocation = gl.getUniformLocation(programPicker, "u_matrix");
    // vertex/geometry positions
    positionAttributeLocation_2 = gl.getAttribLocation(programPicker, "a_position"); // ???

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);

    // ?
    gl.enableVertexAttribArray(positionAttributeLocation_2);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 3;          // 2/3? components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(positionAttributeLocation_2, size, type, normalize, stride, offset)




    // Set the translation.
    var translationLocation_picker = gl.getUniformLocation(programPicker, "u_translation");
    var translation = [200, 150, 0];
    gl.uniform3fv(translationLocation_picker, translation);
    //
    // ROTATION !
    //
    // Set the rotation.
    var rotationLocation_picker = gl.getUniformLocation(programPicker, "u_rotation");
    var rotation = matmul(rotations.z(degToRad(Z_ROT)), rotations.y(degToRad(Y_ROT)));
    rotation = matmul(rotation, rotations.x(degToRad(X_ROT)));
    gl.uniformMatrix4fv(rotationLocation_picker, false, rotation);
    
    // ID of the object ?!
    const id = 2;
    const u_id = [((id >>  0) & 0xFF) / 0xFF,
        ((id >>  8) & 0xFF) / 0xFF,
        ((id >> 16) & 0xFF) / 0xFF,
        ((id >> 24) & 0xFF) / 0xFF];
    gl.uniform4fv(idLocation, u_id);



    gl.drawArrays(gl.TRIANGLES, offset, positions.length);







    //
    // Tell it to use our (main...) program (pair of shaders)
    //
    gl.useProgram(program);
 
    // Set the translation.
    var translationLocation = gl.getUniformLocation(program, "u_translation");
    var translation = [200, 150, 0];

    //
    // ROTATION !
    //
    var rotationLocation = gl.getUniformLocation(program, "u_rotation");
    var rotation = matmul(rotations.z(degToRad(Z_ROT)), rotations.y(degToRad(Y_ROT)));
    rotation = matmul(rotation, rotations.x(degToRad(X_ROT)));
    console.log("rotation:", rotation);


    const depth = 400; // ???

    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    var colorUniformLocation = gl.getUniformLocation(program, "u_color");
    var reverseLightDirectionLocation = gl.getUniformLocation(program, "u_reverseLightDirection");
    var matrixLocation = gl.getUniformLocation(program, "u_matrix");
    
    //
    // PROJECTION !
    //
    var matrix = [
        2 / gl.canvas.clientWidth, 0, 0, 0,
        0, -2 / gl.canvas.clientHeight, 0, 0,
        0, 0, 2 / depth, 0,
       -1, 1, 0, 1,
    ]

    
    // Set the translation
    gl.uniform3fv(translationLocation, translation);
    // set the resolution
    gl.uniform2f(resolutionUniformLocation, gl.canvas.clientWidth, gl.canvas.clientHeight);
    // Set the rotation.
    gl.uniformMatrix4fv(rotationLocation, false, rotation);
    // random color (uniform)
    gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);
    // set the light direction.
    gl.uniform3fv(reverseLightDirectionLocation, normalize_([0.5, 0.7, 1]));
    // Set the matrix. (projection + ???)
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    


    // ?
    gl.enableVertexAttribArray(positionAttributeLocation);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 3;          // 2/3? components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)



    
    // Create a buffer to put normals in
    normalBuffer = gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = normalBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

    gl.enableVertexAttribArray(normalLocation);

    // Tell the attribute how to get data out of normalBuffer (ARRAY_BUFFER)
    var size = 3;          // 3 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floating point values
    var normalize = false; // normalize the data (convert from 0-255 to 0-1)
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(normalLocation, size, type, normalize, stride, offset);







 
    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.CULL_FACE); // turned on culling to draw only one side of the triangles ?!
    gl.enable(gl.DEPTH_TEST); // Z-buffer

    t = 0; // init

    intervalId = setInterval(() => showMorphing(gl, positions, spherePositions, positionBuffer, positionAttributeLocation, normalBuffer, normalLocation), 1000 / 24);

}

document.addEventListener("DOMContentLoaded", (event) => {
    main();
});
