// ضبابية حركة اتجاهية رخيصة عبر فلتر SVG (أفقية و/أو عمودية)
import React, {useId} from 'react';

export const DirBlur: React.FC<{
  x?: number;
  y?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({x = 0, y = 0, style, children}) => {
  const raw = useId();
  const id = `db${raw.replace(/[^a-zA-Z0-9]/g, '')}`;
  const sx = Math.min(Math.max(x, 0), 80);
  const sy = Math.min(Math.max(y, 0), 80);
  const active = sx > 0.3 || sy > 0.3;
  return (
    <>
      {active ? (
        <svg width={0} height={0} style={{position: 'absolute'}}>
          <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={`${sx} ${sy}`} />
          </filter>
        </svg>
      ) : null}
      <div style={{...style, filter: active ? `url(#${id})` : style?.filter}}>{children}</div>
    </>
  );
};
