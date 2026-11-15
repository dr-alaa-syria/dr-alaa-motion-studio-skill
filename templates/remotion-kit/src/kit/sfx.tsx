// المؤثرات الصوتية: ملفات WAV في public/sfx يولّدها `studio.py sfx` (مولّدة محلياً، بلا مشاكل ترخيص)
import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';

export const SFX_NAMES = [
  'whoosh',
  'whoosh_short',
  'whoosh_out',
  'swoosh_up',
  'pop',
  'click',
  'tick',
  'impact',
  'riser',
  'pixel_1',
  'pixel_2',
  'pixel_3',
  'pixel_4',
  'pixel_5',
  'shimmer',
] as const;
export type SfxName = (typeof SFX_NAMES)[number];

export const Sfx: React.FC<{name: SfxName; at: number; volume?: number; enabled?: boolean}> = ({
  name,
  at,
  volume = 0.8,
  enabled = true,
}) => {
  if (!enabled || at < 0) return null;
  return (
    <Sequence from={Math.round(at)} layout="none" name={`sfx:${name}`}>
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
    </Sequence>
  );
};

/** بكسل رقم i (يدور على الخمسة المتاحة، بنغمة تصعد) */
export const pixelSfx = (i: number): SfxName => `pixel_${(i % 5) + 1}` as SfxName;
