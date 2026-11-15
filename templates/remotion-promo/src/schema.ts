// محتوى الإعلان (content.json). كل مشهد مدته بعدد النبضات (beats): على 120 BPM النبضة = 15 فريم = نصف ثانية،
// فتقع كل القطعات على إيقاع الموسيقى تلقائياً.
import {z} from 'zod';
import {ICON_PATHS, ThemeName} from './kit';

const iconNames = Object.keys(ICON_PATHS) as [keyof typeof ICON_PATHS, ...(keyof typeof ICON_PATHS)[]];
export const IconNameSchema = z.enum(iconNames);
export const ContactKey = z.enum(['phone', 'instagram', 'facebook', 'email', 'website']);
export const TransitionKind = z.enum(['auto', 'whip', 'zoom', 'wipe', 'cut']);

const common = {
  /** مدة المشهد بالنبضات (2 إلى 32) */
  beats: z.number().int().min(2).max(32),
  /** ثيم خاص بالمشهد (اختياري). قاعدة الهوية: مشهد ليموني أو فاتح واحد كل 4–5 مشاهد داكنة */
  theme: ThemeName.optional(),
  /** الانتقال إلى هذا المشهد */
  transition: TransitionKind.optional(),
  /** يدخل في النسخة القصيرة؟ */
  inShort: z.boolean().optional(),
};

export const HookScene = z.object({
  type: z.literal('hook'),
  ...common,
  label: z.string().optional(),
  headline: z.string(),
  sub: z.string().optional(),
});

export const StatementScene = z.object({
  type: z.literal('statement'),
  ...common,
  index: z.string().optional(),
  kicker: z.string(),
  headline: z.string(),
});

export const FeaturesScene = z.object({
  type: z.literal('features'),
  ...common,
  title: z.string().optional(),
  items: z
    .array(z.object({icon: IconNameSchema, title: z.string(), text: z.string().optional()}))
    .min(1)
    .max(4),
});

export const MediaScene = z.object({
  type: z.literal('media'),
  ...common,
  /** ملف داخل public (مثل media/shot.mp4 أو media/photo.jpg). فارغ = رسم بيانات بديل */
  src: z.string().optional(),
  kind: z.enum(['image', 'video']).optional(),
  /** أبيض وأسود بحبيبات خفيفة (أسلوب الصور في الهوية) */
  bw: z.boolean().optional(),
  caption: z.string().optional(),
});

/** لقطة منتج كاملة الشاشة (مثلاً من قالب Blender product) مع عنوان فوقها */
export const ProductScene = z.object({
  type: z.literal('product'),
  ...common,
  /** فيديو اللقطة داخل public للمقاس 16x9 (مثل media/Shot_push_16x9.mp4) */
  src: z.string().optional(),
  /** فيديو اللقطة للمقاس 9x16 (إن لم يُحدد يُستخدم src) */
  src9x16: z.string().optional(),
  label: z.string().optional(),
  badge: z.string().optional(),
  headline: z.string(),
});

export const StatScene = z.object({
  type: z.literal('stat'),
  ...common,
  value: z.number(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  label: z.string(),
});

export const CtaScene = z.object({
  type: z.literal('cta'),
  ...common,
  headline: z.string(),
  button: z.string(),
  showLogo: z.boolean().optional(),
  contacts: z.array(ContactKey).optional(),
});

export const SceneSchema = z.discriminatedUnion('type', [
  HookScene,
  StatementScene,
  FeaturesScene,
  MediaScene,
  ProductScene,
  StatScene,
  CtaScene,
]);
export type Scene = z.infer<typeof SceneSchema>;

export const PromoSchema = z.object({
  theme: ThemeName,
  bpm: z.number().min(60).max(180),
  sound: z.boolean(),
  music: z.object({
    /** ملف داخل public. الافتراضي music/bed.wav (موسيقى مولّدة بالكود بـ 120 BPM) */
    file: z.string().nullable(),
    volume: z.number().min(0).max(1),
  }),
  voiceover: z.object({
    file: z.string().nullable(),
    volume: z.number().min(0).max(2),
    /** مستوى الموسيقى أثناء التعليق */
    duckTo: z.number().min(0).max(1),
  }),
  scenes: z.array(SceneSchema).min(1),
});
export type PromoProps = z.infer<typeof PromoSchema>;
