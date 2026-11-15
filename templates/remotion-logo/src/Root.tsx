import React from 'react';
import {Composition, Folder} from 'remotion';
import {z} from 'zod';
import content from '../content.json';
import {FORMAT_KEYS, FORMATS, FPS} from './kit';
import {LogoIntro, LogoOutro, LogoSting, VARIANT_FRAMES} from './LogoReveal';
import {LogoSchema, type LogoProps} from './schema';

const parsed = LogoSchema.safeParse(content);
if (!parsed.success) {
  throw new Error(`خطأ في content.json:\n${z.prettifyError(parsed.error)}`);
}
const defaults: LogoProps = parsed.data;

const VARIANTS = [
  {id: 'Sting', component: LogoSting, frames: VARIANT_FRAMES.sting},
  {id: 'Intro', component: LogoIntro, frames: VARIANT_FRAMES.intro},
  {id: 'Outro', component: LogoOutro, frames: VARIANT_FRAMES.outro},
] as const;

export const RemotionRoot: React.FC = () => (
  <Folder name="Logo">
    {VARIANTS.map((v) =>
      FORMAT_KEYS.map((fmt) => (
        <Composition
          key={`${v.id}-${fmt}`}
          id={`Logo-${v.id}-${fmt}`}
          component={v.component}
          schema={LogoSchema}
          defaultProps={defaults}
          durationInFrames={v.frames}
          fps={FPS}
          width={FORMATS[fmt].width}
          height={FORMATS[fmt].height}
        />
      )),
    )}
  </Folder>
);
