// نص حركي آمن للعربية: الحركة على مستوى الكلمة فقط (لا تقطيع للحروف المتصلة)،
// والكلمة المميّزة تُكتب بين نجمتين في المحتوى: "عندك فكرة؟ *خلّينا* نشتغل"
import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {Theme} from './brand';
import {brand} from './brand';
import {FONT_STACK} from './fonts';
import {EASE, clamp, prog} from './motion';
import {interpolate} from 'remotion';

export type Token = {text: string; em: boolean};

const ARABIC_RE = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
export const isRtl = (s: string) => ARABIC_RE.test(s);

/** يقسم النص إلى كلمات، والكلمات بين *...* مميّزة (يمكن أن تمتد على أكثر من كلمة) */
export const parseEmphasis = (input: string): Token[] => {
  const tokens: Token[] = [];
  let em = false;
  for (const raw of input.split(/\s+/).filter(Boolean)) {
    let w = raw;
    let startEm = false;
    let endEm = false;
    if (w.startsWith('*')) {
      startEm = true;
      w = w.slice(1);
    }
    if (w.endsWith('*')) {
      endEm = true;
      w = w.slice(0, -1);
    }
    if (startEm) em = true;
    if (w) tokens.push({text: w, em});
    if (endEm) em = false;
  }
  return tokens;
};

/** نص بدون نجوم (للعرض الثابت) */
export const plainText = (input: string) => input.replace(/\*/g, '');

/** مدة ظهور جملة بالفريمات */
export const wordsDuration = (text: string, stagger: number, dur: number) =>
  Math.max(0, parseEmphasis(text).length - 1) * stagger + dur;

export type WordsProps = {
  text: string;
  theme: Theme;
  /** فريم ظهور أول كلمة */
  start: number;
  /** الفاصل بين الكلمات بالفريمات */
  stagger?: number;
  /** مدة دخول الكلمة الواحدة */
  dur?: number;
  fontSize: number;
  weight?: number;
  lineHeight?: number;
  color?: string;
  align?: 'start' | 'center' | 'end';
  /** حجم الكلمة المميزة نسبة للنص (1 = نفس الحجم) */
  emScale?: number;
  /** فريم بداية الخروج (اختياري) */
  exitAt?: number;
  exitDur?: number;
  maxWidth?: number;
  style?: React.CSSProperties;
};

/**
 * ظهور كلمة بكلمة: كل كلمة تصعد من خلف قناع مع ضبابية خفيفة، بترتيب القراءة.
 * الكلمة المميزة: بلون التمييز على الثيم الداكن، أو داخل صندوق داكن بنص ليموني على الفاتح والليموني.
 */
export const Words: React.FC<WordsProps> = ({
  text,
  theme,
  start,
  stagger = 4,
  dur = 12,
  fontSize,
  weight = brand.type.headlineWeight,
  lineHeight = brand.type.headlineLineHeight,
  color,
  align = 'start',
  emScale = 1,
  exitAt,
  exitDur = 8,
  maxWidth,
  style,
}) => {
  const frame = useCurrentFrame();
  const tokens = parseEmphasis(text);
  const rtl = isRtl(text);
  const justify = align === 'center' ? 'center' : align === 'end' ? 'flex-end' : 'flex-start';
  const exitP = exitAt === undefined ? 0 : prog(frame, exitAt, exitDur, EASE.expoIn);

  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      lang={rtl ? 'ar' : 'en'}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: justify,
        alignItems: 'baseline',
        columnGap: '0.26em',
        rowGap: `${(lineHeight - 1) * 0.6}em`,
        fontFamily: FONT_STACK,
        fontSize,
        fontWeight: weight,
        lineHeight,
        color: color ?? theme.fg,
        maxWidth,
        ...style,
      }}
    >
      {tokens.map((tok, i) => {
        const p = prog(frame, start + i * stagger, dur, EASE.expoOut);
        const ty = interpolate(p, [0, 1], [1.05, 0], clamp);
        const blur = (1 - p) * 10 + exitP * 14;
        const boxed = tok.em && theme.highlight === 'box';
        const wordStyle: React.CSSProperties = {
          display: 'inline-block',
          transform: `translateY(${ty}em) translateY(${-exitP * 0.4}em)`,
          opacity: Math.min(1, p * 1.6) * (1 - exitP),
          filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
          color: tok.em ? theme.accent : undefined,
          fontSize: tok.em && emScale !== 1 ? `${emScale}em` : undefined,
          // على الفاتح والليموني: صندوق بلون الحبر ونص ليموني (كما في قوالب المنشورات)
          ...(boxed ? {background: brand.colors.ink, color: brand.colors.accent, padding: '0 0.2em'} : {}),
        };
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              // القناع: يخفي الكلمة وهي تحت خط الأساس. الحشوة تترك مساحة للتشكيل والصواعد العربية،
              // والهامش السالب يلغي أثرها على التخطيط
              overflow: p >= 1 ? 'visible' : 'hidden',
              padding: '0.45em 0.2em 0.1em',
              margin: '-0.45em -0.2em -0.1em',
            }}
          >
            <span style={wordStyle}>{tok.text}</span>
          </span>
        );
      })}
    </div>
  );
};

/** وسم صغير بأحرف لاتينية كبيرة وتباعد واسع (حسب دليل الهوية) */
export const Label: React.FC<{
  children: React.ReactNode;
  color: string;
  size: number;
  weight?: number;
  style?: React.CSSProperties;
}> = ({children, color, size, weight = 400, style}) => (
  <div
    style={{
      fontFamily: FONT_STACK,
      fontSize: size,
      fontWeight: weight,
      letterSpacing: brand.type.labelTracking,
      textTransform: 'uppercase',
      color,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);
