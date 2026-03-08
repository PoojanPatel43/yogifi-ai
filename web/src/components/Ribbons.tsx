/**
 * Ribbons — autonomous WebGL ribbon trails for hero background effects.
 *
 * Each ribbon is a triangle-strip drawn along a wandering spine path.
 * Motion: organic angular-velocity wander with soft edge bounce.
 * Shading: per-vertex alpha (quadratic fade tail→head) + optional vertex
 *           wave displacement for shimmer on the y-axis.
 *
 * Mobile: renders null below 768 px for performance.
 */
import { useEffect, useRef, useState } from 'react';

// ── Public API ────────────────────────────────────────────────────────────────
export interface RibbonsProps {
  /** Hex color strings, one ribbon pair per entry. */
  colors?: string[];
  /** Width of ribbon at the head (px). Tapers to 25% at the tail. */
  baseThickness?: number;
  /** Multiplies base speed of 3 px/frame. */
  speedMultiplier?: number;
  /** Max spine-point count = ribbon trail length. */
  maxAge?: number;
  /** Quadratic alpha fade tail → head. */
  enableFade?: boolean;
  /** Vertex-shader wave displacement along Y. */
  enableShaderEffect?: boolean;
  /** Amplitude of shader wave in px (canvas pixels). */
  effectAmplitude?: number;
  /** WebGL clear color [r, g, b, a] normalised 0–1. */
  backgroundColor?: [number, number, number, number];
}

// ── GLSL ─────────────────────────────────────────────────────────────────────
const VERT = /* glsl */ `
  attribute vec2  a_pos;
  attribute float a_alpha;
  attribute vec3  a_color;

  uniform vec2  u_res;
  uniform float u_time;    /* seconds */
  uniform float u_amp;
  uniform float u_shader;  /* 1.0 = on, 0.0 = off */

  varying float v_alpha;
  varying vec3  v_color;

  void main() {
    vec2 p = a_pos;
    if (u_shader > 0.5) {
      /* Subtle perpendicular shimmer wave */
      p.y += sin(p.x * 0.007 + u_time * 1.4) * u_amp * 3.0;
    }
    /* Pixel coords → clip space (Y flipped so +Y is screen-down) */
    vec2 clip = (p / u_res) * 2.0 - 1.0;
    gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
    v_alpha = a_alpha;
    v_color = a_color;
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  varying float v_alpha;
  varying vec3  v_color;

  void main() {
    gl_FragColor = vec4(v_color, v_alpha);
  }
`;

// ── WebGL helpers ─────────────────────────────────────────────────────────────
function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('[Ribbons] shader compile error:', gl.getShaderInfoLog(s));
  }
  return s;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  const p = gl.createProgram()!;
  gl.attachShader(p, compileShader(gl, gl.VERTEX_SHADER,   VERT));
  gl.attachShader(p, compileShader(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(p);
  return p;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16 & 0xff) / 255, (n >> 8 & 0xff) / 255, (n & 0xff) / 255];
}

// ── Ribbon entity ─────────────────────────────────────────────────────────────
interface Pt { x: number; y: number }

class RibbonEntity {
  pts:    Pt[]                      = [];
  color:  [number, number, number];
  speed:  number;
  angle:  number;
  angVel: number;

  constructor(x: number, y: number, color: [number, number, number], speed: number) {
    this.color  = color;
    this.speed  = speed;
    this.angle  = Math.random() * Math.PI * 2;
    this.angVel = (Math.random() - 0.5) * 0.03;
    this.pts.push({ x, y });
  }

