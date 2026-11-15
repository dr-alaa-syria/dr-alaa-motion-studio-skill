// تحميل خطوط الهوية محلياً من public/brand/fonts (بدون إنترنت وقت الرندر)
import {cancelRender, continueRender, delayRender} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {brand, brandAsset} from './brand';

export const FONT_AR = brand.fonts.arabic.family;
export const FONT_LATIN = brand.fonts.latin.family;

/**
 * سلسلة خطوط واحدة لكل النصوص: الخط اللاتيني أولاً لأنه لا يحوي حروفاً عربية،
 * فتأخذ الأحرف اللاتينية والأرقام خط Outfit، وتأخذ العربية خط IBM Plex Sans Arabic تلقائياً.
 */
export const FONT_STACK = `'${FONT_LATIN}', '${FONT_AR}', sans-serif`;

let started = false;
export const ensureFonts = () => {
  if (started) return;
  started = true;
  const handle = delayRender('تحميل خطوط الهوية');
  // نتحقق من كل ملف خط قبل تحميله، لكي يوقف أي ملف مفقود الرندر برسالة تسمّيه
  const checkedFetch = (url: string) =>
    fetch(url).then((res) => {
      if (!res.ok) {
        throw new Error(
          `Brand font not found: ${url} (HTTP ${res.status}). Put the file in brands/<id>/fonts, then create the project again.`,
        );
      }
    });
  const faces = [brand.fonts.latin, brand.fonts.arabic].flatMap((fam) =>
    fam.faces.map((face) => {
      const url = brandAsset(face.file);
      return checkedFetch(url).then(() =>
        loadFont({family: fam.family, url, weight: String(face.weight)}),
      );
    }),
  );
  Promise.all(faces)
    .then(() => continueRender(handle))
    .catch((err) => cancelRender(err));
};

ensureFonts();
