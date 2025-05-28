const canvas = document.getElementById('gl-canvas');
const gl = canvas.getContext('webgl');
if (!gl) {
  alert('WebGL not supported');
}

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Vertex shader
const vsSource = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

// Fragment shader
const fsSource = `
precision mediump float;
varying vec2 vUv;
uniform float time;
uniform float audioData;
void main() {
  vec2 center = vec2(0.5, 0.5);
  float dist = distance(vUv, center);
  float radius = 0.3 + audioData * 0.3;
  float edge = 0.05;
  float alpha = 1.0 - smoothstep(radius, radius + edge, dist);
  float angle = atan(vUv.y - center.y, vUv.x - center.x);
  float gradient = 0.5 + 0.5 * sin(angle * 3.0 + time * 2.0 + audioData * 10.0);
  vec3 colorA = vec3(0.2, 0.4, 0.7);
  vec3 colorB = vec3(0.9, 0.2, 0.5);
  vec3 color = mix(colorA, colorB, gradient);
  gl_FragColor = vec4(color, alpha);
}`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

const program = createProgram(gl, vsSource, fsSource);
const positionLoc = gl.getAttribLocation(program, 'position');
const timeLoc = gl.getUniformLocation(program, 'time');
const audioLoc = gl.getUniformLocation(program, 'audioData');

const vertices = new Float32Array([
  -1, -1,
   1, -1,
  -1,  1,
   1,  1,
]);
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

// Audio setup
let audioData = 0.0;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let analyser;

navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
  const source = audioCtx.createMediaStreamSource(stream);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
}).catch(err => {
  console.error('Error accessing microphone:', err);
});

const dataArray = new Uint8Array(128);

function render(time) {
  time *= 0.001; // convert to seconds
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);
  gl.enableVertexAttribArray(positionLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

  if (analyser) {
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    audioData = sum / dataArray.length / 255.0;
  }

  gl.uniform1f(timeLoc, time);
  gl.uniform1f(audioLoc, audioData);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  requestAnimationFrame(render);
}

requestAnimationFrame(render);
