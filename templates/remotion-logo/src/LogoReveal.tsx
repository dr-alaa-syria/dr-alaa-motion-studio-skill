// قالب ظهور الشعار: ثلاث نسخ بنفس لغة الحركة.
//   Sting  (1.5 ث): الرمز وحده، للانتقالات والسوشال.
//   Intro  (3 ث):  الرمز يُبنى في المنتصف، ثم يتحرك ويظهر الاسم والجملة، ثم خروج سريع.
//   Outro  (5.5 ث): جملة دعوة كلمة بكلمة، ثم الشعار الكامل وبيانات التواصل، وينتهي ثابتاً.
// التوقيتات بالفريمات (30fps). كل حركة لها مؤثر صوتي على نفس الفريم.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {
  Backdrop,
  CornerMarks,
  DirBlur,
  EASE,
  EdgeLabels,
  FONT_STACK,
  Grain,
  Grid,
  Icon,
  type IconName,
  LogoLockup,
  type LockupTiming,
  Mark,
  PixelField,
  Sfx,
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
import type {LogoProps} from './schema';

export const VARIANT_FRAMES = {sting: 45, intro: 90, outro: 165};

/** الخلفية حسب content.json: لون + شبكة/بكسلات + حبيبات + تظليل (للداكن فقط) */
const Stage: React.FC<{props: LogoProps; theme: Theme; children: React.ReactNode}> = ({props, theme, children}) => (
  <AbsoluteFill>
    <Backdrop theme={theme} transparent={props.transparent} />
    {!props.transparent && props.background === 'grid' ? <Grid theme={theme} opacity={props.theme === "dark" ? 0.85 : 0.6} /> : null}
    {!props.transparent && props.background === 'pixels' ? <PixelField theme={theme} opacity={0.35} /> : null}
    {children}
    {!props.transparent ? <Grain opacity={props.theme === 'dark' ? 0.06 : 0.04} /> : null}
    {!props.transparent && props.theme === 'dark' ? <Vignette strength={0.55} /> : null}
  </AbsoluteFill>
);

/** مؤثرات بناء الرمز: انطلاق، صعود، بكسلات، ضربة */
const MarkSfx: React.FC<{start: number; speed: number; enabled: boolean}> = ({start, speed, enabled}) => {
  const c = markCues(speed);
  return (
    <>
      <Sfx name="whoosh_short" at={start + c.base - 2} volume={0.45} enabled={enabled} />
      <Sfx name="swoosh_up" at={start + c.accent} volume={0.55} enabled={enabled} />
      {c.pixels.map((p, i) => (
        <Sfx key={i} name={pixelSfx(i)} at={start + p} volume={0.4} enabled={enabled} />
      ))}
      <Sfx name="impact" at={start + c.impact - 1} volume={0.85} enabled={enabled} />
    </>
  );
};

/** خروج سريع: تكبير + ضبابية + اختفاء (أسرع من الدخول) */
const exitStyle = (frame: number, at: number, dur: number) => {
  const p = prog(frame, at, dur, EASE.expoIn);
  return {p, scale: 1 + 0.14 * p, blur: 22 * p, opacity: 1 - p};
};

// ---------------------------------------------------------------- Sting

export const LogoSting: React.FC<LogoProps> = (props) => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const theme = getTheme(props.theme);
  const speed = 1.25;
  const start = 2;
  const c = markCues(speed);
  const impact = start + c.impact;
  const bump = 0.07 * (prog(frame, impact - 3, 3, EASE.quintOut) - prog(frame, impact, 12, EASE.expoOut));
  const ex = exitStyle(frame, 37, 8);
  const push = 1 + 0.03 * prog(frame, 0, VARIANT_FRAMES.sting, EASE.inOut);
  const h = (L.vertical ? 0.2 : 0.3) * L.height;

  return (
    <Stage props={props} theme={theme}>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div
          style={{
            transform: `scale(${(1 + bump) * push * ex.scale})`,
            filter: ex.blur > 0.3 ? `blur(${ex.blur}px)` : undefined,
            opacity: ex.opacity,
          }}
        >
          <Mark theme={theme} height={h} start={start} speed={speed} />
        </div>
      </AbsoluteFill>
      <MarkSfx start={start} speed={speed} enabled={props.sound} />
      <Sfx name="whoosh_out" at={36} volume={0.55} enabled={props.sound} />
    </Stage>
  );
};

// ---------------------------------------------------------------- Intro

export const LogoIntro: React.FC<LogoProps> = (props) => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const theme = getTheme(props.theme);
  const kind = L.vertical ? 'stacked' : 'horizontal';
  const width = L.vertical ? L.width * 0.66 : L.width * 0.5;
  const timing: LockupTiming = {
    markStart: 4,
    speed: 1,
    soloScale: L.vertical ? 1.3 : 2.1,
    moveStart: 38,
    moveDur: 18,
    wordmarkStart: 42,
    wordmarkDur: 16,
    taglineStart: 55,
    taglineDur: 14,
  };
  const push = 0.97 + 0.03 * prog(frame, 0, VARIANT_FRAMES.intro, EASE.inOut);
  const ex = exitStyle(frame, 81, 9);

  return (
    <Stage props={props} theme={theme}>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <div
          style={{
            transform: `scale(${push * ex.scale})`,
            filter: ex.blur > 0.3 ? `blur(${ex.blur}px)` : undefined,
            opacity: ex.opacity,
          }}
        >
          <LogoLockup kind={kind} theme={theme} width={width} timing={timing} showTagline={props.showTagline} />
        </div>
      </AbsoluteFill>
      <MarkSfx start={timing.markStart} speed={1} enabled={props.sound} />
      <Sfx name="whoosh" at={timing.moveStart - 3} volume={0.45} enabled={props.sound} />
      {props.showTagline ? <Sfx name="tick" at={timing.taglineStart ?? 55} volume={0.5} enabled={props.sound} /> : null}
      <Sfx name="whoosh_out" at={80} volume={0.55} enabled={props.sound} />
    </Stage>
  );
};

