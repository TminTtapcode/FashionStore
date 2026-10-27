"use client";

import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react";

const vertSrc = `#version 300 es
precision highp float;
layout(location=0) in vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const fragSrc = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  u_res;
uniform float u_time;
uniform float u_speed;
uniform float u_intensity;
uniform float u_scroll;

// robust tanh fallback
float tanh1(float x){ float e = exp(2.0*x); return (e-1.0)/(e+1.0); }
vec4 tanh4(vec4 v){ return vec4(tanh1(v.x), tanh1(v.y), tanh1(v.z), tanh1(v.w)); }

void main(){
  vec3 FC = vec3(gl_FragCoord.xy, 0.0);
  vec3 r  = vec3(u_res, max(u_res.x, u_res.y));
  float t = u_time * u_speed;

  vec4 o = vec4(0.0);

  // Vivid 3D Runway light particles and floor reflections
  vec3 p = vec3(0.0);
  vec3 v = vec3(1.0, 2.0, 6.0);
  float i = 0.0, z = 1.0, d = 1.0, f = 1.0;

  for ( ; i++ < 48.0;
        o.rgb += (cos((p.x + z + v) * 0.1) + 1.0) / d / f / z )
  {
    p = z * normalize(FC * 2.0 - r.xyy);

    vec4 m = cos((p + sin(p)).y * 0.4 + vec4(0.0, 33.0, 11.0, 0.0));
    p.xz = mat2(m) * p.xz;

    p.x += t / 0.22 + u_scroll;

    z += ( d = length(cos(p / v) * v + v.zxx / 7.0) /
           ( f = 2.0 + d / exp(p.y * 0.2) ) );
  }

  o = tanh4(u_intensity * o);
  o.a = 1.0;
  fragColor = o;
}`;

export interface AtcShaderProps extends ComponentPropsWithoutRef<"div"> {
  speed?: number;
  intensity?: number;
  interactive?: boolean;
  overlayClassName?: string;
  enableScrollReactive?: boolean;
}

export default function AtcShader({
  speed = 0.42,
  intensity = 0.32,
  overlayClassName = "",
  enableScrollReactive = true,
  className = "",
  children,
  ...props
}: AtcShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webGlSupported, setWebGlSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const effectiveSpeed = prefersReducedMotion ? 0.05 : speed;

    const gl = canvas.getContext("webgl2", {
      premultipliedAlpha: false,
      alpha: true,
      powerPreference: "high-performance",
    });

    if (!gl) {
      setWebGlSupported(false);
      return;
    }

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(sh) || "compile error";
        gl.deleteShader(sh);
        throw new Error(info);
      }
      return sh;
    };

    const link = (vs: string, fs: string) => {
      const p = gl.createProgram()!;
      const vertShader = compile(gl.VERTEX_SHADER, vs);
      const fragShader = compile(gl.FRAGMENT_SHADER, fs);
      gl.attachShader(p, vertShader);
      gl.attachShader(p, fragShader);
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(p) || "link error";
        gl.deleteProgram(p);
        throw new Error(info);
      }
      return p;
    };

    let prog: WebGLProgram;
    try {
      prog = link(vertSrc, fragSrc);
    } catch (e) {
      console.error("Shader build error:", e);
      setWebGlSupported(false);
      return;
    }

    gl.useProgram(prog);

    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uSpeed = gl.getUniformLocation(prog, "u_speed");
    const uIntensity = gl.getUniformLocation(prog, "u_intensity");
    const uScroll = gl.getUniformLocation(prog, "u_scroll");

    gl.uniform1f(uSpeed, effectiveSpeed);
    gl.uniform1f(uIntensity, intensity);
    gl.uniform1f(uScroll, 0);

    // Scroll reactivity listener
    let targetScroll = 0;
    let currentScroll = 0;
    const onScroll = () => {
      if (enableScrollReactive) {
        targetScroll = (window.scrollY || 0) * 0.0028;
      }
    };
    if (enableScrollReactive) {
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    const resize = () => {
      if (!canvas) return;
      // Clamp pixel ratio to maximum 1.5 to guarantee high performance and low battery consumption
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      const w = Math.floor((canvas.clientWidth || window.innerWidth) * dpr);
      const h = Math.floor((canvas.clientHeight || window.innerHeight) * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    };

    window.addEventListener("resize", resize, { passive: true });
    resize();

    let raf = 0;
    const t0 = performance.now();
    let isVisible = true;

    // Pause when tab not visible to save GPU
    const handleVisibility = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const draw = () => {
      if (isVisible) {
        const t = (performance.now() - t0) / 1000;
        gl.uniform1f(uTime, t);

        if (enableScrollReactive) {
          currentScroll += (targetScroll - currentScroll) * 0.08;
          gl.uniform1f(uScroll, currentScroll);
        }

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", handleVisibility);
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, [speed, intensity]);

  return (
    <div className={`relative overflow-hidden ${className}`} {...props}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="w-full h-full block bg-black object-cover pointer-events-none"
      />
      {overlayClassName && (
        <div aria-hidden="true" className={`absolute inset-0 pointer-events-none ${overlayClassName}`} />
      )}
      {!webGlSupported && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#151518] to-[#0A0A0C]" />
      )}
      {children}
    </div>
  );
}
