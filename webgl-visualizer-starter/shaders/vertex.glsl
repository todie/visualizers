varying vec3 vOutputDirection;

void main() {
  vOutputDirection = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
