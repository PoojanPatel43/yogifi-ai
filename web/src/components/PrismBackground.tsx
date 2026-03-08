/**
 * PrismBackground — full-screen WebGL prism / light-diffraction effect.
 *
 * Renders diagonal spectral colour bands warped by multi-octave FBM noise.
 * Mouse position (inertia-smoothed) shifts the band origin for the 'hover'
 * animation type.  An IntersectionObserver suspends the RAF loop when the
 * canvas is offscreen (suspendWhenOffscreen:true).
 *
 * Mobile: renders null below 768 px for performance.
 */
import { useEffect, useRef, useState } from 'react';

// ── Public API ────────────────────────────────────────────────────────────────
export interface PrismBackgroundProps {
  animationType?:        'hover' | 'auto';
  hueShift?:             number;   // [0,1] rotates the entire colour wheel
  colorFrequency?:       number;   // band density
  glow?:                 number;   // luminosity boost from noise
  bloom?:                number;   // over-bright highlight boost
  noise?:                number;   // film-grain strength
  scale?:                number;   // FBM spatial scale
  timeScale?:            number;   // animation speed multiplier
  transparent?:          boolean;  // clear with alpha=0 so background shows through
  suspendWhenOffscreen?: boolean;
  inertia?:              number;   // mouse smoothing [0,1]; smaller = more lag
}

// ── GLSL ─────────────────────────────────────────────────────────────────────
const VERT = /* glsl */ `
  attribute vec2 a_pos;
  varying   vec2 v_uv;
  void main() {
    v_uv        = a_pos * 0.5 + 0.5;
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;

  uniform vec2  u_res;
  uniform vec2  u_mouse;  /* [0,1] normalised, inertia-smoothed */
  uniform float u_time;   /* seconds × timeScale                */
  uniform float u_hue;    /* hueShift                           */
  uniform float u_freq;   /* colorFrequency                     */
  uniform float u_glow;
  uniform float u_bloom;
  uniform float u_noise;
  uniform float u_scale;

  varying vec2 v_uv;

  /* ── Value noise ─────────────────────────────────────────────────────── */
  float h21(vec2 p) {
    p  = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 43.19);
    return fract(p.x * p.y);
  }
  float vn(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(h21(i),               h21(i + vec2(1.0, 0.0)), f.x),
      mix(h21(i + vec2(0.0,1.0)), h21(i + 1.0),          f.x),
      f.y
    );
  }
  /* 4-octave FBM */
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * vn(p); p *= 2.1; a *= 0.5; }
    return v;
  }

  /* ── HSL → RGB (IQ formula) ─────────────────────────────────────────── */
  vec3 hsl2rgb(float h, float s, float l) {
    float c = (1.0 - abs(2.0 * l - 1.0)) * s;
    vec3  k = mod(h * 6.0 + vec3(0.0, 8.0, 4.0), 6.0);
    return l + c * (clamp(min(k, 4.0 - k), 0.0, 1.0) - 0.5);
  }

  void main() {
    vec2 uv = v_uv;
    vec2 m  = u_mouse - 0.5;             /* centre mouse offset [-0.5,0.5] */

    /* Scale + mouse-warp the UV for noise sampling */
    vec2 p = uv * u_scale + m * 0.4;

    /* Layered FBM for organic warp texture */
    float n1  = fbm(p + u_time * 0.07);
    float n2  = fbm(p * 1.8 - u_time * 0.05 + vec2(3.7, 1.9));
    float tex = n1 * 0.6 + n2 * 0.4;

    /* Prism bands: project UV onto ~35° diagonal, warped by noise */
    vec2  dir  = normalize(vec2(cos(0.9), sin(0.9)));
    float proj = dot(uv - 0.5 + m * 0.25, dir);
    float band = proj * u_freq * 14.0 + tex * 3.5 + u_time * 0.4;

    /* Map sin to continuous [0,1] hue = full spectral cycle */
    float hue = fract(sin(band) * 0.5 + 0.5 + u_hue);
    float lum = clamp(0.18 + tex * u_glow * 0.55, 0.0, 0.70);

    vec3 col = hsl2rgb(hue, 1.0, lum);

    /* Bloom: boost already-bright regions for prismatic highlight */
    float bright = dot(col, vec3(0.299, 0.587, 0.114));
    col += max(0.0, bright - 0.42) * u_bloom * 2.8 * col;

    /* Film grain */
    float grain = (h21(uv * 800.0 + fract(u_time * 6.3)) - 0.5) * u_noise * 0.28;

    gl_FragColor = vec4(clamp(col + grain, 0.0, 1.0), 1.0);
  }
`;

// ── WebGL helpers ─────────────────────────────────────────────────────────────
function makeShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

