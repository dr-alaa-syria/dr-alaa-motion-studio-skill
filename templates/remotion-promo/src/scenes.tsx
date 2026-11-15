// مشاهد الإعلان. كل مشهد: مكوّن مرئي + دالة cues ترجع مؤثراته الصوتية بنفس التوقيتات.
// التوقيتات مطلقة (frame الكلي)، وs0 = بداية المشهد. المؤثرات تُرسم في المستوى الأعلى حتى لا تنقطع.
import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {
  Backdrop,
  Cursor,
  DataBars,
  EASE,
  FONT_STACK,
  Grain,
  Grid,
  Icon,
  Label,
  type Layout,
  LogoLockup,
  type LockupTiming,
  MarkOutline,
  PixelField,
  type SfxName,
  type Theme,
  Vignette,
  Words,
  brand,
  getTheme,
  markCues,
  parseEmphasis,
  pixelSfx,
  prog,
  wordsDuration,
} from './kit';
import type {Scene} from './schema';
import type {Placed} from './timeline';

export type Cue = {name: SfxName; at: number; volume?: number};

export type SceneProps<S extends Scene = Scene> = {
  scene: S;
  s0: number;
  dur: number;
  theme: Theme;
  dark: boolean;
  L: Layout;
};

/** خلفية المشهد: لون + شبكة + حبيبات + تظليل للداكن */
const SceneBg: React.FC<{theme: Theme; dark: boolean; grid?: boolean}> = ({theme, dark, grid = true}) => (
  <>
    <Backdrop theme={theme} />
    {grid ? <Grid theme={theme} opacity={dark ? 0.8 : 0.5} fadeIn={1} /> : null}
  </>
);

const Overlay: React.FC<{dark: boolean}> = ({dark}) => (
  <>
    <Grain opacity={dark ? 0.06 : 0.035} />
    {dark ? <Vignette strength={0.5} /> : null}
  </>
);

/** دفع بطيء للكاميرا طوال المشهد (لا شيء ثابت تماماً) */
const usePush = (s0: number, dur: number, amount = 0.035) => {
  const frame = useCurrentFrame();
  return 1 + amount * prog(frame, s0, dur, EASE.inOut);
};

/** فريم ظهور أول كلمة مميزة في جملة */
const emFrame = (text: string, start: number, stagger: number) => {
  const i = parseEmphasis(text).findIndex((t) => t.em);
  return i < 0 ? -1 : start + i * stagger;
};

// ------------------------------------------------------------------ Hook

export const HookView: React.FC<SceneProps<Extract<Scene, {type: 'hook'}>>> = ({scene, s0, dur, theme, dark, L}) => {
  const frame = useCurrentFrame();
  const push = usePush(s0, dur);
  const u = L.u;
  const size = (L.vertical ? 112 : 124) * u;
  const labelP = prog(frame, s0 + 2, 12, EASE.expoOut);
  const headStart = s0 + 5;
  const subStart = headStart + wordsDuration(scene.headline, 4, 12) + 2;
  const outlineH = L.height * (L.vertical ? 0.62 : 1.25);
  return (
    <AbsoluteFill>
      <SceneBg theme={theme} dark={dark} />
      <div
        style={{
          position: 'absolute',
          left: L.vertical ? L.width * 0.18 : L.width * 0.52,
          top: L.vertical ? L.height * 0.62 : -L.height * 0.12,
          transform: `translateX(${-30 * u * prog(frame, s0, dur, EASE.inOut)}px)`,
        }}
      >
        <MarkOutline height={outlineH} color={dark ? brand.colors.gray700 : theme.muted} strokeWidth={2} draw={prog(frame, s0, Math.min(dur, 70), EASE.inOut)} />
      </div>
      <PixelField theme={theme} count={12} seed={`hook-${s0}`} opacity={dark ? 0.55 : 0.4} start={subStart} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', transform: `scale(${push})`}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34 * u, maxWidth: L.vertical ? L.width * 0.86 : L.width * 0.78}}>
          {scene.label ? (
            <div style={{display: 'flex', alignItems: 'center', gap: 14 * u, opacity: labelP, transform: `translateY(${(1 - labelP) * 14 * u}px)`}}>
              <div style={{width: 12 * u, height: 12 * u, background: theme.accent}} />
              <Label color={theme.muted} size={24 * u}>
                <span dir="auto">{scene.label}</span>
              </Label>
            </div>
          ) : null}
          <Words text={scene.headline} theme={theme} start={headStart} stagger={4} dur={12} fontSize={size} align="center" />
          {scene.sub ? (
            <Words text={scene.sub} theme={theme} start={subStart} stagger={2} dur={12} fontSize={40 * u} weight={400} color={theme.muted} align="center" />
          ) : null}
        </div>
      </AbsoluteFill>
      <Overlay dark={dark} />
    </AbsoluteFill>
  );
};

