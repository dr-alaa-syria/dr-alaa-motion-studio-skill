// خلفيات الهوية: لون الثيم + شبكة رفيعة + حبيبات + تظليل الحواف + حقل بكسلات (نظام M الديناميكي)
import React, {useId} from 'react';
import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Theme} from './brand';
import {EASE, prog} from './motion';

export const Backdrop: React.FC<{theme: Theme; transparent?: boolean}> = ({theme, transparent}) =>
  transparent ? null : <AbsoluteFill style={{background: theme.bg}} />;

/** شبكة خطوط رفيعة تنزاح ببطء (لا شيء ثابت تماماً) */
export const Grid: React.FC<{
  theme: Theme;
  cell?: number;
  opacity?: number;
  fadeIn?: number;
  drift?: number;
}> = ({theme, cell, opacity = 0.6, fadeIn = 20, drift = 0.25}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const id = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const c = cell ?? Math.round(Math.min(width, height) / 12);
  const o = opacity * prog(frame, 0, fadeIn, EASE.quintOut);
  const off = (frame * drift) % c;
  return (
    <AbsoluteFill style={{opacity: o}}>
      <svg width={width} height={height}>
        <defs>
          <pattern id={id} width={c} height={c} patternUnits="userSpaceOnUse" x={-off} y={off * 0.5}>
            <path d={`M ${c} 0 L 0 0 0 ${c}`} fill="none" stroke={theme.line} strokeWidth={1.5} />
          </pattern>
        </defs>
        <rect width={width} height={height} fill={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** حبيبات خفيفة متحركة (أسلوب الصور في الهوية) */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.07}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const id = `n${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <AbsoluteFill style={{opacity, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <svg width={width} height={height}>
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={Math.floor(frame / 2) % 50} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={width} height={height} filter={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** تظليل الحواف (للخلفيات الداكنة) */
export const Vignette: React.FC<{strength?: number}> = ({strength = 0.5}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: 'none',
    }}
  />
);

/** مربعات بكسل متناثرة تصعد ببطء نحو أعلى اليمين (Pixel Trail) */
export const PixelField: React.FC<{
  theme: Theme;
  count?: number;
  seed?: string;
  opacity?: number;
  color?: string;
  start?: number;
}> = ({theme, count = 14, seed = 'px', opacity = 0.5, color, start = 0}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const u = Math.min(width, height) / 1080;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: count}).map((_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const size = Math.round((6 + r('s') * 14) * u);
        const appear = prog(frame, start + r('d') * 30, 12, EASE.backOut);
        const x = r('x') * width + frame * 0.4 * u * (0.5 + r('v'));
        const y = r('y') * height - frame * 0.6 * u * (0.5 + r('v'));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: ((x % width) + width) % width,
              top: ((y % height) + height) % height,
              width: size,
              height: size,
              background: color ?? theme.accent,
              opacity: opacity * Math.min(1, appear) * (0.35 + r('o') * 0.65),
              transform: `scale(${Math.max(0, appear)})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
