attribute vec2 aCRSCoords;
attribute vec2 aExtrudeCoords;
uniform mat4 uTransformMatrix;
uniform vec2 uPixelSize;

attribute float size;
attribute float color;
varying float vColor;

attribute vec2 a_texcoord;
varying vec2 v_texcoord;

// A "varying" is a value that passes from the vertex shader to the frag shader.
// In this case, we want the interpolated extrude coords.
varying vec2 vExtrudeCoords;

void main(void) {
	// Copy the input extrude coords to the varying
    vExtrudeCoords = aExtrudeCoords;

    // Let the frag shader know about the other attribute
    vColor = color;

	gl_Position =
		uTransformMatrix * vec4(aCRSCoords, 1.0, 1.0) +
		vec4(aExtrudeCoords * uPixelSize * size, 0.0, 0.0);
}