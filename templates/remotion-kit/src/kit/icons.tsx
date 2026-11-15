// أيقونات خطية هندسية على شبكة 48×48 بسماكة ثابتة وزوايا حادة (حسب دليل الهوية، صفحة الأيقونات)
import React from 'react';

export const ICON_PATHS = {
  phone: 'M14 4 H34 V44 H14 Z M21 38 H27',
  instagram: 'M8 8 H40 V40 H8 Z M24 16 A8 8 0 1 1 23.99 16 Z',
  email: 'M6 12 H42 V36 H6 Z M6 12 L24 26 L42 12',
  facebook: 'M30 44 V12 H38 M22 24 H38',
  website: 'M24 6 A18 18 0 1 1 23.99 6 Z M6 24 H42 M24 6 C14 16 14 32 24 42 M24 6 C34 16 34 32 24 42',
  arrow: 'M10 24 H38 M28 14 L38 24 L28 34',
  play: 'M16 10 L38 24 L16 38 Z',
  check: 'M10 25 L20 35 L38 13',
  plus: 'M24 10 V38 M10 24 H38',
  spark: 'M24 6 L28 20 L42 24 L28 28 L24 42 L20 28 L6 24 L20 20 Z',
} as const;
export type IconName = keyof typeof ICON_PATHS;

export const Icon: React.FC<{
  name: IconName;
  size: number;
  color: string;
  stroke?: number;
  /** نقطة البكسل الليمونية (كما في أيقونة إنستغرام في الهوية) */
  pixelColor?: string;
  style?: React.CSSProperties;
}> = ({name, size, color, stroke = 3, pixelColor, style}) => (
  <svg viewBox="0 0 48 48" width={size} height={size} style={style}>
    <path
      d={ICON_PATHS[name]}
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinejoin="miter"
      strokeLinecap="square"
    />
    {name === 'instagram' ? <rect x={32} y={13} width={4} height={4} fill={pixelColor ?? color} /> : null}
  </svg>
);
