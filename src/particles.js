const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute float a_size;
  attribute float a_alpha;
  attribute float a_phase;

  uniform vec2 u_resolution;
  uniform float u_time;

  varying float v_alpha;

  void main() {
    float drift = sin(u_time * 0.3 + a_phase) * 2.0;
    float driftY = cos(u_time * 0.2 + a_phase * 1.3) * 1.5;

    vec2 pos = a_position + vec2(drift, driftY);
    vec2 clip = (pos / u_resolution) * 2.0 - 1.0;
    clip.y *= -1.0;

    gl_Position = vec4(clip, 0.0, 1.0);
    gl_PointSize = a_size;
    v_alpha = a_alpha;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying float v_alpha;

  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;

    float edge = smoothstep(0.5, 0.3, dist);
    gl_FragColor = vec4(1.0, 1.0, 1.0, v_alpha * edge);
  }
`;

export class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      premultipliedAlpha: false,
    });
    if (!this.gl) throw new Error('WebGL not supported');

    this.count = 0;
    this.positions = null;
    this.basePositions = null;
    this.sizes = null;
    this.alphas = null;
    this.phases = null;
    this.hoveredIndex = -1;
    this.hoverScale = 0;
    this.time = 0;

    this._initGL();
  }

  _initGL() {
    const gl = this.gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const vs = this._compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = this._compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    this.program = gl.createProgram();
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);
    gl.useProgram(this.program);

    this.a_position = gl.getAttribLocation(this.program, 'a_position');
    this.a_size = gl.getAttribLocation(this.program, 'a_size');
    this.a_alpha = gl.getAttribLocation(this.program, 'a_alpha');
    this.a_phase = gl.getAttribLocation(this.program, 'a_phase');
    this.u_resolution = gl.getUniformLocation(this.program, 'u_resolution');
    this.u_time = gl.getUniformLocation(this.program, 'u_time');

    this.posBuffer = gl.createBuffer();
    this.sizeBuffer = gl.createBuffer();
    this.alphaBuffer = gl.createBuffer();
    this.phaseBuffer = gl.createBuffer();
  }

  _compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  init(count, width, height) {
    this.count = count;
    this.width = width;
    this.height = height;

    const cols = Math.ceil(Math.sqrt(count * (width / height)));
    const rows = Math.ceil(count / cols);
    const cellW = width / cols;
    const cellH = height / rows;

    this.positions = new Float32Array(count * 2);
    this.basePositions = new Float32Array(count * 2);
    this.sizes = new Float32Array(count);
    this.alphas = new Float32Array(count);
    this.baseAlphas = new Float32Array(count);
    this.phases = new Float32Array(count);
    this.visible = new Uint8Array(count).fill(1);

    this.cols = cols;
    this.rows = rows;
    this.cellW = cellW;
    this.cellH = cellH;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = (col + 0.5) * cellW + (Math.random() - 0.5) * cellW * 0.6;
      const y = (row + 0.5) * cellH + (Math.random() - 0.5) * cellH * 0.6;

      this.basePositions[i * 2] = x;
      this.basePositions[i * 2 + 1] = y;
      this.positions[i * 2] = x;
      this.positions[i * 2 + 1] = y;

      this.sizes[i] = 2.5 + Math.random() * 2.0;
      const a = 0.4 + Math.random() * 0.45;
      this.alphas[i] = a;
      this.baseAlphas[i] = a;
      this.phases[i] = Math.random() * Math.PI * 2;
    }

    this._uploadBuffers();
  }

  _uploadBuffers() {
    const gl = this.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.sizes, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.alphaBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.alphas, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.phaseBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.phases, gl.STATIC_DRAW);
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);

    if (this.count > 0) {
      const oldW = this.width;
      const oldH = this.height;
      this.width = width;
      this.height = height;

      const sx = width / oldW;
      const sy = height / oldH;
      for (let i = 0; i < this.count; i++) {
        this.basePositions[i * 2] *= sx;
        this.basePositions[i * 2 + 1] *= sy;
        this.positions[i * 2] = this.basePositions[i * 2];
        this.positions[i * 2 + 1] = this.basePositions[i * 2 + 1];
      }

      this.cols = Math.ceil(Math.sqrt(this.count * (width / height)));
      this.rows = Math.ceil(this.count / this.cols);
      this.cellW = width / this.cols;
      this.cellH = height / this.rows;
    }
  }

  setVisible(index, vis) {
    this.visible[index] = vis ? 1 : 0;
    if (!vis) {
      this.alphas[index] = 0;
      this.sizes[index] = 0;
    } else {
      this.alphas[index] = this.baseAlphas[index];
      this.sizes[index] = 2.5 + Math.random() * 2.0;
    }
  }

  setHovered(index) {
    if (this.hoveredIndex !== index) {
      if (this.hoveredIndex >= 0) {
        this.sizes[this.hoveredIndex] = 3.0;
        this.alphas[this.hoveredIndex] = 0.5;
      }
      this.hoveredIndex = index;
      this.hoverScale = 0;
    }
  }

  render(dt) {
    const gl = this.gl;
    this.time += dt;

    if (this.hoveredIndex >= 0) {
      this.hoverScale = Math.min(1, this.hoverScale + dt * 4);
      this.sizes[this.hoveredIndex] = 2.5 + this.hoverScale * 8;
      this.alphas[this.hoveredIndex] = 0.5 + this.hoverScale * 0.5;
    }

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.uniform2f(this.u_resolution, this.width, this.height);
    gl.uniform1f(this.u_time, this.time);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.positions);
    gl.enableVertexAttribArray(this.a_position);
    gl.vertexAttribPointer(this.a_position, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.sizes);
    gl.enableVertexAttribArray(this.a_size);
    gl.vertexAttribPointer(this.a_size, 1, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.alphaBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.alphas);
    gl.enableVertexAttribArray(this.a_alpha);
    gl.vertexAttribPointer(this.a_alpha, 1, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.phaseBuffer);
    gl.enableVertexAttribArray(this.a_phase);
    gl.vertexAttribPointer(this.a_phase, 1, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, this.count);
  }

  getIndexAt(mx, my) {
    const col = Math.floor(mx / this.cellW);
    const row = Math.floor(my / this.cellH);

    let bestDist = 30 * 30;
    let bestIdx = -1;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) continue;

        const idx = r * this.cols + c;
        if (idx >= this.count || !this.visible[idx]) continue;

        const phase = this.phases[idx];
        const drift = Math.sin(this.time * 0.3 + phase) * 2.0;
        const driftY = Math.cos(this.time * 0.2 + phase * 1.3) * 1.5;

        const px = this.basePositions[idx * 2] + drift;
        const py = this.basePositions[idx * 2 + 1] + driftY;
        const dx = mx - px;
        const dy = my - py;
        const dist = dx * dx + dy * dy;

        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      }
    }

    return bestIdx;
  }
}