function makeProgram(gl: WebGLRenderingContext): WebGLProgram {
  const p = gl.createProgram()!;
  gl.attachShader(p, makeShader(gl, gl.VERTEX_SHADER,   VERT));
  gl.attachShader(p, makeShader(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(p);
  return p;
}

// ── Component ─────────────────────────────────────────────────────────────────
const PrismBackground = ({
  animationType        = 'hover',
  hueShift             = 0.3,
  colorFrequency       = 0.8,
  glow                 = 0.6,
  bloom                = 0.8,
  noise                = 0.3,
  scale                = 4.0,
  timeScale            = 0.4,
  transparent          = true,
  suspendWhenOffscreen = true,
  inertia              = 0.04,
}: PrismBackgroundProps) => {

  /* Disable on mobile */
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768,
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* Stable cfg ref — render loop reads latest without re-init */
  const cfgRef = useRef({
    animationType, hueShift, colorFrequency, glow, bloom,
    noise, scale, timeScale, transparent, suspendWhenOffscreen, inertia,
  });
  cfgRef.current = {
    animationType, hueShift, colorFrequency, glow, bloom,
    noise, scale, timeScale, transparent, suspendWhenOffscreen, inertia,
  };

  useEffect(() => {
    if (isMobile) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── WebGL context ──────────────────────────────────────────────────────
    const gl = canvas.getContext('webgl', {
      antialias:          false, // FRAG does its own AA via noise
      alpha:              true,
      premultipliedAlpha: false,
    });
    if (!gl) { console.warn('[PrismBackground] WebGL not available'); return; }

    /* No blending needed — canvas sits behind a CSS opacity wrapper */
    const prog = makeProgram(gl);
    gl.useProgram(prog);

    const aPos    = gl.getAttribLocation(prog,  'a_pos');
    const uRes    = gl.getUniformLocation(prog,  'u_res');
    const uMouse  = gl.getUniformLocation(prog,  'u_mouse');
    const uTime   = gl.getUniformLocation(prog,  'u_time');
    const uHue    = gl.getUniformLocation(prog,  'u_hue');
    const uFreq   = gl.getUniformLocation(prog,  'u_freq');
    const uGlow   = gl.getUniformLocation(prog,  'u_glow');
    const uBloom  = gl.getUniformLocation(prog,  'u_bloom');
    const uNoise  = gl.getUniformLocation(prog,  'u_noise');
    const uScale  = gl.getUniformLocation(prog,  'u_scale');

    /* Full-screen quad: TRIANGLE_STRIP over 4 vertices */
    const vbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,   1, -1,   -1, 1,   1, 1,
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // ── Canvas sizing ──────────────────────────────────────────────────────
    const resize = () => {
      const r   = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width  = Math.round(r.width  * dpr);
      canvas.height = Math.round(r.height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ── Mouse tracking with inertia smoothing ─────────────────────────────
    let targetX = 0.5, targetY = 0.5;  // raw mouse target
    let smoothX = 0.5, smoothY = 0.5;  // inertia-smoothed value

    const onMouseMove = (e: MouseEvent) => {
      const r  = canvas.getBoundingClientRect();
      targetX  = (e.clientX - r.left) / r.width;
      targetY  = (e.clientY - r.top)  / r.height;
    };
    /* Only track mouse for hover animation type */
    if (animationType === 'hover') {
      window.addEventListener('mousemove', onMouseMove);
    }

    // ── IntersectionObserver — suspend when offscreen ──────────────────────
    let isVisible = true;
    let io: IntersectionObserver | null = null;
    if (suspendWhenOffscreen) {
      io = new IntersectionObserver(
        ([entry]) => { isVisible = entry.isIntersecting; },
        { threshold: 0.01 },
      );
      io.observe(canvas);
    }

    // ── Render loop ────────────────────────────────────────────────────────
    let rafId: number;
    const t0 = performance.now();

    const render = (now: number) => {
      rafId = requestAnimationFrame(render);
      if (!isVisible) return;

      const {
        hueShift: uH, colorFrequency: uF, glow: uG, bloom: uB,
        noise: uN, scale: uSc, timeScale: uTs, transparent: uTr, inertia: uI,
      } = cfgRef.current;

      /* Exponential mouse smoothing */
      smoothX += (targetX - smoothX) * uI;
      smoothY += (targetY - smoothY) * uI;

      const t = ((now - t0) / 1000) * uTs;

      const W = canvas.width, H = canvas.height;

      if (uTr) {
        gl.clearColor(0, 0, 0, 0);
      } else {
        gl.clearColor(0.102, 0.094, 0.086, 1); // --ink
      }
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform2f(uRes,   W, H);
      gl.uniform2f(uMouse, smoothX, smoothY);
      gl.uniform1f(uTime,  t);
      gl.uniform1f(uHue,   uH);
      gl.uniform1f(uFreq,  uF);
      gl.uniform1f(uGlow,  uG);
      gl.uniform1f(uBloom, uB);
      gl.uniform1f(uNoise, uN);
      gl.uniform1f(uScale, uSc);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      io?.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      gl.deleteBuffer(vbo);
      gl.deleteProgram(prog);
    };
  }, [isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isMobile) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  );
};

export default PrismBackground;
