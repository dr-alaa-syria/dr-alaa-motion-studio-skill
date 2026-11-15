import React from 'react';
import {Composition, Folder} from 'remotion';
import {z} from 'zod';
import content from '../content.json';
import {FORMAT_KEYS, FORMATS, FPS} from './kit';
import {Promo} from './Promo';
import {PromoSchema, type PromoProps} from './schema';
import {placeScenes, type Cut} from './timeline';

const parsed = PromoSchema.safeParse(content);
if (!parsed.success) {
  throw new Error(`خطأ في content.json:\n${z.prettifyError(parsed.error)}`);
}
const defaults: PromoProps = parsed.data;

const PromoShort: React.FC<PromoProps> = (p) => <Promo {...p} cut="short" />;
const PromoFull: React.FC<PromoProps> = (p) => <Promo {...p} cut="full" />;

const CUTS: {id: string; cut: Cut; component: React.FC<PromoProps>}[] = [
  {id: 'Short', cut: 'short', component: PromoShort},
  {id: 'Full', cut: 'full', component: PromoFull},
];

export const RemotionRoot: React.FC = () => (
  <Folder name="Promo">
    {CUTS.map((c) =>
      FORMAT_KEYS.map((fmt) => (
        <Composition
          key={`${c.id}-${fmt}`}
          id={`Promo-${c.id}-${fmt}`}
          component={c.component}
          schema={PromoSchema}
          defaultProps={defaults}
          fps={FPS}
          width={FORMATS[fmt].width}
          height={FORMATS[fmt].height}
          durationInFrames={placeScenes(defaults, c.cut, FPS).total}
          calculateMetadata={({props}) => ({durationInFrames: placeScenes(props, c.cut, FPS).total})}
        />
      )),
    )}
  </Folder>
);
