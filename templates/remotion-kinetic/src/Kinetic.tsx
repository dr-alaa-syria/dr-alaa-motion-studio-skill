// ريل نصّي عربي (Kinetic Typography): جمل قصيرة تظهر كلمة بكلمة على الإيقاع،
// الكلمة المهمة كبيرة على سطرها والكلمات الرابطة صغيرة (تراتبية الحجم من my-motion-style)،
// تبديل الخلفية على النبضة، ضربة وصدى اختياريان، وإطار الريل حسب الهوية، ونهاية بالشعار.
import React from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  Backdrop,
  DirBlur,
  EASE,
  FONT_STACK,
  Grain,
  Grid,
  Label,
  type Layout,
  LogoLockup,
  type LockupTiming,
  Mark,
  MarkOutline,
  PixelField,
  Sfx,
  type SfxName,
  type Theme,
  Vignette,
  Words,
  brand,
  getTheme,
  markCues,
  pixelSfx,
  prog,
  useLayout,
} from './kit';
import type {KineticProps} from './schema';
import {EXIT_FRAMES, type PlacedLine, placeLines} from './timeline';

type Cue = {name: SfxName; at: number; volume?: number};

// ------------------------------------------------------------ الجملة

type Row = {em: boolean; tokens: PlacedLine['tokens']};

const toRows = (pl: PlacedLine): Row[] => {
  if (pl.line.layout === 'flow') return [{em: false, tokens: pl.tokens}];
  const rows: Row[] = [];
  pl.tokens.forEach((t) => {
    const last = rows[rows.length - 1];
    if (last && last.em === t.em) last.tokens.push(t);
    else rows.push({em: t.em, tokens: [t]});
  });
  return rows;
};

/** حجم يتسع للعرض المتاح (تقدير عرض الحروف العربية ≈ 0.55 من الحجم) */
const fit = (text: string, size: number, maxW: number) => {
  const est = text.length * size * 0.55;
  return est > maxW ? (size * maxW) / est : size;
};

