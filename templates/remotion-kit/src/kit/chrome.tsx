// تفاصيل تحريرية صغيرة: زوايا وأوسمة بخط رفيع منخفض التباين (my-motion-style القاعدة 9)
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {Theme} from './brand';
import {useLayout} from './layout';
import {EASE, prog} from './motion';
import {Label} from './text';

export const CornerMarks: React.FC<{theme: Theme; start?: number; size?: number; inset?: number; color?: string}> = ({
  theme,
  start = 0,
  size,
  inset,
  color,
}) => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const s = size ?? 28 * L.u;
  const ins = inset ?? 48 * L.u;
  const p = prog(frame, start, 14, EASE.expoOut);
  const c = color ?? theme.muted;
  const w = 2 * L.u;
  const corner = (rot: number, pos: React.CSSProperties) => (
    <div
      style={{
        position: 'absolute',
        width: s,
        height: s,
        borderTop: `${w}px solid ${c}`,
        borderLeft: `${w}px solid ${c}`,
        transform: `rotate(${rot}deg) scale(${0.6 + 0.4 * p})`,
        opacity: p,
        ...pos,
      }}
    />
  );
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {corner(0, {left: ins, top: ins})}
      {corner(90, {right: ins, top: ins})}
      {corner(180, {right: ins, bottom: ins})}
      {corner(270, {left: ins, bottom: ins})}
    </AbsoluteFill>
  );
};

/** أوسمة صغيرة على أطراف الإطار (مثل قوالب المنشورات: يسار أعلى، يمين أعلى، أسفل) */
export const EdgeLabels: React.FC<{
  theme: Theme;
  start?: number;
  topLeft?: string;
  topRight?: string;
  bottomLeft?: string;
  bottomRight?: string;
  color?: string;
}> = ({theme, start = 0, topLeft, topRight, bottomLeft, bottomRight, color}) => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const p = prog(frame, start, 16, EASE.expoOut);
  const size = 15 * L.u;
  const padX = 96 * L.u;
  const padY = 50 * L.u;
  const c = color ?? theme.muted;
  const item = (text: string | undefined, pos: React.CSSProperties) =>
    text ? (
      <div style={{position: 'absolute', opacity: p, transform: `translateY(${(1 - p) * 8 * L.u}px)`, ...pos}}>
        <Label color={c} size={size}>
          {text}
        </Label>
      </div>
    ) : null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {item(topLeft, {left: padX, top: padY})}
      {item(topRight, {right: padX, top: padY})}
      {item(bottomLeft, {left: padX, bottom: padY})}
      {item(bottomRight, {right: padX, bottom: padY})}
    </AbsoluteFill>
  );
};
