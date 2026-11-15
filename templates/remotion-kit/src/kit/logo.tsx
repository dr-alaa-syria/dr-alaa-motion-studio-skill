// الشعار المتحرك. الرمز يُرسم من أجزائه في brand.json (base ثم accent ثم pixels)،
// والاسم والجملة اللفظية من lockups.json المستخرج من ملفات SVG الرسمية، فتبقى النسب مطابقة للأصل.
// قاعدة الهوية: الشكل النهائي للشعار نظيف دائماً، بلا ظل ولا توهج ولا تدوير ولا تمطيط.
import React, {useId} from 'react';
import {useCurrentFrame} from 'remotion';
import type {Lockup, MarkPart, Theme} from './brand';
import {brand, lockups, taglineAccent} from './brand';
import {EASE, mix, prog} from './motion';

type Pt = [number, number];

const parsePoints = (s: string): Pt[] =>
  s
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(',').map(Number) as Pt);

const bboxOf = (pts: Pt[]) => {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return {x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y};
};

const partBox = (p: MarkPart) =>
  p.type === 'rect' ? {x: p.x, y: p.y, w: p.w, h: p.h ?? p.w} : bboxOf(parsePoints(p.points));

const cleanId = (raw: string) => raw.replace(/[^a-zA-Z0-9]/g, '');

/** توقيت بناء الرمز بالفريمات عند السرعة 1 */
export const MARK_TIMING = {
  baseStart: 0,
  baseDur: 10,
  accentStart: 8,
  accentDur: 13,
  pixelStart: 19,
  pixelStagger: 2.5,
  pixelDur: 9,
  impact: 30,
};

/** فريمات مهمّة لمزامنة المؤثرات الصوتية (نسبة لبداية البناء) */
export const markCues = (speed = 1) => {
  const t = MARK_TIMING;
  const pixels = brand.logo.mark.parts.filter((p) => p.role === 'pixel');
  return {
    base: Math.round(t.baseStart / speed),
    accent: Math.round(t.accentStart / speed),
    pixels: pixels.map((_, i) => Math.round((t.pixelStart + i * t.pixelStagger) / speed)),
    impact: Math.round(t.impact / speed),
  };
};

