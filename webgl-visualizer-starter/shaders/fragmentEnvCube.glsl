precision mediump float;
precision mediump int;

varying vec3 vOutputDirection;
uniform samplerCube envMap;

void main() {
  gl_FragColor = vec4(0.0);
  gl_FragColor.rgb = envMapTexelToLinear(textureCube(envMap, vec3(-vOutputDirection.x, vOutputDirection.yz))).rgb;
  gl_FragColor = linearToOutputTexel(gl_FragColor);
}
