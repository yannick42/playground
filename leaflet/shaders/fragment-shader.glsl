// All the varyings and variables in the vertex shader should be "high" (24 bit) precision
precision highp float;

varying float vColor;


// Passed in from the vertex shader.
varying vec2 v_texcoord;
uniform sampler2D u_texture;

// Get the varying from the vertex shader
varying vec2 vExtrudeCoords;

void main(void) {
	// Calculate the (square) distance to the marker's
	// center
	float radiusSquared =
    	vExtrudeCoords.x * vExtrudeCoords.x +
        vExtrudeCoords.y * vExtrudeCoords.y;

	// Make the pixel opaque only if inside the circle
    if (radiusSquared <= 1.0) {

        if (radiusSquared <= 0.4) {
            if(vColor == 1.0) { // green
                gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
            } else if (vColor == 2.0) { // orange
                gl_FragColor = vec4(1.0, 0.647, 0.0, 1.0);
            } else if (vColor == 3.0) { // red
                gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
            } else if (vColor == 4.0) { // grey
                gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
            }
        }
        else // outline
        {
            if(vColor == 1.0) { // darkgreen
                gl_FragColor = vec4(0.0, 0.392, 0.0, 1.0);
            } else if (vColor == 2.0) { // darkorange
                gl_FragColor = vec4(1.0, 0.55, 0.0, 1.0);
            } else if (vColor == 3.0) { // darkred
                gl_FragColor = vec4(0.545, 0.0, 0.0, 1.0);
            } else if (vColor == 4.0) { // darkgrey
                gl_FragColor = vec4(0.25, 0.25, 0.25, 1.0);
            }
        }
    } else {
		gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
}