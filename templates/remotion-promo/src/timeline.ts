// ترتيب المشاهد على الزمن: بداية كل مشهد ومدته ونوع انتقاله، والنسختان القصيرة والكاملة.
import type {ThemeName} from './kit';
import type {PromoProps, Scene} from './schema';

export type Cut = 'short' | 'full';
export type Transition = 'whip' | 'zoom' | 'wipe' | 'cut';

export type Placed = {
  scene: Scene;
  index: number;
  start: number;
  dur: number;
  /** الانتقال الداخل إلى هذا المشهد */
  transition: Transition;
  themeName: ThemeName;
};

/** نصف طول الانتقال بالفريمات (الانتقال كله 10 فريمات، ضمن 6–14) */
export const HALF = 5;

export const framesPerBeat = (bpm: number, fps: number) => Math.max(1, Math.round((fps * 60) / bpm));

const AUTO_CYCLE: Transition[] = ['whip', 'zoom', 'wipe'];

export const placeScenes = (props: PromoProps, cut: Cut, fps: number) => {
  const fpb = framesPerBeat(props.bpm, fps);
  const list = props.scenes.filter((s) => cut === 'full' || s.inShort !== false);
  let t = 0;
  const placed: Placed[] = list.map((scene, i) => {
    const dur = scene.beats * fpb;
    const wanted = scene.transition ?? 'auto';
    const transition: Transition = i === 0 ? 'cut' : wanted === 'auto' ? AUTO_CYCLE[(i - 1) % AUTO_CYCLE.length] : wanted;
    const p: Placed = {scene, index: i, start: t, dur, transition, themeName: scene.theme ?? props.theme};
    t += dur;
    return p;
  });
  return {placed, total: Math.max(t, 1), fpb};
};
