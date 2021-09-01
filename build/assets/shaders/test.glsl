#define GLSLIFY 1
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 inputPixel;

void main() {
	gl_FragColor = texture2D(uSampler, vTextureCoord);
	// if (vTextureCoord.x*inputPixel.x > 64.0)
	// 	gl_FragColor += vec4((vTextureCoord.x*inputPixel.x-64.0)/128.0, 0.0, 2.0, 0.0);
	// gl_FragColor.b -= 2.0;
}