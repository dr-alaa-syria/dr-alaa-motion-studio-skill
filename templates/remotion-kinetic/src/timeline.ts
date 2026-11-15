// توقيت الجمل والكلمات: الجمل تتغير على النبضات، والكلمة المهمة تنزل على النبضة التالية بعد ما قبلها.
import type {ThemeName} from './kit';
import {parseEmphasis, type Token} from './kit';
import type {KineticProps, Line} from './schema';

export type Exit = 'up' | 'whip' | 'zoom';
export type PlacedLine = {
  line: Line;
  index: number;
  start: number;
  dur: number;
  themeName: ThemeName;
  exit: Exit;
  tokens: (Token & {at: number})[];
};

export const framesPerBeat = (bpm: number, fps: number) => Math.max(1, Math.round((fps * 60) / bpm));

/** فاصل الكلمات العادية بالفريمات */
export const WORD_STAGGER = 4;
/** مدة الخروج (أسرع من الدخول) */
export const EXIT_FRAMES = 6;

const EXIT_CYCLE: Exit[] = ['up', 'up', 'whip', 'up', 'zoom'];

export const wordTimes = (tokens: Token[], start: number, fpb: number): number[] => {
  const times: number[] = [];
  let t = start;
  tokens.forEach((tok, i) => {
    if (i === 0) {
      t = start;
    } else if (tok.em && !tokens[i - 1].em) {
      // الكلمة المهمة تنزل على أقرب نصف نبضة بعد ما قبلها بـ 6 فريمات على الأقل
      const half = Math.max(1, Math.round(fpb / 2));
      const min = t + WORD_STAGGER + 2;
      t = start + Math.ceil((min - start) / half) * half;
    } else {
      t += WORD_STAGGER;
    }
    times.push(t);
  });
  return times;
};

export const placeLines = (props: KineticProps, fps: number) => {
  const fpb = framesPerBeat(props.bpm, fps);
  let t = 0;
  const placed: PlacedLine[] = props.lines.map((line, i) => {
    const start = line.at !== undefined ? Math.round(line.at * fps) : t;
    const dur = line.beats * fpb;
    const tokens = parseEmphasis(line.text);
    const times = wordTimes(tokens, start, fpb);
    const exit: Exit = !line.exit || line.exit === 'auto' ? EXIT_CYCLE[i % EXIT_CYCLE.length] : line.exit;
    t = start + dur;
    return {
      line,
      index: i,
      start,
      dur,
      themeName: (line.flip ?? props.theme) as ThemeName,
      exit,
      tokens: tokens.map((tok, k) => ({...tok, at: times[k]})),
    };
  });
  const endStart = t;
  const endDur = props.end.enabled ? props.end.beats * fpb : 0;
  return {placed, endStart, endDur, total: Math.max(1, endStart + endDur), fpb};
};
