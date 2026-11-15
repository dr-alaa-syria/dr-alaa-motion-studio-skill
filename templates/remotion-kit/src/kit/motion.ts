// لغة الحركة: دخول سريع واستقرار ناعم، وخروج أسرع من الدخول (من my-motion-style)
import {Easing, interpolate} from 'remotion';

export const EASE = {
  expoOut: Easing.bezier(0.16, 1, 0.3, 1),
  quintOut: Easing.bezier(0.22, 1, 0.36, 1),
  backOut: Easing.bezier(0.34, 1.56, 0.64, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  expoIn: Easing.bezier(0.7, 0, 0.84, 0),
  whip: Easing.bezier(0.83, 0, 0.17, 1),
};

export const SPRING = {
  pop: {damping: 12, stiffness: 220, mass: 0.6},
  settle: {damping: 200},
  soft: {damping: 18, stiffness: 120},
};

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** تقدّم من 0 إلى 1 بين start و start+dur مع easing */
export const prog = (frame: number, start: number, dur: number, ease: (t: number) => number = EASE.expoOut) =>
  dur <= 0 ? (frame >= start ? 1 : 0) : interpolate(frame, [start, start + dur], [0, 1], {...clamp, easing: ease});

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** سرعة قيمة متغيرة بالبكسل لكل فريم (لحساب الـ motion blur) */
export const speed = (fn: (f: number) => number, frame: number) => Math.abs(fn(frame) - fn(frame - 1));