const Phrase: React.FC<{pl: PlacedLine; theme: Theme; L: Layout; exitAt: number | null}> = ({pl, theme, L, exitAt}) => {
  const frame = useCurrentFrame();
  const u = L.u;
  const small = (L.vertical ? 74 : 68) * u;
  const maxW = L.width * (L.vertical ? 0.86 : 0.8);
  const rows = toRows(pl);
  const flow = pl.line.layout === 'flow';
  const emTok = pl.tokens.find((t) => t.em);
  const landAt = emTok?.at ?? pl.start;

  // الخروج
  const e = exitAt === null ? 0 : prog(frame, exitAt, EXIT_FRAMES, pl.exit === 'whip' ? EASE.whip : EASE.expoIn);
  const ePrev = exitAt === null ? 0 : prog(frame - 1, exitAt, EXIT_FRAMES, pl.exit === 'whip' ? EASE.whip : EASE.expoIn);
  let tx = 0;
  let sc = 1;
  let hb = 0;
  let blurAll = 0;
  let opAll = 1;
  if (pl.exit === 'whip') {
    tx = -L.width * e;
    hb = Math.abs(e - ePrev) * L.width * 0.07;
  } else if (pl.exit === 'zoom') {
    sc = 1 + 0.25 * e;
    blurAll = 20 * e;
    opAll = 1 - e;
  }

  // الضربة: تكبير خفيف وهزة تتلاشى
  let punchS = 1;
  let shakeX = 0;
  let shakeY = 0;
  if (pl.line.punch && frame >= landAt) {
    const k = frame - landAt;
    const decay = Math.exp(-k / 4);
    punchS = 1 + 0.07 * decay;
    shakeX = Math.sin(k * 2.7) * 9 * u * decay;
    shakeY = Math.cos(k * 3.3) * 6 * u * decay;
  }
  // دفع بطيء طوال الجملة
  const push = 1 + 0.03 * prog(frame, pl.start, pl.dur, EASE.inOut);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        transform: `translate(${tx + shakeX}px, ${shakeY}px) scale(${sc * punchS * push})`,
        opacity: opAll,
        filter: blurAll > 0.3 ? `blur(${blurAll}px)` : undefined,
      }}
    >
      <DirBlur x={hb}>
        <div dir="rtl" lang="ar" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 * u, maxWidth: maxW}}>
          {rows.map((row, ri) => {
            const text = row.tokens.map((t) => t.text).join(' ');
            const size = row.em ? fit(text, small * 2.5, maxW) : flow ? small * 1.25 : small;
            const echo = row.em && pl.line.echo;
            return (
              <div key={ri} style={{position: 'relative'}}>
                {echo
                  ? [-2, -1, 1, 2].map((k) => {
                      const ep = prog(frame, row.tokens[0].at + 3 + Math.abs(k) * 2, 12, EASE.expoOut);
                      return (
                        <div
                          key={k}
                          aria-hidden
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            justifyContent: 'center',
                            fontFamily: FONT_STACK,
                            fontWeight: 700,
                            fontSize: size,
                            lineHeight: 1.15,
                            color: 'transparent',
                            WebkitTextStroke: `${2 * u}px ${theme.highlight === 'color' ? theme.accent : theme.fg}`,
                            opacity: ep * (Math.abs(k) === 1 ? 0.35 : 0.14),
                            transform: `translateY(${k * 0.92 * ep}em)`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {text}
                        </div>
                      );
                    })
                  : null}
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexWrap: flow ? 'wrap' : 'nowrap',
                    justifyContent: 'center',
                    alignItems: 'baseline',
                    columnGap: '0.24em',
                    fontFamily: FONT_STACK,
                    fontWeight: row.em ? 700 : flow ? 700 : 500,
                    fontSize: size,
                    lineHeight: row.em ? 1.15 : 1.35,
                    color: row.em ? undefined : theme.fg,
                    whiteSpace: flow ? 'normal' : 'nowrap',
                  }}
                >
                  {row.tokens.map((tok, ti) => {
                    const big = tok.em;
                    const p = prog(frame, tok.at, big ? 9 : 10, EASE.expoOut);
                    const word = exitAt !== null && pl.exit === 'up' ? prog(frame, exitAt + ti * 0.5 + ri, EXIT_FRAMES, EASE.expoIn) : 0;
                    const boxed = big && theme.highlight === 'box';
                    const style: React.CSSProperties = big
                      ? {
                          transform: `scale(${1.35 - 0.35 * p}) translateY(${-word * 0.5}em)`,
                          filter: (1 - p) * 18 + word * 14 > 0.3 ? `blur(${(1 - p) * 18 + word * 14}px)` : undefined,
                          opacity: Math.min(1, p * 1.8) * (1 - word),
                          color: boxed ? brand.colors.accent : theme.accent,
                          background: boxed ? brand.colors.ink : undefined,
                          padding: boxed ? '0 0.18em' : undefined,
                        }
                      : {
                          transform: `translateY(${(1 - p) * 0.6 - word * 0.5}em)`,
                          filter: (1 - p) * 12 + word * 14 > 0.3 ? `blur(${(1 - p) * 12 + word * 14}px)` : undefined,
                          opacity: Math.min(1, p * 1.6) * (1 - word),
                        };
                    return (
                      <span key={ti} style={{display: 'inline-block', ...style}}>
                        {tok.text}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </DirBlur>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------ الخلفية والإطار

const LineBg: React.FC<{theme: Theme; themeName: string; L: Layout; seed: string}> = ({theme, themeName, L, seed}) => {
  const frame = useCurrentFrame();
  const dark = themeName === 'dark';
  return (
    <>
      <Backdrop theme={theme} />
      {dark ? <Grid theme={theme} opacity={0.75} fadeIn={1} /> : null}
      {dark ? (
        <div style={{position: 'absolute', left: L.width * (L.vertical ? 0.2 : 0.55), top: L.height * (L.vertical ? 0.58 : -0.1), transform: `translateX(${-frame * 0.25 * L.u}px)`}}>
          <MarkOutline height={L.height * (L.vertical ? 0.6 : 1.2)} color={brand.colors.gray700} strokeWidth={2} />
        </div>
      ) : null}
      <PixelField theme={theme} count={10} seed={seed} opacity={dark ? 0.45 : 0.3} />
    </>
  );
};

const ReelFrame: React.FC<{props: KineticProps; theme: Theme; L: Layout; total: number}> = ({props, theme, L, total}) => {
  const frame = useCurrentFrame();
  const u = L.u;
  const top = L.vertical ? L.height * 0.075 : L.height * 0.07;
  const side = L.vertical ? L.width * 0.07 : L.width * 0.05;
  const appear = prog(frame, 0, 14, EASE.expoOut);
  const fill = theme.highlight === 'color' ? theme.accent : theme.fg;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: appear}}>
      {props.frame.progressBar ? (
        <div style={{position: 'absolute', left: side, right: side, top: top - 34 * u, height: 3 * u, background: theme.line}}>
          <div style={{width: `${Math.min(1, frame / Math.max(1, total - 1)) * 100}%`, height: '100%', background: fill}} />
        </div>
      ) : null}
      {props.frame.showMark ? (
        <div style={{position: 'absolute', left: side, top}}>
          <Mark theme={theme} height={46 * u} start={2} speed={1.6} />
        </div>
      ) : null}
      <div style={{position: 'absolute', right: side, top: top + 6 * u, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 * u}}>
        {props.frame.tag ? (
          <Label color={theme.fg} size={20 * u}>
            <span dir="auto">{props.frame.tag}</span>
          </Label>
        ) : null}
        {props.frame.handle ? (
          <Label color={theme.muted} size={18 * u} style={{textTransform: 'none', letterSpacing: '0.04em'}}>
            {props.frame.handle}
          </Label>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------ النهاية

const endTiming = (endStart: number, vertical: boolean): {head: number; timing: LockupTiming; handleAt: number} => {
  const markStart = endStart + 26;
  return {
    head: endStart + 2,
    timing: {
      markStart,
      speed: 1.4,
      soloScale: vertical ? 1.1 : 1.5,
      moveStart: markStart + 22,
      moveDur: 14,
      wordmarkStart: markStart + 25,
      wordmarkDur: 12,
      taglineStart: markStart + 36,
      taglineDur: 12,
    },
    handleAt: markStart + 44,
  };
};

const EndCard: React.FC<{props: KineticProps; theme: Theme; L: Layout; endStart: number}> = ({props, theme, L, endStart}) => {
  const frame = useCurrentFrame();
  const u = L.u;
  const t = endTiming(endStart, L.vertical);
  const headUp = prog(frame, t.timing.markStart - 4, 14, EASE.expoOut);
  const hp = prog(frame, t.handleAt, 12, EASE.expoOut);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', transform: `translateY(${-headUp * L.height * (L.vertical ? 0.2 : 0.26)}px) scale(${1 - 0.35 * headUp})`}}>
        <Words text={props.end.headline} theme={theme} start={t.head} stagger={4} dur={12} fontSize={(L.vertical ? 104 : 100) * u} align="center" maxWidth={L.width * 0.84} />
      </AbsoluteFill>
      {props.end.showLogo && frame >= t.timing.markStart - 1 ? (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', paddingTop: L.height * (L.vertical ? 0.08 : 0.12)}}>
          <LogoLockup kind={L.vertical ? 'stacked' : 'horizontal'} theme={theme} width={L.vertical ? L.width * 0.52 : L.width * 0.38} timing={t.timing} />
          <div style={{marginTop: 40 * u, opacity: hp, transform: `translateY(${(1 - hp) * 14 * u}px)`}}>
            <Label color={theme.fg} size={30 * u} style={{textTransform: 'none', letterSpacing: '0.04em'}}>
              {props.frame.handle}
            </Label>
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------ الصوت

const buildCues = (props: KineticProps, placed: PlacedLine[], endStart: number, endDur: number, vertical: boolean): Cue[] => {
  const cues: Cue[] = [];
  placed.forEach((pl, i) => {
    if (i > 0) cues.push({name: pl.line.flip ? 'whoosh' : 'whoosh_short', at: pl.start - 3, volume: 0.5});
    pl.tokens.forEach((tok) => {
      if (tok.em) {
        cues.push({name: pl.line.punch ? 'impact' : 'pop', at: tok.at - (pl.line.punch ? 1 : 0), volume: pl.line.punch ? 0.65 : 0.6});
      } else {
        cues.push({name: 'tick', at: tok.at, volume: 0.35});
      }
    });
    if (pl.line.echo) cues.push({name: 'shimmer', at: (pl.tokens.find((t) => t.em)?.at ?? pl.start) + 4, volume: 0.35});
    const isLast = i === placed.length - 1;
    const exitAt = pl.start + pl.dur - EXIT_FRAMES;
    if (!isLast || endDur > 0) {
      const ex = isLast ? 'zoom' : pl.exit;
      if (ex === 'whip') cues.push({name: 'whoosh', at: exitAt - 1, volume: 0.5});
      if (ex === 'zoom') cues.push({name: 'whoosh_out', at: exitAt - 1, volume: 0.5});
    }
  });
  if (endDur > 0) {
    const t = endTiming(endStart, vertical);
    cues.push({name: 'pop', at: t.head, volume: 0.5});
    if (props.end.showLogo) {
      const mc = markCues(t.timing.speed ?? 1);
      cues.push({name: 'swoosh_up', at: t.timing.markStart + mc.accent, volume: 0.5});
      mc.pixels.forEach((px, i) => cues.push({name: pixelSfx(i), at: t.timing.markStart + px, volume: 0.4}));
      cues.push({name: 'impact', at: t.timing.markStart + mc.impact - 1, volume: 0.7});
      cues.push({name: 'whoosh_short', at: t.timing.moveStart - 2, volume: 0.4});
      cues.push({name: 'tick', at: t.handleAt, volume: 0.45});
    }
  }
  return cues;
};

// ------------------------------------------------------------ التركيب

export const Kinetic: React.FC<KineticProps> = (props) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const L = useLayout();
  const {placed, endStart, endDur, total} = placeLines(props, fps);
  const baseTheme = getTheme(props.theme);

  const current = placed.find((pl) => frame >= pl.start && frame < pl.start + pl.dur);
  const inEnd = frame >= endStart && endDur > 0;
  const bgThemeName = inEnd ? props.theme : current?.themeName ?? props.theme;
  const bgTheme = getTheme(bgThemeName);
  const dark = bgThemeName === 'dark';

  const musicVol = (f: number) => {
    const v = props.music.volume * (props.voiceover.file ? props.voiceover.duckTo : 1);
    const fadeIn = interpolate(f, [0, 6], [0, 1], {extrapolateRight: 'clamp'});
    const fadeOut = interpolate(f, [durationInFrames - 36, durationInFrames - 1], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return v * fadeIn * fadeOut;
  };
  const cues = buildCues(props, placed, endStart, endDur, L.vertical);

  return (
    <AbsoluteFill style={{background: baseTheme.bg}}>
      <LineBg theme={bgTheme} themeName={bgThemeName} L={L} seed={`bg-${current?.index ?? 'end'}`} />

      {placed.map((pl, i) => {
        const isLast = i === placed.length - 1;
        const hasNext = !isLast || endDur > 0;
        if (frame < pl.start || frame >= pl.start + pl.dur) return null;
        const exitAt = hasNext ? pl.start + pl.dur - EXIT_FRAMES : null;
        return <Phrase key={i} pl={isLast && hasNext ? {...pl, exit: 'zoom'} : pl} theme={getTheme(pl.themeName)} L={L} exitAt={exitAt} />;
      })}

      {inEnd ? <EndCard props={props} theme={baseTheme} L={L} endStart={endStart} /> : null}

      <ReelFrame props={props} theme={bgTheme} L={L} total={total} />
      <Grain opacity={dark ? 0.06 : 0.035} />
      {dark ? <Vignette strength={0.5} /> : null}

      {props.music.file ? <Audio src={staticFile(props.music.file)} volume={musicVol} /> : null}
      {props.voiceover.file ? <Audio src={staticFile(props.voiceover.file)} volume={props.voiceover.volume} /> : null}
      {cues.map((c, i) => (
        <Sfx key={i} name={c.name} at={c.at} volume={c.volume} enabled={props.sound} />
      ))}
    </AbsoluteFill>
  );
};