/** أجزاء الرمز بإحداثيات viewBox الخاص به. f = الفريم نسبة لبداية البناء */
const MarkParts: React.FC<{f: number; speed: number; base: string; accent: string; uid: string}> = ({
  f,
  speed,
  base,
  accent,
  uid,
}) => {
  const t = MARK_TIMING;
  const parts = brand.logo.mark.parts;
  const accentPart = parts.find((p) => p.role === 'accent');
  const aBox = accentPart ? partBox(accentPart) : {x: 0, y: 0, w: 1, h: 1};
  // نقطة انطلاق البكسلات: أعلى يمين الخط الصاعد
  const tip: Pt = [aBox.x + aBox.w, aBox.y];

  const pixels = parts
    .map((p, i) => ({p, i}))
    .filter(({p}) => p.role === 'pixel')
    .sort((a, b) => {
      const ca = partBox(a.p);
      const cb = partBox(b.p);
      return Math.hypot(ca.x - tip[0], ca.y - tip[1]) - Math.hypot(cb.x - tip[0], cb.y - tip[1]);
    });
  const pixelOrder = new Map(pixels.map(({i}, k) => [i, k]));

  return (
    <>
      {parts.map((part, i) => {
        const box = partBox(part);
        const fill = part.role === 'base' ? base : accent;
        const shape =
          part.type === 'rect' ? (
            <rect x={part.x} y={part.y} width={part.w} height={part.h ?? part.w} fill={fill} />
          ) : (
            <polygon points={part.points} fill={fill} />
          );

        if (part.role === 'base') {
          // الساق الثابتة: تُرسم صعوداً من القاعدة
          const p = prog(f, t.baseStart / speed, t.baseDur / speed, EASE.expoOut);
          const id = `${uid}b${i}`;
          return (
            <g key={i}>
              <clipPath id={id}>
                <rect x={box.x - 4} y={box.y + box.h * (1 - p) - 2} width={box.w + 8} height={box.h * p + 6} />
              </clipPath>
              <g clipPath={`url(#${id})`} transform={`translate(0 ${(1 - p) * box.h * 0.1})`}>
                {shape}
              </g>
            </g>
          );
        }

        if (part.role === 'accent') {
          // الخط الليموني يصعد قطرياً من أسفل اليسار إلى أعلى اليمين
          const p = prog(f, t.accentStart / speed, t.accentDur / speed, EASE.expoOut);
          const S: Pt = [box.x, box.y + box.h];
          const E: Pt = [box.x + box.w, box.y];
          const len = Math.hypot(E[0] - S[0], E[1] - S[1]);
          const d: Pt = [(E[0] - S[0]) / len, (E[1] - S[1]) / len];
          const n: Pt = [-d[1], d[0]];
          const margin = 30;
          const reach = -margin + p * (len + margin * 2);
          const P: Pt = [S[0] + d[0] * reach, S[1] + d[1] * reach];
          const K = 2000;
          const poly = [
            [P[0] + n[0] * K, P[1] + n[1] * K],
            [P[0] - n[0] * K, P[1] - n[1] * K],
            [P[0] - n[0] * K - d[0] * K, P[1] - n[1] * K - d[1] * K],
            [P[0] + n[0] * K - d[0] * K, P[1] + n[1] * K - d[1] * K],
          ]
            .map((q) => q.join(','))
            .join(' ');
          const id = `${uid}a${i}`;
          const off = (1 - p) * -14;
          return (
            <g key={i}>
              <clipPath id={id}>
                <polygon points={poly} />
              </clipPath>
              <g clipPath={`url(#${id})`}>
                <g transform={`translate(${d[0] * off} ${d[1] * off})`}>{shape}</g>
              </g>
            </g>
          );
        }

        // البكسلات: تنطلق من رأس الخط إلى مكانها
        const k = pixelOrder.get(i) ?? 0;
        const p = prog(f, (t.pixelStart + k * t.pixelStagger) / speed, t.pixelDur / speed, EASE.backOut);
        if (p <= 0) return null;
        const cx = box.x + box.w / 2;
        const cy = box.y + box.h / 2;
        const x = mix(tip[0], cx, Math.min(p, 1.2));
        const y = mix(tip[1], cy, Math.min(p, 1.2));
        const s = Math.max(0, mix(0.2, 1, Math.min(p, 1)));
        return (
          <g key={i} transform={`translate(${x - cx} ${y - cy}) translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
            {shape}
          </g>
        );
      })}
    </>
  );
};

/** الرمز وحده (للأيقونات والانتقالات والزوايا) */
export const Mark: React.FC<{
  theme: Theme;
  height: number;
  start?: number;
  speed?: number;
  /** false = يظهر كاملاً بدون بناء */
  animate?: boolean;
  style?: React.CSSProperties;
}> = ({theme, height, start = 0, speed = 1, animate = true, style}) => {
  const frame = useCurrentFrame();
  const uid = cleanId(useId());
  const [vx, vy, vw, vh] = brand.logo.mark.viewBox;
  const f = animate ? frame - start : 10_000;
  return (
    <svg viewBox={`${vx} ${vy} ${vw} ${vh}`} height={height} width={(height * vw) / vh} style={{overflow: 'visible', ...style}}>
      <MarkParts f={f} speed={speed} base={theme.markBase} accent={theme.markAccent} uid={uid} />
    </svg>
  );
};

/** الرمز كخطوط فقط فوق الخلفية (نظام M الديناميكي: Outline) — عنصر خلفية كبير منخفض التباين */
export const MarkOutline: React.FC<{
  height: number;
  color: string;
  strokeWidth?: number;
  /** 0..1 رسم الخطوط تدريجياً */
  draw?: number;
  style?: React.CSSProperties;
}> = ({height, color, strokeWidth = 1.2, draw = 1, style}) => {
  const [vx, vy, vw, vh] = brand.logo.mark.viewBox;
  return (
    <svg viewBox={`${vx - 4} ${vy - 4} ${vw + 8} ${vh + 8}`} height={height} width={(height * (vw + 8)) / (vh + 8)} style={{overflow: 'visible', ...style}}>
      {brand.logo.mark.parts.map((part, i) => {
        const common = {
          fill: 'none',
          stroke: color,
          strokeWidth,
          vectorEffect: 'non-scaling-stroke' as const,
          pathLength: 1,
          strokeDasharray: 1,
          strokeDashoffset: 1 - draw,
        };
        return part.type === 'rect' ? (
          <rect key={i} x={part.x} y={part.y} width={part.w} height={part.h ?? part.w} {...common} />
        ) : (
          <polygon key={i} points={part.points} {...common} />
        );
      })}
    </svg>
  );
};

export type LockupKind = 'horizontal' | 'stacked' | 'horizontalNoTagline';

export type LockupTiming = {
  /** بداية بناء الرمز */
  markStart: number;
  speed?: number;
  /** حجم الرمز وهو وحده في المنتصف قبل التركيب (مضاعف لحجمه داخل التركيب) */
  soloScale?: number;
  /** انتقال الرمز من المنتصف إلى مكانه في التركيب */
  moveStart: number;
  moveDur?: number;
  wordmarkStart: number;
  wordmarkDur?: number;
  taglineStart?: number;
  taglineDur?: number;
};

const fill = (svg: string, theme: Theme) =>
  svg
    .split('{fg}')
    .join(theme.fg)
    .split('{wmAccent}')
    .join(theme.markAccent)
    .split('{tagAccent}')
    .join(taglineAccent(theme));

/** فريم الصدمة (impact) للرمز ضمن التركيب */
export const lockupImpactFrame = (t: LockupTiming) => t.markStart + markCues(t.speed ?? 1).impact;

/**
 * التركيب الكامل: الرمز يُبنى في المنتصف، ثم يتحرك إلى مكانه ويظهر الاسم ثم الجملة.
 * width = عرض التركيب على الشاشة بالبكسل.
 */
export const LogoLockup: React.FC<{
  kind: LockupKind;
  theme: Theme;
  width: number;
  timing: LockupTiming;
  showTagline?: boolean;
  style?: React.CSSProperties;
}> = ({kind, theme, width, timing, showTagline = true, style}) => {
  const frame = useCurrentFrame();
  const uid = cleanId(useId());
  const lk: Lockup = (kind === 'horizontalNoTagline' ? lockups.horizontalNoTagline : lockups[kind]) ?? lockups.horizontal;
  const [, , vbw, vbh] = lk.viewBox;
  const height = (width * vbh) / vbw;
  const speed = timing.speed ?? 1;
  const soloK = timing.soloScale ?? 1.5;

  // موضع الرمز: من المنتصف (وحده) إلى مكانه في التركيب
  const [mvx, mvy, mvw, mvh] = brand.logo.mark.viewBox;
  const mcx = mvx + mvw / 2;
  const mcy = mvy + mvh / 2;
  const finalT = lk.mark;
  const markAt = (fr: number) => {
    const mp = prog(fr, timing.moveStart, timing.moveDur ?? 16, EASE.expoOut);
    const s = mix(finalT.scale * soloK, finalT.scale, mp);
    const tx = mix(vbw / 2 - mcx * finalT.scale * soloK, finalT.x, mp);
    const ty = mix(vbh / 2 - mcy * finalT.scale * soloK, finalT.y, mp);
    return {s, tx, ty};
  };
  const m = markAt(frame);
  const prev = markAt(frame - 1);
  const v = Math.hypot(m.tx - prev.tx, m.ty - prev.ty);

  // صدمة خفيفة عند اكتمال الرمز
  const impact = lockupImpactFrame(timing);
  const bump = 0.06 * (prog(frame, impact - 3, 3, EASE.quintOut) - prog(frame, impact, 12, EASE.expoOut));
  const bs = 1 + bump;
  const ccx = m.tx + mcx * m.s;
  const ccy = m.ty + mcy * m.s;

  // الاسم: يخرج من خلف حافة قناع ثابتة من اليسار إلى اليمين
  const wp = prog(frame, timing.wordmarkStart, timing.wordmarkDur ?? 14, EASE.expoOut);
  // بدون bbox نكشف الكلمة كاملة (الاستخدام الصحيح للنصوص المتمركزة)، ويبقى الانزلاق والضبابية
  const wb = lk.wordmark.bbox ?? [0, 0, vbw, vbh];
  const wSlide = (1 - wp) * -0.18 * wb[2];
  const wBlur = (1 - wp) * 18;

  const tg = lk.tagline;
  const tp = prog(frame, timing.taglineStart ?? timing.wordmarkStart + 10, timing.taglineDur ?? 12, EASE.expoOut);
  // بدون bbox (مثلاً عند غياب Inkscape) نكشف الجملة كاملة بدل إخفائها
  const tb = tg?.bbox ?? [0, 0, vbw, vbh];

  const mbId = `${uid}mb`;
  const wbId = `${uid}wb`;
  const markBlur = Math.min(v * 0.5, 40);

  return (
    <svg
      viewBox={`0 0 ${vbw} ${vbh}`}
      width={width}
      height={height}
      style={{overflow: 'visible', ...style}}
    >
      <defs>
        <filter id={mbId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={`${markBlur} ${markBlur * 0.15}`} />
        </filter>
        <filter id={wbId} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation={`${wBlur} 0`} />
        </filter>
        <clipPath id={`${uid}wc`}>
          <rect x={wb[0] - 6} y={wb[1] - 20} width={(wb[2] + 30) * Math.min(1, wp * 1.25)} height={wb[3] + 40} />
        </clipPath>
        {tg ? (
          <clipPath id={`${uid}tc`}>
            <rect x={tb[0] - 6} y={tb[1] - 12} width={(tb[2] + 20) * tp} height={tb[3] + 24} />
          </clipPath>
        ) : null}
      </defs>

      {/* الرمز */}
      <g filter={markBlur > 0.3 ? `url(#${mbId})` : undefined}>
        <g transform={`translate(${ccx} ${ccy}) scale(${bs}) translate(${-ccx} ${-ccy})`}>
          <g transform={`translate(${m.tx} ${m.ty}) scale(${m.s})`}>
            <MarkParts f={frame - timing.markStart} speed={speed} base={theme.markBase} accent={theme.markAccent} uid={`${uid}m`} />
          </g>
        </g>
      </g>

      {/* الاسم */}
      {wp > 0 ? (
        <g clipPath={`url(#${uid}wc)`}>
          <g filter={wBlur > 0.3 ? `url(#${wbId})` : undefined} opacity={Math.min(1, wp * 2)}>
            <g
              transform={`translate(${lk.wordmark.transform.x + wSlide} ${lk.wordmark.transform.y})`}
              dangerouslySetInnerHTML={{__html: fill(lk.wordmark.svg, theme)}}
            />
          </g>
        </g>
      ) : null}

      {/* الجملة اللفظية */}
      {tg && showTagline && tp > 0 ? (
        <g clipPath={`url(#${uid}tc)`} opacity={Math.min(1, tp * 1.5)}>
          <g
            transform={`translate(${tg.transform.x} ${tg.transform.y + (1 - tp) * 10})`}
            dangerouslySetInnerHTML={{__html: fill(tg.svg, theme)}}
          />
        </g>
      ) : null}
    </svg>
  );
};

/** نسبة ارتفاع التركيب إلى عرضه */
export const lockupAspect = (kind: LockupKind) => {
  const lk = (kind === 'horizontalNoTagline' ? lockups.horizontalNoTagline : lockups[kind]) ?? lockups.horizontal;
  return lk.viewBox[3] / lk.viewBox[2];
};
