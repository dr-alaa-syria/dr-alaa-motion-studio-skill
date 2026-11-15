// المقاسات والمناطق الآمنة. كل قالب يسجّل نسختين: 16x9 و9x16 بتخطيط مستقل.
import {useVideoConfig} from 'remotion';

export const FPS = 30;

export const FORMATS = {
  '16x9': {width: 1920, height: 1080},
  '9x16': {width: 1080, height: 1920},
} as const;
export type Format = keyof typeof FORMATS;
export const FORMAT_KEYS = Object.keys(FORMATS) as Format[];

export type Layout = {
  width: number;
  height: number;
  vertical: boolean;
  /** وحدة قياس: 1 = 1px على أقصر ضلع 1080 */
  u: number;
  /** المنطقة الآمنة بالبكسل (للعموديّ: لا شيء مهم في أعلى 12% ولا أسفل 20%) */
  safe: {top: number; bottom: number; left: number; right: number};
  cx: number;
  cy: number;
};

export const layoutFor = (width: number, height: number): Layout => {
  const vertical = height > width;
  const u = Math.min(width, height) / 1080;
  const safe = vertical
    ? {top: height * 0.12, bottom: height * 0.2, left: width * 0.07, right: width * 0.07}
    : {top: height * 0.08, bottom: height * 0.09, left: width * 0.06, right: width * 0.06};
  return {width, height, vertical, u, safe, cx: width / 2, cy: height / 2};
};

export const useLayout = (): Layout => {
  const {width, height} = useVideoConfig();
  return layoutFor(width, height);
};
