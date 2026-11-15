import React from 'react';
import {Composition, Folder} from 'remotion';
import {z} from 'zod';
import content from '../content.json';
import {FORMATS, FPS, type Format} from './kit';
import {Kinetic} from './Kinetic';
import {KineticSchema, type KineticProps} from './schema';
import {placeLines} from './timeline';

const parsed = KineticSchema.safeParse(content);
if (!parsed.success) {
  throw new Error(`خطأ في content.json:\n${z.prettifyError(parsed.error)}`);
}
const defaults: KineticProps = parsed.data;

// العمودي أولاً لأنه المقاس الأساسي للريلز
const ORDER: Format[] = ['9x16', '16x9'];

export const RemotionRoot: React.FC = () => (
  <Folder name="Kinetic">
    {ORDER.map((fmt) => (
      <Composition
        key={fmt}
        id={`Kinetic-${fmt}`}
        component={Kinetic}
        schema={KineticSchema}
        defaultProps={defaults}
        fps={FPS}
        width={FORMATS[fmt].width}
        height={FORMATS[fmt].height}
        durationInFrames={placeLines(defaults, FPS).total}
        calculateMetadata={({props}) => ({durationInFrames: placeLines(props, FPS).total})}
      />
    ))}
  </Folder>
);