// ---------------------------------------------------------------- Outro

type ContactItem = {icon: IconName; text: string};

const contactItems = (keys: LogoProps['outro']['contacts']): ContactItem[] => {
  const icons: Record<string, IconName> = {
    phone: 'phone',
    instagram: 'instagram',
    facebook: 'facebook',
    email: 'email',
    website: 'website',
  };
  return keys
    .map((k) => ({icon: icons[k], text: brand.contact?.[k] ?? ''}))
    .filter((c) => c.text);
};

const Contacts: React.FC<{items: ContactItem[]; theme: Theme; start: number; vertical: boolean; u: number}> = ({
  items,
  theme,
  start,
  vertical,
  u,
}) => {
  const frame = useCurrentFrame();
  const size = (vertical ? 36 : 32) * u;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row',
        alignItems: vertical ? 'flex-start' : 'center',
        gap: vertical ? 26 * u : 64 * u,
      }}
    >
      {items.map((it, i) => {
        const p = prog(frame, start + i * 4, 12, EASE.expoOut);
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16 * u,
              opacity: p,
              transform: `translateY(${(1 - p) * 18 * u}px)`,
              filter: p < 1 ? `blur(${(1 - p) * 8}px)` : undefined,
            }}
          >
            <Icon name={it.icon} size={size * 1.15} color={theme.fg} stroke={3.2} pixelColor={theme.accent} />
            <div
              dir="auto"
              style={{fontFamily: FONT_STACK, fontSize: size, fontWeight: 400, color: theme.fg, whiteSpace: 'nowrap', letterSpacing: '0.02em'}}
            >
              {it.text}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const LogoOutro: React.FC<LogoProps> = (props) => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const theme = getTheme(props.theme);
  const u = L.u;

  // المرحلة 1: الجملة
  const headStart = 6;
  const headExit = 58;
  const headSize = (L.vertical ? 98 : 96) * u;

  // المرحلة 2: الشعار
  const kind = L.vertical ? 'stacked' : 'horizontal';
  const width = L.vertical ? L.width * 0.6 : L.width * 0.44;
  const timing: LockupTiming = {
    markStart: 64,
    speed: 1.3,
    soloScale: L.vertical ? 1.25 : 1.9,
    moveStart: 64 + 25,
    moveDur: 16,
    wordmarkStart: 64 + 28,
    wordmarkDur: 14,
    taglineStart: 64 + 40,
    taglineDur: 12,
  };
  const items = props.outro.showContacts ? contactItems(props.outro.contacts) : [];
  const contactsStart = 112;
  const lockupShift = items.length ? (L.vertical ? -0.1 : -0.09) * L.height : 0;
  const shiftP = items.length ? prog(frame, contactsStart - 6, 16, EASE.expoOut) : 0;
  const push = 0.98 + 0.02 * prog(frame, 60, VARIANT_FRAMES.outro - 60, EASE.inOut);
  const sweep = prog(frame, headExit, 10, EASE.expoIn);

  return (
    <Stage props={props} theme={theme}>
      <CornerMarks theme={theme} start={4} />
      <EdgeLabels
        theme={theme}
        start={8}
        topLeft={brand.name}
        topRight="Contact"
        bottomLeft={brand.tagline?.text ?? ''}
        bottomRight={brand.contact?.instagram ?? ''}
      />

      {/* الجملة */}
      {frame < headExit + 12 ? (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: `0 ${L.safe.left}px`}}>
          <DirBlur x={sweep * 30}>
            <div style={{transform: `translateX(${sweep * -0.18 * L.width}px)`}}>
              <Words
                text={props.outro.headline}
                theme={theme}
                start={headStart}
                stagger={5}
                dur={14}
                fontSize={headSize}
                align="center"
                maxWidth={L.vertical ? L.width * 0.84 : L.width * 0.7}
                exitAt={headExit}
                exitDur={10}
              />
            </div>
          </DirBlur>
        </AbsoluteFill>
      ) : null}

      {/* الشعار + التواصل */}
      {frame >= timing.markStart - 1 ? (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transform: `translateY(${lockupShift * shiftP}px) scale(${push})`,
            }}
          >
            <LogoLockup kind={kind} theme={theme} width={width} timing={timing} showTagline={props.showTagline} />
          </div>
          {items.length ? (
            <div
              style={{
                position: 'absolute',
                top: L.vertical ? L.height * 0.6 : L.height * 0.66,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Contacts items={items} theme={theme} start={contactsStart} vertical={L.vertical} u={u} />
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}

      {/* الصوت */}
      <Sfx name="whoosh_short" at={headStart - 2} volume={0.4} enabled={props.sound} />
      <Sfx name="pop" at={headStart + 5 * Math.max(0, props.outro.headline.split(/\s+/).findIndex((w) => w.includes('*')))} volume={0.5} enabled={props.sound} />
      <Sfx name="whoosh" at={headExit - 2} volume={0.5} enabled={props.sound} />
      <MarkSfx start={timing.markStart} speed={timing.speed ?? 1} enabled={props.sound} />
      <Sfx name="whoosh_short" at={timing.moveStart - 2} volume={0.4} enabled={props.sound} />
      {items.map((_, i) => (
        <Sfx key={i} name="tick" at={contactsStart + i * 4} volume={0.45} enabled={props.sound} />
      ))}
      <Sfx name="shimmer" at={contactsStart + 10} volume={0.35} enabled={props.sound} />
    </Stage>
  );
};
