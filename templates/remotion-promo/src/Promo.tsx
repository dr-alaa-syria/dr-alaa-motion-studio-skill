// الإعلان: يرتب المشاهد على الإيقاع، ويرسم الانتقالات (whip / zoom / wipe / cut) والموسيقى والمؤثرات.
import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {DirBlur, DiagonalWipe, EASE, Sfx, brand, getTheme, prog, useLayout} from './kit';
import {SceneView, sceneCues, type Cue} from './scenes';
import type {PromoProps} from './schema';
import {HALF, type Cut, type Placed, type Transition, placeScenes} from './timeline';

const transitionCue = (t: Transition, at: number): Cue | null => {
  switch (t) {
    case 'whip':
      return {name: 'whoosh', at: at - 6, volume: 0.6};
    case 'zoom':
      return {name: 'whoosh_short', at: at - 4, volume: 0.55};
    case 'wipe':
      return {name: 'swoosh_up', at: at - 6, volume: 0.55};
    case 'cut':
      return {name: 'click', at, volume: 0.5};
  }
};

/** تحويلات المشهد أثناء دخوله وخروجه */
const sceneMotion = (frame: number, p: Placed, next: Placed | undefined, width: number) => {
  let x = 0;
  let scale = 1;
  let blur = 0;
  let hblur = 0;
  let opacity = 1;
  const whipE = (a: number) => EASE.whip(Math.min(1, Math.max(0, (frame - a) / (2 * HALF))));
  const whipV = (a: number) => Math.abs(whipE(a) - EASE.whip(Math.min(1, Math.max(0, (frame - 1 - a) / (2 * HALF)))));

  // الدخول
  if (p.index > 0) {
    if (p.transition === 'whip') {
      const a = p.start - HALF;
      x += width * (1 - whipE(a));
      hblur += whipV(a) * width * 0.08;
    } else if (p.transition === 'zoom') {
      const q = prog(frame, p.start - 2, 8, EASE.expoOut);
      scale *= 0.9 + 0.1 * q;
      blur += (1 - q) * 26;
      opacity *= q;
    }
  }
  // الخروج
  if (next) {
    if (next.transition === 'whip') {
      const a = next.start - HALF;
      x -= width * whipE(a);
      hblur += whipV(a) * width * 0.08;
    } else if (next.transition === 'zoom') {
      const q = prog(frame, next.start - 5, 7, EASE.expoIn);
      scale *= 1 + 0.15 * q;
      blur += q * 30;
      opacity *= 1 - q;
    }
  }
  return {x, scale, blur, hblur, opacity};
};

export const Promo: React.FC<PromoProps & {cut: Cut}> = (props) => {
  const frame = useCurrentFrame();
  const {fps, width, durationInFrames} = useVideoConfig();
  const L = useLayout();
  const {placed, total} = placeScenes(props, props.cut, fps);
  const baseTheme = getTheme(props.theme);

  const cues: Cue[] = [];
  placed.forEach((p) => {
    if (p.index > 0) {
      const c = transitionCue(p.transition, p.start);
      if (c) cues.push(c);
    }
    cues.push(...sceneCues(p));
  });

  const musicVol = (f: number) => {
    const v = props.music.volume * (props.voiceover.file ? props.voiceover.duckTo : 1);
    const fadeIn = interpolate(f, [0, 6], [0, 1], {extrapolateRight: 'clamp'});
    const fadeOut = interpolate(f, [durationInFrames - 36, durationInFrames - 1], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return v * fadeIn * fadeOut;
  };

  return (
    <AbsoluteFill style={{background: baseTheme.bg}}>
      {placed.map((p, i) => {
        const next = placed[i + 1];
        const from = p.index === 0 || p.transition === 'cut' || p.transition === 'wipe' ? p.start : p.start - HALF;
        const to = !next ? total : next.transition === 'cut' || next.transition === 'wipe' ? next.start : next.start + HALF;
        if (frame < from || frame >= to) return null;
        const m = sceneMotion(frame, p, next, width);
        const theme = getTheme(p.themeName);
        return (
          <AbsoluteFill
            key={i}
            style={{
              transform: `translateX(${m.x}px) scale(${m.scale})`,
              opacity: m.opacity,
              filter: m.blur > 0.3 ? `blur(${m.blur}px)` : undefined,
            }}
          >
            <DirBlur x={m.hblur} style={{position: 'absolute', inset: 0}}>
              <SceneView scene={p.scene} s0={p.start} dur={p.dur} theme={theme} dark={p.themeName === 'dark'} L={L} />
            </DirBlur>
          </AbsoluteFill>
        );
      })}

      {/* لوح القص المائل فوق كل شيء */}
      {placed
        .filter((p) => p.index > 0 && p.transition === 'wipe')
        .map((p) => {
          const prev = placed[p.index - 1];
          const limeInvolved = p.themeName === 'lime' || prev?.themeName === 'lime';
          const q = prog(frame, p.start - HALF - 2, 2 * HALF + 4, (t) => t);
          return <DiagonalWipe key={`w${p.index}`} p={q} color={limeInvolved ? brand.colors.ink : brand.colors.accent} />;
        })}

      {/* الصوت */}
      {props.music.file ? <Audio src={staticFile(props.music.file)} volume={musicVol} /> : null}
      {props.voiceover.file ? <Audio src={staticFile(props.voiceover.file)} volume={props.voiceover.volume} /> : null}
      {cues.map((c, i) => (
        <Sfx key={i} name={c.name} at={c.at} volume={c.volume} enabled={props.sound} />
      ))}
    </AbsoluteFill>
  );
};
