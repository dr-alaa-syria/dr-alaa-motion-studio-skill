// عناصر بصرية مشتقة من نظام M الديناميكي: أعمدة البيانات (Data)، لوح القص المائل (Crop)، والمؤشر.
import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {brand} from './brand';
import {EASE, mix, prog} from './motion';

/** زاوية الخط المائل في الرمز (من أسفل اليسار إلى أعلى اليمين) بالدرجات */
export const BRAND_DIAGONAL_DEG = (() => {
  const accent = brand.logo.mark.parts.find((p) => p.role === 'accent');
  if (!accent || accent.type !== 'polygon') return 48;
  const pts = accent.points.trim().split(/\s+/).map((s) => s.split(',').map(Number));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const w = Math.max(...xs) - Math.min(...xs);
  const h = Math.max(...ys) - Math.min(...ys);
  return (Math.atan2(h, w) * 180) / Math.PI;
})();

/** أعمدة بيانات تصعد بالتتابع، وعمود واحد بلون التمييز (Data) */
export const DataBars: React.FC<{
  width: number;
  height: number;
  count?: number;
  start?: number;
  stagger?: number;
  color: string;
  accent: string;
  /** رقم العمود المميز (الافتراضي: الأعلى) */
  highlight?: number;
  seed?: string;
  gap?: number;
  /** تموّج بطيء بعد الظهور */
  live?: boolean;
}> = ({width, height, count = 9, start = 0, stagger = 2, color, accent, highlight, seed = 'bars', gap = 0.45, live = true}) => {
  const frame = useCurrentFrame();
  const heights = Array.from({length: count}, (_, i) => 0.25 + 0.75 * random(`${seed}-${i}`));
  const hi = highlight ?? heights.indexOf(Math.max(...heights));
  const bw = width / (count + (count - 1) * gap);
  return (
    <div style={{position: 'relative', width, height}}>
      {heights.map((h, i) => {
        const p = prog(frame, start + i * stagger, 14, EASE.backOut);
        const wobble = live ? 1 + 0.06 * Math.sin((frame - start) / 9 + i * 1.7) * Math.min(1, Math.max(0, p)) : 1;
        const hh = Math.max(0, height * h * p * wobble);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: i * bw * (1 + gap),
              bottom: 0,
              width: bw,
              height: Math.min(height, hh),
              background: i === hi ? accent : color,
            }}
          />
        );
      })}
    </div>
  );
};

/**
 * لوح بلون التمييز بحافة مائلة بزاوية الرمز يعبر الشاشة من اليمين لليسار (انتقال Crop).
 * p من 0 إلى 1: عند 0.5 يغطي الشاشة كلها.
 */
export const DiagonalWipe: React.FC<{p: number; color: string; pixels?: boolean}> = ({p, color, pixels = true}) => {
  const {width, height} = useVideoConfig();
  if (p <= 0 || p >= 1) return null;
  // الحافة مائلة بزاوية الخط الصاعد في الرمز: أعلاها متقدم لليمين بمقدار slant
  const slant = height / Math.tan((BRAND_DIAGONAL_DEG * Math.PI) / 180);
  const panelW = width + 2 * slant;
  // أسفل يسار اللوح: يدخل من اليمين، يغطي الشاشة عند 0.5، ويخرج من اليسار
  const front = interpolate(p, [0, 0.5, 1], [width, -slant, -(width + 3 * slant)]);
  const poly = `${front},${height} ${front + slant},0 ${front + panelW + slant},0 ${front + panelW},${height}`;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={width} height={height}>
        <polygon points={poly} fill={color} />
        {pixels
          ? [0, 1, 2, 3, 4].map((i) => {
              // بكسلات تسبق الحافة الأمامية قرب الأعلى (Pixel Trail)
              const s = height * (0.014 + 0.007 * (i % 3));
              const yf = 0.06 + i * 0.06;
              const edgeX = front + slant * (1 - yf);
              const x = edgeX - s * (1.6 + i * 1.3);
              return <rect key={i} x={x} y={height * yf} width={s} height={s} fill={color} />;
            })
          : null}
      </svg>
    </AbsoluteFill>
  );
};

/** مؤشر فأرة بسيط ينتقل إلى هدف وينقر (يصغر قليلاً وتنتشر دائرة) */
export const Cursor: React.FC<{
  from: [number, number];
  to: [number, number];
  start: number;
  moveDur?: number;
  clickAt: number;
  size: number;
  color: string;
  outline: string;
}> = ({from, to, start, moveDur = 14, clickAt, size, color, outline}) => {
  const frame = useCurrentFrame();
  const m = prog(frame, start, moveDur, EASE.inOut);
  const x = mix(from[0], to[0], m);
  const y = mix(from[1], to[1], m);
  const press = prog(frame, clickAt, 3, EASE.quintOut) - prog(frame, clickAt + 3, 5, EASE.expoOut);
  const ripple = prog(frame, clickAt, 16, EASE.expoOut);
  const appear = prog(frame, start - 4, 6, EASE.expoOut);
  return (
    <>
      {frame >= clickAt ? (
        <div
          style={{
            position: 'absolute',
            left: to[0] - size * 1.4 * ripple,
            top: to[1] - size * 1.4 * ripple,
            width: size * 2.8 * ripple,
            height: size * 2.8 * ripple,
            borderRadius: '50%',
            border: `${Math.max(1, size * 0.06)}px solid ${outline}`,
            opacity: 1 - ripple,
          }}
        />
      ) : null}
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        style={{position: 'absolute', left: x, top: y, transform: `scale(${1 - 0.15 * press})`, transformOrigin: '0 0', opacity: appear}}
      >
        <path d="M3 2 L3 19 L8 14.5 L11.5 22 L14.5 20.6 L11 13.4 L18 13.4 Z" fill={color} stroke={outline} strokeWidth={1.4} strokeLinejoin="miter" />
      </svg>
    </>
  );
};