const hookCues = (p: Placed): Cue[] => {
  const s = p.scene as Extract<Scene, {type: 'hook'}>;
  const headStart = p.start + 5;
  const cues: Cue[] = [];
  if (s.label) cues.push({name: 'tick', at: p.start + 2, volume: 0.5});
  const em = emFrame(s.headline, headStart, 4);
  cues.push({name: 'pop', at: em >= 0 ? em : headStart, volume: 0.6});
  if (s.sub) cues.push({name: 'tick', at: headStart + wordsDuration(s.headline, 4, 12) + 2, volume: 0.45});
  return cues;
};

// ------------------------------------------------------------------ Statement

export const StatementView: React.FC<SceneProps<Extract<Scene, {type: 'statement'}>>> = ({scene, s0, dur, theme, dark, L}) => {
  const frame = useCurrentFrame();
  const push = usePush(s0, dur);
  const u = L.u;
  const barP = prog(frame, s0 + 2, 14, EASE.expoOut);
  const idxP = prog(frame, s0, 18, EASE.expoOut);
  const kickerStart = s0 + 4;
  const headStart = s0 + 12;
  const headSize = (L.vertical ? 124 : 150) * u;
  return (
    <AbsoluteFill>
      <SceneBg theme={theme} dark={dark} />
      {scene.index ? (
        <div
          style={{
            position: 'absolute',
            left: L.vertical ? L.safe.left : L.width * 0.07,
            top: L.vertical ? L.height * 0.16 : L.height * 0.14,
            fontFamily: FONT_STACK,
            fontWeight: 700,
            fontSize: (L.vertical ? 300 : 420) * u,
            lineHeight: 1,
            color: 'transparent',
            WebkitTextStroke: `${2.5 * u}px ${dark ? brand.colors.gray700 : theme.muted}`,
            opacity: idxP,
            transform: `translateY(${(1 - idxP) * 40 * u}px)`,
          }}
        >
          {scene.index}
        </div>
      ) : null}
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: L.vertical ? 'center' : 'flex-end',
          paddingRight: L.vertical ? 0 : L.width * 0.1,
          transform: `scale(${push})`,
        }}
      >
        <div dir="rtl" style={{display: 'flex', alignItems: 'stretch', gap: 32 * u, maxWidth: L.vertical ? L.width * 0.84 : L.width * 0.6}}>
          <div style={{width: 10 * u, background: theme.accent, transform: `scaleY(${barP})`, transformOrigin: 'top'}} />
          <div style={{display: 'flex', flexDirection: 'column', gap: 18 * u}}>
            <Words text={scene.kicker} theme={theme} start={kickerStart} stagger={3} dur={12} fontSize={56 * u} weight={400} color={theme.muted} lineHeight={1.4} />
            <Words text={scene.headline} theme={theme} start={headStart} stagger={4} dur={12} fontSize={headSize} />
          </div>
        </div>
      </AbsoluteFill>
      <Overlay dark={dark} />
    </AbsoluteFill>
  );
};

const statementCues = (p: Placed): Cue[] => {
  const s = p.scene as Extract<Scene, {type: 'statement'}>;
  const em = emFrame(s.headline, p.start + 12, 4);
  return [
    {name: 'swoosh_up', at: p.start + 1, volume: 0.45},
    {name: 'pop', at: em >= 0 ? em : p.start + 12, volume: 0.6},
  ];
};

