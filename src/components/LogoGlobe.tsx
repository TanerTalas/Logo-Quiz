'use client';

/**
 * 3D Logo Globe Component
 * 
 * Renders an interactive HTML5 2D Canvas 3D sphere featuring orbiting brand tiles
 * with drag-to-rotate support, depth sorting, and customizable design tones.
 */

import React, { useEffect, useRef, useState } from 'react';
import { getLogoUrl, handleImageFallback } from '@/lib/gameData';

export interface LogoGlobeProps {
  tone?: 'ink' | 'onAccent' | 'ghost';
  speed?: number;
  tilt?: number;
  showDots?: boolean;
  interactive?: boolean;
  minTile?: number;
}

const BRAND_SLUGS = [
  'spotify',
  'bmw',
  'mcdonalds',
  'playstation',
  'netflix',
  'ferrari',
  'starbucks',
  'github',
  'twitch',
];

const INITIAL_BLURS = [3, 0, 2, 4, 0, 2.5, 0, 3.5, 1];

export const LogoGlobe: React.FC<LogoGlobeProps> = ({
  tone = 'ink',
  speed = 1,
  tilt = -16,
  showDots = true,
  interactive = true,
  minTile = 44,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // References for animation state
  const stateRef = useRef({
    yaw: 0,
    tiltOff: 0,
    dragging: false,
    hover: null as number | null,
    lastTime: 0,
    px: 0,
    py: 0,
  });

  // Keep stateRef in sync with hover state
  useEffect(() => {
    stateRef.current.hover = hoveredIdx;
  }, [hoveredIdx]);

  // Color tokens calculation according to tone prop
  const getTokens = () => {
    if (tone === 'onAccent') {
      return {
        dot: '#ffffff',
        edge: '#ffffff',
        tileBg: '#ffffff',
        tileBorder: '#ffffff',
        hoverBorder: '#201e1d',
        imgExtra: '',
        dotAlpha: 1.25,
        edgeAlpha: 1,
      };
    }
    if (tone === 'ghost') {
      return {
        dot: '#201e1d',
        edge: '#201e1d',
        tileBg: 'transparent',
        tileBorder: 'rgba(32, 30, 29, 0.4)',
        hoverBorder: '#ec3013',
        imgExtra: '',
        dotAlpha: 1,
        edgeAlpha: 0.7,
      };
    }
    return {
      dot: '#201e1d',
      edge: '#ec3013',
      tileBg: '#f3f2f2',
      tileBorder: '#201e1d',
      hoverBorder: '#ec3013',
      imgExtra: '',
      dotAlpha: 1,
      edgeAlpha: 1,
    };
  };

  useEffect(() => {
    const numLogos = BRAND_SLUGS.length;
    const tokens = getTokens();

    // Generate sphere points using Fibonacci spiral
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const generateSpherePoints = (n: number) => {
      const out: [number, number, number][] = [];
      for (let i = 0; i < n; i++) {
        const y = 1 - ((i + 0.5) * 2) / n;
        const r = Math.sqrt(1 - y * y);
        const theta = i * goldenAngle;
        out.push([Math.cos(theta) * r, y, Math.sin(theta) * r]);
      }
      return out;
    };

    const logoPoints = generateSpherePoints(numLogos);
    const bgDots = generateSpherePoints(320);

    // Build edge connections between nearby points
    const edgeSet = new Set<string>();
    for (let i = 0; i < numLogos; i++) {
      const distances = logoPoints
        .map((p, j) => [j, (p[0] - logoPoints[i][0]) ** 2 + (p[1] - logoPoints[i][1]) ** 2 + (p[2] - logoPoints[i][2]) ** 2])
        .filter((x) => x[0] !== i)
        .sort((a, b) => a[1] - b[1]);
      for (let k = 0; k < 2; k++) {
        edgeSet.add([Math.min(i, distances[k][0]), Math.max(i, distances[k][0])].join('-'));
      }
    }
    const edges = Array.from(edgeSet).map((s) => s.split('-').map(Number));

    // 3D rotation projection helper
    const focalLength = 3;
    const rotate3D = (p: [number, number, number], a: number, b: number): [number, number, number] => {
      const ca = Math.cos(a), sa = Math.sin(a);
      const x = p[0] * ca + p[2] * sa;
      const z = -p[0] * sa + p[2] * ca;
      const y = p[1];
      const cb = Math.cos(b), sb = Math.sin(b);
      return [x, y * cb - z * sb, y * sb + z * cb];
    };

    let animationFrameId: number;

    const renderLoop = (now: number) => {
      animationFrameId = requestAnimationFrame(renderLoop);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const st = stateRef.current;
      const dt = Math.min(100, now - (st.lastTime || now));
      st.lastTime = now;

      if (!st.dragging) {
        st.yaw += dt * 0.00012 * speed * (st.hover !== null ? 0.15 : 1);
      }

      const currentTilt = Math.max(-80, Math.min(80, tilt + st.tiltOff)) * (Math.PI / 180);
      const radius = Math.min(w, h) * 0.34;
      const cx = w / 2;
      const cy = h / 2;

      const projectPoint = (p: [number, number, number]) => {
        const q = rotate3D(p, st.yaw, currentTilt);
        const scale = focalLength / (focalLength - q[2]);
        return {
          x: cx + q[0] * radius * scale,
          y: cy + q[1] * radius * scale,
          s: scale,
          z: q[2],
        };
      };

      // Draw background sphere dots
      if (showDots) {
        ctx.fillStyle = tokens.dot;
        for (const d of bgDots) {
          const q = projectPoint(d);
          ctx.globalAlpha = Math.min(1, (0.05 + ((Math.max(0, q.z + 1) / 2) * 0.30)) * tokens.dotAlpha);
          const sz = q.z > 0 ? 3 : 2.2;
          ctx.fillRect(q.x - sz / 2, q.y - sz / 2, sz, sz);
        }
        ctx.globalAlpha = 1;
      }

      // Project logo node coordinates
      const projectedLogos = logoPoints.map(projectPoint);

      // Draw wireframe connecting edges
      ctx.strokeStyle = tokens.edge;
      for (const [i, j] of edges) {
        const zAvg = (projectedLogos[i].z + projectedLogos[j].z) / 2;
        ctx.globalAlpha = (0.18 + ((Math.max(0, zAvg + 1) / 2) * 0.72)) * tokens.edgeAlpha;
        ctx.lineWidth = zAvg > 0 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(projectedLogos[i].x, projectedLogos[i].y);
        ctx.lineTo(projectedLogos[j].x, projectedLogos[j].y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Position HTML brand logo DOM tiles
      const baseTileSize = Math.max(minTile, Math.min(w, h) * 0.085);
      for (let i = 0; i < numLogos; i++) {
        const el = logoRefs.current[i];
        if (!el) continue;
        const q = projectedLogos[i];
        const isHovered = st.hover === i;
        const scaleFactor = (baseTileSize * q.s) / 64 * (isHovered ? 1.18 : 1);

        el.style.transform = `translate(${q.x - 32 * scaleFactor}px, ${q.y - 32 * scaleFactor}px) scale(${scaleFactor})`;
        el.style.transformOrigin = '0 0';
        el.style.opacity = q.z > 0 ? '1' : String(0.30 + (q.z + 1) * 0.5);
        el.style.zIndex = isHovered ? '200' : String(100 + Math.round(q.z * 50));

        // Tile styling update
        el.style.background = tokens.tileBg;
        el.style.border = `2px solid ${isHovered ? tokens.hoverBorder : tokens.tileBorder}`;
        el.style.cursor = interactive ? 'pointer' : 'default';

        const img = el.querySelector('img');
        if (img) {
          const blurVal = isHovered ? 0 : INITIAL_BLURS[i];
          img.style.filter = `blur(${blurVal}px) grayscale(1)${tokens.imgExtra}`;
        }
      }
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [tone, speed, tilt, showDots, interactive, minTile]);

  // Pointer drag interaction handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !stageRef.current) return;
    stateRef.current.dragging = true;
    stateRef.current.px = e.clientX;
    stateRef.current.py = e.clientY;
    stageRef.current.setPointerCapture(e.pointerId);
    stageRef.current.style.cursor = 'grabbing';
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = stateRef.current;
    if (!st.dragging) return;
    st.yaw -= (e.clientX - st.px) * 0.005;
    st.tiltOff = Math.max(-60, Math.min(60, st.tiltOff + (e.clientY - st.py) * 0.25));
    st.px = e.clientX;
    st.py = e.clientY;
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    stateRef.current.dragging = false;
    if (stageRef.current) {
      stageRef.current.style.cursor = interactive ? 'grab' : 'default';
      if (stageRef.current.hasPointerCapture(e.pointerId)) {
        stageRef.current.releasePointerCapture(e.pointerId);
      }
    }
  };

  return (
    <div
      ref={stageRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: interactive ? 'auto' : 'none',
        cursor: interactive ? 'grab' : 'default',
        touchAction: 'none',
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {BRAND_SLUGS.map((slug, i) => (
        <div
          key={slug}
          ref={(el) => {
            logoRefs.current[i] = el;
          }}
          onPointerEnter={() => interactive && setHoveredIdx(i)}
          onPointerLeave={() => interactive && setHoveredIdx(null)}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '64px',
            height: '64px',
            display: 'grid',
            placeItems: 'center',
            willChange: 'transform, opacity',
            transition: 'border-color 0.15s ease',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getLogoUrl(slug)}
            alt={slug}
            onError={handleImageFallback}
            style={{
              width: '58%',
              height: '58%',
              objectFit: 'contain',
              transition: 'filter 0.2s ease',
            }}
          />
        </div>
      ))}
    </div>
  );
};
