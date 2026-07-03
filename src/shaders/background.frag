#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  uv = fract((uv - vec2(0.01, 0.0)) * 18.0 );
  uv = 1.0 - smoothstep(0.01, 0.02, uv);
  // vec3 col = 0.5 + 0.5 * cos(u_time + uv.xyx + vec3(0, 2, 4));
  // vec3 col = vec3(uv.x, uv.y, 0.0);
  vec3 col = vec3(0.09);

  float d = length(uv);

  vec3 debug = vec3(d, d, d);

  
  fragColor = vec4(debug, 1.0);
  
}