  advance(w: number, h: number, maxPts: number) {
    /* Organic wander: small random angular perturbation + damping */
    this.angVel += (Math.random() - 0.5) * 0.004;
    this.angVel *= 0.97;
    this.angle  += this.angVel;

    const head = this.pts[this.pts.length - 1];
    const MARGIN = 80; // px beyond edge before bounce

    /* Soft bounce: reflect angle when heading out-of-bounds */
    const nextX = head.x + Math.cos(this.angle) * this.speed;
    const nextY = head.y + Math.sin(this.angle) * this.speed;
    if (nextX < -MARGIN || nextX > w + MARGIN) this.angle = Math.PI - this.angle;
    if (nextY < -MARGIN || nextY > h + MARGIN) this.angle = -this.angle;

    this.pts.push({
      x: head.x + Math.cos(this.angle) * this.speed,
      y: head.y + Math.sin(this.angle) * this.speed,
    });
    if (this.pts.length > maxPts) this.pts.shift();
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
const Ribbons = ({
  colors             = ['#C9472F', '#D4CFC6', '#1A1816'],
  baseThickness      = 25,
  speedMultiplier    = 0.4,
  maxAge             = 500,
  enableFade         = true,
  enableShaderEffect = true,
  effectAmplitude    = 1.2,
  backgroundColor    = [0.969, 0.957, 0.933, 0] as [number, number, number, number],
}: RibbonsProps) => {

  /* Disable on mobile for performance */
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768,
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* Stable ref for render-loop config — avoids tearing WebGL down on prop changes */
  const cfgRef = useRef({
    colors, baseThickness, speedMultiplier, maxAge,
    enableFade, enableShaderEffect, effectAmplitude, backgroundColor,
  });
  /* Sync ref every render so the loop always reads the latest values */
  cfgRef.current = {
    colors, baseThickness, speedMultiplier, maxAge,
    enableFade, enableShaderEffect, effectAmplitude, backgroundColor,
  };

  useEffect(() => {
    if (isMobile) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── WebGL context ──────────────────────────────────────────────────────
    const gl = canvas.getContext('webgl', {
      antialias:         true,
      alpha:             true,
      premultipliedAlpha: false,
    });
    if (!gl) { console.warn('[Ribbons] WebGL not available'); return; }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const prog = createProgram(gl);
    gl.useProgram(prog);

    // Attribute + uniform locations
    const aPos    = gl.getAttribLocation(prog, 'a_pos');
    const aAlpha  = gl.getAttribLocation(prog, 'a_alpha');
    const aColor  = gl.getAttribLocation(prog, 'a_color');
    const uRes    = gl.getUniformLocation(prog, 'u_res');
    const uTime   = gl.getUniformLocation(prog, 'u_time');
    const uAmp    = gl.getUniformLocation(prog, 'u_amp');
    const uShader = gl.getUniformLocation(prog, 'u_shader');

    // Interleaved vertex layout: [posX, posY, alpha, r, g, b] = 6 × f32 = 24 bytes
    const STRIDE = 6 * 4;
    const vbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos,   2, gl.FLOAT, false, STRIDE, 0);
    gl.enableVertexAttribArray(aAlpha);
    gl.vertexAttribPointer(aAlpha, 1, gl.FLOAT, false, STRIDE, 8);
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, STRIDE, 12);

    // ── Canvas sizing (ResizeObserver for efficiency) ──────────────────────
    const resize = () => {
      const r   = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap 2× — perf
      canvas.width  = Math.round(r.width  * dpr);
      canvas.height = Math.round(r.height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ── Init ribbons — 2 per color for visual density ──────────────────────
    const { colors: cols, speedMultiplier: sm, maxAge: ma } = cfgRef.current;
    const BASE_SPEED = 3; // px/frame at multiplier 1.0
    const ribbons: RibbonEntity[] = [];

    cols.forEach(hex => {
      const rgb = hexToRgb(hex);
      for (let i = 0; i < 2; i++) {
        const x   = Math.random() * canvas.width;
        const y   = Math.random() * canvas.height;
        const spd = BASE_SPEED * sm * (0.75 + Math.random() * 0.5);
        ribbons.push(new RibbonEntity(x, y, rgb, spd));
      }
    });

    /* Pre-warm to full trail length so ribbons appear immediately at page load
       rather than growing from a single point. */
    const W0 = canvas.width, H0 = canvas.height;
    for (const r of ribbons) {
      for (let i = 0; i < ma; i++) r.advance(W0, H0, ma);
    }

    // ── Render loop ────────────────────────────────────────────────────────
    let rafId: number;
    const t0 = performance.now();

    const render = (now: number) => {
      rafId = requestAnimationFrame(render);

      const {
        baseThickness: bT, maxAge: mA,
        enableFade: eF, enableShaderEffect: eSE,
        effectAmplitude: eA, backgroundColor: bg,
      } = cfgRef.current;

      const cW = canvas.width, cH = canvas.height;
      const t  = (now - t0) / 1000; // seconds

      gl.clearColor(bg[0], bg[1], bg[2], bg[3]);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform2f(uRes,    cW, cH);
      gl.uniform1f(uTime,   t);
      gl.uniform1f(uAmp,    eA);
      gl.uniform1f(uShader, eSE ? 1.0 : 0.0);

      for (const ribbon of ribbons) {
        ribbon.advance(cW, cH, mA);

        const pts = ribbon.pts;
        const N   = pts.length;
        if (N < 2) continue;

        /* Triangle strip: 2 vertices (left + right edge) per spine point */
        const data = new Float32Array(N * 2 * 6);
        let vi = 0;

        for (let i = 0; i < N; i++) {
          const t_i  = i / (N - 1);              // 0 = tail, 1 = head
          const alpha = eF ? t_i * t_i : 1.0;   // quadratic fade
          const half  = (bT * (0.25 + 0.75 * t_i)) / 2; // taper

          /* Central-difference tangent; forward/backward at endpoints */
          let dx: number, dy: number;
          if      (i === 0)     { dx = pts[1].x   - pts[0].x;     dy = pts[1].y   - pts[0].y;     }
          else if (i === N - 1) { dx = pts[N-1].x - pts[N-2].x;   dy = pts[N-1].y - pts[N-2].y;   }
          else                  { dx = pts[i+1].x - pts[i-1].x;   dy = pts[i+1].y - pts[i-1].y;   }

          const len = Math.hypot(dx, dy) || 1;
          const px  = -dy / len; // unit perpendicular
          const py  =  dx / len;

          const [cr, cg, cb] = ribbon.color;

          /* Left edge vertex */
          data[vi++] = pts[i].x + px * half;
          data[vi++] = pts[i].y + py * half;
          data[vi++] = alpha;
          data[vi++] = cr; data[vi++] = cg; data[vi++] = cb;

          /* Right edge vertex */
          data[vi++] = pts[i].x - px * half;
          data[vi++] = pts[i].y - py * half;
          data[vi++] = alpha;
          data[vi++] = cr; data[vi++] = cg; data[vi++] = cb;
        }

        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, N * 2);
      }
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      gl.deleteBuffer(vbo);
      gl.deleteProgram(prog);
    };
  }, [isMobile]); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ Props are stable constants from the call-site; render loop reads
  //   latest values via cfgRef. Only re-init when mobile breakpoint changes.

  if (isMobile) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  );
};

export default Ribbons;
