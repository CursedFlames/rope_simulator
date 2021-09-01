#version 300 es
precision highp float;
#define GLSLIFY 1

vec4 texture2D(sampler2D image, vec2 uv_0) {
	return texture_0(image, uv_0);
}

//#//pragma glslify: blur = require('glsl-fast-gaussian-blur/13')

in vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform vec2 direction;

layout(location = 0) out vec4 color_0;

const vec2 res = vec2(320., 180.);

void main() {
	vec2 uv = vec2(vTextureCoord.xy);
	color_0 = texture(uSampler, uv);//blur(uSampler, uv, res, direction);
}