// ------------------------------------------------------------------ Features

const FEAT = {titleAt: 2, firstCard: 10, stagger: 6};

export const FeaturesView: React.FC<SceneProps<Extract<Scene, {type: 'features'}>>> = ({scene, s0, dur, theme, dark, L}) => {
  const frame = useCurrentFrame();
  const push = usePush(s0, dur, 0.025);
  const u = L.u;
  const n = scene.items.length;
  const margin = L.vertical ? L.safe.left : L.width * 0.08;
  const gap = 26 * u;
  const cardW = L.vertical ? L.width - 2 * margin : Math.min(430 * u, (L.width - 2 * margin - gap * (n - 1)) / n);
  const cardH = L.vertical ? 196 * u : 400 * u;
  const firstCard = s0 + (scene.title ? FEAT.firstCard : 3);
  return (
    <AbsoluteFill>
      <SceneBg theme={theme} dark={dark} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', transform: `scale(${push})`}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: (L.vertical ? 56 : 70) * u}}>
          {scene.title ? (
            <Words text={scene.title} theme={theme} start={s0 + FEAT.titleAt} stagger={4} dur={12} fontSize={(L.vertical ? 96 : 92) * u} align="center" />
          ) : null}
          <div dir="rtl" style={{display: 'flex', flexDirection: L.vertical ? 'column' : 'row', gap}}>
            {scene.items.map((it, i) => {
              const at = firstCard + i * FEAT.stagger;
              const p = prog(frame, at, 12, EASE.backOut);
              const fade = prog(frame, at, 8, EASE.expoOut);
              return (
                <div
                  key={i}
                  style={{
                    width: cardW,
                    height: cardH,
                    background: theme.surface,
                    border: `${1.5 * u}px solid ${theme.line}`,
                    display: 'flex',
                    flexDirection: L.vertical ? 'row' : 'column',
                    justifyContent: L.vertical ? 'flex-start' : 'space-between',
                    alignItems: L.vertical ? 'center' : 'flex-start',
                    gap: 28 * u,
                    padding: (L.vertical ? 34 : 36) * u,
                    boxSizing: 'border-box',
                    opacity: fade,
                    transform: `translateY(${(1 - Math.min(p, 1)) * 40 * u}px) scale(${0.85 + 0.15 * p})`,
                    filter: fade < 1 ? `blur(${(1 - fade) * 10}px)` : undefined,
                  }}
                >
                  <Icon name={it.icon} size={(L.vertical ? 72 : 80) * u} color={dark ? theme.accent : theme.fg} stroke={3} pixelColor={theme.accent} />
                  <div style={{display: 'flex', flexDirection: 'column', gap: 8 * u}}>
                    <div dir="auto" style={{fontFamily: FONT_STACK, fontWeight: 600, fontSize: (L.vertical ? 50 : 48) * u, lineHeight: 1.3, color: theme.fg}}>
                      {it.title}
                    </div>
                    {it.text ? (
                      <div dir="auto" style={{fontFamily: FONT_STACK, fontWeight: 400, fontSize: 26 * u, lineHeight: 1.5, color: theme.muted}}>
                        {it.text}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
      <Overlay dark={dark} />
    </AbsoluteFill>
  );
};

const featuresCues = (p: Placed): Cue[] => {
  const s = p.scene as Extract<Scene, {type: 'features'}>;
  const firstCard = p.start + (s.title ? FEAT.firstCard : 3);
  const cues: Cue[] = s.title ? [{name: 'tick', at: p.start + FEAT.titleAt, volume: 0.45}] : [];
  s.items.forEach((_, i) => cues.push({name: 'pop', at: firstCard + i * FEAT.stagger, volume: 0.55}));
  return cues;
};

// ------------------------------------------------------------------ Media

export const MediaView: React.FC<SceneProps<Extract<Scene, {type: 'media'}>>> = ({scene, s0, dur, theme, dark, L}) => {
  const frame = useCurrentFrame();
  const u = L.u;
  const reveal = prog(frame, s0, 14, EASE.expoOut);
  const zoom = 1.12 - 0.12 * prog(frame, s0, dur, EASE.quintOut);
  const m = L.vertical ? L.safe.left : L.width * 0.07;
  const box = L.vertical
    ? {left: m, top: L.height * 0.15, width: L.width - 2 * m, height: L.height * 0.42}
    : {left: m, top: L.height * 0.17, width: L.width * 0.55, height: L.height * 0.66};
  const kind = scene.kind ?? (scene.src && /\.(mp4|mov|webm|mkv)$/i.test(scene.src) ? 'video' : 'image');
  const filter = scene.bw !== false ? 'grayscale(1) contrast(1.12)' : undefined;
  const corner = 34 * u;
  const cw = 3 * u;
  return (
    <AbsoluteFill>
      <SceneBg theme={theme} dark={dark} />
      <div
        style={{
          position: 'absolute',
          ...box,
          overflow: 'hidden',
          background: theme.surface,
          clipPath: `inset(${(1 - reveal) * 100}% 0 0 0)`,
        }}
      >
        <div style={{position: 'absolute', inset: 0, transform: `scale(${zoom})`}}>
          {scene.src ? (
            kind === 'video' ? (
              <Sequence from={s0 - 5} layout="none">
                <OffthreadVideo src={staticFile(scene.src)} muted style={{width: '100%', height: '100%', objectFit: 'cover', filter}} />
              </Sequence>
            ) : (
              <Img src={staticFile(scene.src)} style={{width: '100%', height: '100%', objectFit: 'cover', filter}} />
            )
          ) : (
            <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: box.height * 0.12}}>
              <DataBars
                width={box.width * 0.72}
                height={box.height * 0.62}
                count={11}
                start={s0 + 6}
                color={dark ? theme.line : theme.muted}
                accent={theme.accent}
                seed={`media-${s0}`}
              />
            </AbsoluteFill>
          )}
        </div>
        {scene.src && scene.bw !== false ? <Grain opacity={0.12} /> : null}
      </div>
      {/* زوايا ليمونية على إطار الصورة (Crop) */}
      <div style={{position: 'absolute', left: box.left - 12 * u, top: box.top - 12 * u, width: corner, height: corner, borderTop: `${cw}px solid ${theme.accent}`, borderLeft: `${cw}px solid ${theme.accent}`, opacity: reveal}} />
      <div style={{position: 'absolute', left: box.left + box.width + 12 * u - corner, top: box.top + box.height + 12 * u - corner, width: corner, height: corner, borderBottom: `${cw}px solid ${theme.accent}`, borderRight: `${cw}px solid ${theme.accent}`, opacity: reveal}} />
      {scene.caption ? (
        <div
          style={{
            position: 'absolute',
            ...(L.vertical
              ? {left: m, right: m, top: L.height * 0.62}
              : {right: L.width * 0.07, width: L.width * 0.29, top: 0, bottom: 0, display: 'flex', alignItems: 'center'}),
          }}
        >
          <Words
            text={scene.caption}
            theme={theme}
            start={s0 + 10}
            stagger={4}
            dur={12}
            fontSize={(L.vertical ? 76 : 70) * u}
            align={L.vertical ? 'center' : 'start'}
          />
        </div>
      ) : null}
      <Overlay dark={dark} />
    </AbsoluteFill>
  );
};

const mediaCues = (p: Placed): Cue[] => {
  const s = p.scene as Extract<Scene, {type: 'media'}>;
  const cues: Cue[] = [{name: 'swoosh_up', at: p.start, volume: 0.4}];
  if (!s.src) for (let i = 0; i < 11; i += 3) cues.push({name: pixelSfx(i), at: p.start + 6 + i * 2, volume: 0.3});
  if (s.caption) {
    const em = emFrame(s.caption, p.start + 10, 4);
    cues.push({name: 'pop', at: em >= 0 ? em : p.start + 10, volume: 0.55});
  }
  return cues;
};

// ------------------------------------------------------------------ Product (لقطة 3D كاملة الشاشة)

const PROD = {labelAt: 8, badgeAt: 10, headAt: 14};

export const ProductView: React.FC<SceneProps<Extract<Scene, {type: 'product'}>>> = ({scene, s0, dur, theme, dark, L}) => {
  const frame = useCurrentFrame();
  const u = L.u;
  const src = L.vertical ? scene.src9x16 ?? scene.src : scene.src;
  const push = 1 + 0.04 * prog(frame, s0, dur, EASE.inOut);
  const labelP = prog(frame, s0 + PROD.labelAt, 12, EASE.expoOut);
  const badgeP = prog(frame, s0 + PROD.badgeAt, 12, EASE.backOut);
  const textBox: React.CSSProperties = L.vertical
    ? {left: L.safe.left, right: L.safe.right, top: L.height * 0.665, alignItems: 'center'}
    : // داخل dir=rtl: flex-start = اليمين
      {right: L.width * 0.07, left: L.width * 0.07, bottom: L.height * 0.1, alignItems: 'flex-start'};
  return (
    <AbsoluteFill>
      <Backdrop theme={theme} />
      <AbsoluteFill style={{transform: `scale(${push})`}}>
        {src ? (
          <Sequence from={s0 - 5} layout="none">
            <OffthreadVideo src={staticFile(src)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </Sequence>
        ) : (
          <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
            <MarkOutline height={L.height * 0.5} color={theme.muted} strokeWidth={2} draw={prog(frame, s0, 40, EASE.inOut)} />
          </AbsoluteFill>
        )}
      </AbsoluteFill>
      {/* تدرّج داكن خلف النص */}
      <AbsoluteFill
        style={{
          background: L.vertical
            ? `linear-gradient(to bottom, rgba(11,11,15,0) 52%, ${brand.colors.ink}E6 80%)`
            : `linear-gradient(to bottom, rgba(11,11,15,0) 50%, ${brand.colors.ink}D9 92%)`,
        }}
      />
      <div dir="rtl" style={{position: 'absolute', display: 'flex', flexDirection: 'column', gap: 18 * u, ...textBox}}>
        {scene.label || scene.badge ? (
          <div style={{display: 'flex', alignItems: 'center', gap: 20 * u}}>
            {scene.label ? (
              <div style={{display: 'flex', alignItems: 'center', gap: 12 * u, opacity: labelP, transform: `translateY(${(1 - labelP) * 12 * u}px)`}}>
                <div style={{width: 12 * u, height: 12 * u, background: brand.colors.accent}} />
                <Label color={brand.colors.paper} size={22 * u}>
                  <span dir="auto">{scene.label}</span>
                </Label>
              </div>
            ) : null}
            {scene.badge ? (
              <div
                dir="auto"
                style={{
                  background: brand.colors.accent,
                  color: brand.colors.ink,
                  fontFamily: FONT_STACK,
                  fontWeight: 700,
                  fontSize: 30 * u,
                  padding: `${6 * u}px ${18 * u}px`,
                  opacity: Math.min(1, Math.max(0, badgeP) * 1.5),
                  transform: `scale(${0.6 + 0.4 * badgeP})`,
                }}
              >
                {scene.badge}
              </div>
            ) : null}
          </div>
        ) : null}
        <Words
          text={scene.headline}
          theme={getTheme('dark')}
          start={s0 + PROD.headAt}
          stagger={4}
          dur={12}
          fontSize={(L.vertical ? 104 : 96) * u}
          align={L.vertical ? 'center' : 'start'}
          maxWidth={L.vertical ? L.width * 0.86 : L.width * 0.6}
        />
      </div>
      <Overlay dark={dark} />
    </AbsoluteFill>
  );
};

const productCues = (p: Placed): Cue[] => {
  const s = p.scene as Extract<Scene, {type: 'product'}>;
  const cues: Cue[] = [{name: 'riser', at: p.start - 30, volume: 0.25}];
  if (s.label) cues.push({name: 'tick', at: p.start + PROD.labelAt, volume: 0.45});
  if (s.badge) cues.push({name: 'pop', at: p.start + PROD.badgeAt, volume: 0.6});
  const em = emFrame(s.headline, p.start + PROD.headAt, 4);
  cues.push({name: 'pop', at: em >= 0 ? em : p.start + PROD.headAt, volume: 0.55});
  return cues;
};

// ------------------------------------------------------------------ Stat

const STAT = {countAt: 3, countDur: 30, labelAt: 14};

export const StatView: React.FC<SceneProps<Extract<Scene, {type: 'stat'}>>> = ({scene, s0, dur, theme, dark, L}) => {
  const frame = useCurrentFrame();
  const push = usePush(s0, dur, 0.04);
  const u = L.u;
  const c = prog(frame, s0 + STAT.countAt, STAT.countDur, EASE.quintOut);
  const decimals = Number.isInteger(scene.value) ? 0 : 1;
  const shown = (scene.value * c).toFixed(decimals);
  const numP = prog(frame, s0 + STAT.countAt, 10, EASE.expoOut);
  const numSize = (L.vertical ? 300 : 340) * u;
  return (
    <AbsoluteFill>
      <SceneBg theme={theme} dark={dark} grid={dark} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', opacity: 0.9}}>
        <DataBars
          width={L.width * (L.vertical ? 0.86 : 0.7)}
          height={L.height * 0.22}
          count={15}
          start={s0 + 2}
          stagger={1}
          color={dark ? theme.line : theme.surface}
          accent={dark ? theme.accent : theme.fg}
          seed={`stat-${s0}`}
          gap={0.6}
        />
      </div>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', transform: `scale(${push})`}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 * u, marginTop: -L.height * 0.06}}>
          <div
            dir="ltr"
            style={{
              fontFamily: FONT_STACK,
              fontWeight: 700,
              fontSize: numSize,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: theme.fg,
              opacity: numP,
              transform: `scale(${0.8 + 0.2 * numP})`,
              filter: numP < 1 ? `blur(${(1 - numP) * 16}px)` : undefined,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {scene.prefix ? <span style={{fontSize: '0.5em', color: dark ? theme.accent : theme.fg}}>{scene.prefix}</span> : null}
            {shown}
            {scene.suffix ? <span style={{fontSize: '0.5em', color: dark ? theme.accent : theme.fg}}>{scene.suffix}</span> : null}
          </div>
          <Words text={scene.label} theme={theme} start={s0 + STAT.labelAt} stagger={4} dur={12} fontSize={(L.vertical ? 64 : 60) * u} align="center" maxWidth={L.width * 0.8} />
        </div>
      </AbsoluteFill>
      <Overlay dark={dark} />
    </AbsoluteFill>
  );
};

const statCues = (p: Placed): Cue[] => {
  const cues: Cue[] = [];
  for (let k = 0; k < 9; k++) cues.push({name: 'tick', at: p.start + STAT.countAt + Math.round(k * k * 0.42), volume: 0.4});
  cues.push({name: 'pop', at: p.start + STAT.countAt + STAT.countDur - 6, volume: 0.6});
  return cues;
};

// ------------------------------------------------------------------ CTA

const ctaTimes = (s: Extract<Scene, {type: 'cta'}>, s0: number, dur: number) => {
  const headStart = s0 + 3;
  const buttonAt = headStart + wordsDuration(s.headline, 4, 12) + 2;
  const cursorStart = buttonAt + 6;
  const clickAt = cursorStart + 16;
  const showLogo = s.showLogo !== false;
  const phase2 = showLogo ? Math.max(clickAt + 12, s0 + Math.round(dur * 0.42)) : s0 + dur + 100;
  const timing: LockupTiming = {
    markStart: phase2 + 4,
    speed: 1.3,
    soloScale: 1.7,
    moveStart: phase2 + 4 + 25,
    moveDur: 16,
    wordmarkStart: phase2 + 4 + 28,
    wordmarkDur: 14,
    taglineStart: phase2 + 4 + 40,
    taglineDur: 12,
  };
  const contactsAt = phase2 + 4 + 48;
  return {headStart, buttonAt, cursorStart, clickAt, phase2, timing, contactsAt, showLogo};
};

export const CtaView: React.FC<SceneProps<Extract<Scene, {type: 'cta'}>>> = ({scene, s0, dur, theme, dark, L}) => {
  const frame = useCurrentFrame();
  const u = L.u;
  const t = ctaTimes(scene, s0, dur);
  const btnP = prog(frame, t.buttonAt, 12, EASE.backOut);
  const flash = prog(frame, t.clickAt, 2, EASE.quintOut) - prog(frame, t.clickAt + 2, 8, EASE.expoOut);
  const out = prog(frame, t.phase2 - 2, 9, EASE.expoIn);
  const push = 1 + 0.03 * prog(frame, s0, dur, EASE.inOut);
  const headSize = (L.vertical ? 116 : 120) * u;
  const btnH = 96 * u;
  // موضع الزر تقريباً: الكتلة (عنوان + فراغ + زر) في المنتصف، وعدد أسطر العنوان تقديري
  const lines = Math.max(1, Math.ceil((scene.headline.replace(/\*/g, '').length * headSize * 0.5) / (L.width * 0.84)));
  const blockH = lines * headSize * 1.2 + 56 * u + btnH;
  const btnCenter: [number, number] = [L.cx, L.cy + blockH / 2 - btnH / 2];
  const contacts = (scene.contacts ?? []).map((k) => ({k, text: brand.contact?.[k] ?? ''})).filter((c) => c.text);
  const iconFor = {phone: 'phone', instagram: 'instagram', facebook: 'facebook', email: 'email', website: 'website'} as const;
  const kind = L.vertical ? 'stacked' : 'horizontal';
  const lockW = L.vertical ? L.width * 0.6 : L.width * 0.44;
  const shift = contacts.length ? prog(frame, t.contactsAt - 6, 16, EASE.expoOut) * (L.vertical ? -0.08 : -0.08) * L.height : 0;

  return (
    <AbsoluteFill>
      <SceneBg theme={theme} dark={dark} />
      {frame < t.phase2 + 8 ? (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            opacity: 1 - out,
            transform: `scale(${push * (1 + 0.15 * out)})`,
            filter: out > 0 ? `blur(${out * 28}px)` : undefined,
          }}
        >
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 56 * u}}>
            <Words text={scene.headline} theme={theme} start={t.headStart} stagger={4} dur={12} fontSize={headSize} align="center" maxWidth={L.width * 0.84} />
            <div
              dir="auto"
              style={{
                height: btnH,
                padding: `0 ${48 * u}px`,
                display: 'flex',
                alignItems: 'center',
                gap: 22 * u,
                background: dark ? theme.accent : brand.colors.ink,
                color: dark ? brand.colors.ink : brand.colors.accent,
                fontFamily: FONT_STACK,
                fontWeight: 700,
                fontSize: 42 * u,
                opacity: Math.min(1, Math.max(0, btnP) * 1.5),
                transform: `scale(${(0.7 + 0.3 * btnP) * (1 - 0.06 * flash)})`,
                filter: flash > 0 ? `brightness(${1 + 0.25 * flash})` : undefined,
              }}
            >
              <span>{scene.button}</span>
              <Icon name="arrow" size={44 * u} color={dark ? brand.colors.ink : brand.colors.accent} stroke={4} style={{transform: 'scaleX(-1)'}} />
            </div>
          </div>
          <Cursor
            from={[L.width * (L.vertical ? 0.86 : 0.78), L.height * (L.vertical ? 0.86 : 0.92)]}
            to={[btnCenter[0] + 60 * u, btnCenter[1] + 10 * u]}
            start={t.cursorStart}
            moveDur={14}
            clickAt={t.clickAt}
            size={56 * u}
            color={theme.fg}
            outline={theme.bg}
          />
        </AbsoluteFill>
      ) : null}

      {t.showLogo && frame >= t.timing.markStart - 1 ? (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <div style={{transform: `translateY(${shift}px)`}}>
            <LogoLockup kind={kind} theme={theme} width={lockW} timing={t.timing} />
          </div>
          {contacts.length ? (
            <div
              dir="ltr"
              style={{
                position: 'absolute',
                top: L.height * (L.vertical ? 0.6 : 0.66),
                left: 0,
                right: 0,
                display: 'flex',
                flexDirection: L.vertical ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: (L.vertical ? 24 : 64) * u,
              }}
            >
              {contacts.map((c, i) => {
                const p = prog(frame, t.contactsAt + i * 4, 12, EASE.expoOut);
                return (
                  <div key={c.k} style={{display: 'flex', alignItems: 'center', gap: 16 * u, opacity: p, transform: `translateY(${(1 - p) * 18 * u}px)`}}>
                    <Icon name={iconFor[c.k]} size={38 * u} color={theme.fg} stroke={3.2} pixelColor={theme.accent} />
                    <div dir="auto" style={{fontFamily: FONT_STACK, fontSize: 34 * u, color: theme.fg, whiteSpace: 'nowrap'}}>
                      {c.text}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      <Overlay dark={dark} />
    </AbsoluteFill>
  );
};

const ctaCues = (p: Placed): Cue[] => {
  const s = p.scene as Extract<Scene, {type: 'cta'}>;
  const t = ctaTimes(s, p.start, p.dur);
  const cues: Cue[] = [
    {name: 'pop', at: emFrame(s.headline, t.headStart, 4) >= 0 ? emFrame(s.headline, t.headStart, 4) : t.headStart, volume: 0.55},
    {name: 'pop', at: t.buttonAt, volume: 0.6},
    {name: 'click', at: t.clickAt, volume: 0.8},
  ];
  if (t.showLogo) {
    cues.push({name: 'whoosh', at: t.phase2 - 3, volume: 0.5});
    const mc = markCues(t.timing.speed ?? 1);
    cues.push({name: 'swoosh_up', at: t.timing.markStart + mc.accent, volume: 0.5});
    mc.pixels.forEach((px, i) => cues.push({name: pixelSfx(i), at: t.timing.markStart + px, volume: 0.4}));
    cues.push({name: 'impact', at: t.timing.markStart + mc.impact - 1, volume: 0.7});
    cues.push({name: 'whoosh_short', at: t.timing.moveStart - 2, volume: 0.4});
    (s.contacts ?? []).forEach((_, i) => cues.push({name: 'tick', at: t.contactsAt + i * 4, volume: 0.45}));
    cues.push({name: 'shimmer', at: t.contactsAt + 8, volume: 0.35});
  }
  return cues;
};

// ------------------------------------------------------------------ السجل

export const SceneView: React.FC<SceneProps> = (props) => {
  switch (props.scene.type) {
    case 'hook':
      return <HookView {...(props as SceneProps<Extract<Scene, {type: 'hook'}>>)} />;
    case 'statement':
      return <StatementView {...(props as SceneProps<Extract<Scene, {type: 'statement'}>>)} />;
    case 'features':
      return <FeaturesView {...(props as SceneProps<Extract<Scene, {type: 'features'}>>)} />;
    case 'media':
      return <MediaView {...(props as SceneProps<Extract<Scene, {type: 'media'}>>)} />;
    case 'product':
      return <ProductView {...(props as SceneProps<Extract<Scene, {type: 'product'}>>)} />;
    case 'stat':
      return <StatView {...(props as SceneProps<Extract<Scene, {type: 'stat'}>>)} />;
    case 'cta':
      return <CtaView {...(props as SceneProps<Extract<Scene, {type: 'cta'}>>)} />;
  }
};

export const sceneCues = (p: Placed): Cue[] => {
  switch (p.scene.type) {
    case 'hook':
      return hookCues(p);
    case 'statement':
      return statementCues(p);
    case 'features':
      return featuresCues(p);
    case 'media':
      return mediaCues(p);
    case 'product':
      return productCues(p);
    case 'stat':
      return statCues(p);
    case 'cta':
      return ctaCues(p);
  }
};
