// حقول المحتوى القابلة للتعديل (content.json). تظهر أيضاً كحقول في لوحة Props داخل Remotion Studio.
import {z} from 'zod';
import {ThemeName} from './kit';

export const ContactKey = z.enum(['phone', 'instagram', 'facebook', 'email', 'website']);

export const LogoSchema = z.object({
  /** dark (الأساسي) | light | lime */
  theme: ThemeName,
  /** true = بدون خلفية، للرندر بشفافية (--alpha) ووضعه فوق فيديو */
  transparent: z.boolean(),
  /** المؤثرات الصوتية */
  sound: z.boolean(),
  showTagline: z.boolean(),
  /** grid = شبكة رفيعة | plain = لون فقط | pixels = بكسلات تصعد ببطء */
  background: z.enum(['grid', 'plain', 'pixels']),
  outro: z.object({
    /** جملة الدعوة قبل الشعار. الكلمة المميزة بين نجمتين *هكذا* */
    headline: z.string(),
    showContacts: z.boolean(),
    contacts: z.array(ContactKey),
  }),
});

export type LogoProps = z.infer<typeof LogoSchema>;
