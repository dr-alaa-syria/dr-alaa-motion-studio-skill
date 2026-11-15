// محتوى الريل النصّي (content.json): جمل قصيرة، كل جملة مدتها بالنبضات، والكلمة المميزة بين نجمتين.
import {z} from 'zod';
import {ThemeName} from './kit';

export const LineSchema = z.object({
  /** الجملة. الكلمة المهمة بين نجمتين: "المحتوى *قصة.*" */
  text: z.string(),
  /** المدة بالنبضات (على 120 BPM: النبضة نصف ثانية) */
  beats: z.number().int().min(1).max(16),
  /** stack = كل مجموعة كلمات على سطر والكلمة المهمة كبيرة على سطرها | flow = سطر واحد ملتف */
  layout: z.enum(['stack', 'flow']).optional(),
  /** تبديل الخلفية على الإيقاع لهذه الجملة */
  flip: z.enum(['lime', 'light']).optional(),
  /** ضربة على الكلمة المهمة (هزة خفيفة + impact) */
  punch: z.boolean().optional(),
  /** صدى للكلمة المهمة (تكرار باهت فوقها وتحتها) */
  echo: z.boolean().optional(),
  /** طريقة الخروج: up | whip | zoom | auto */
  exit: z.enum(['auto', 'up', 'whip', 'zoom']).optional(),
  /** بداية الجملة بالثواني (للمزامنة مع تعليق صوتي). إن لم تُحدد تبدأ بعد السابقة */
  at: z.number().min(0).optional(),
});
export type Line = z.infer<typeof LineSchema>;

export const KineticSchema = z.object({
  theme: ThemeName,
  bpm: z.number().min(60).max(180),
  sound: z.boolean(),
  music: z.object({file: z.string().nullable(), volume: z.number().min(0).max(1)}),
  voiceover: z.object({file: z.string().nullable(), volume: z.number().min(0).max(2), duckTo: z.number().min(0).max(1)}),
  /** إطار الريل حسب الهوية: الرمز أعلى اليسار، الوسم أعلى اليمين، والحساب */
  frame: z.object({
    showMark: z.boolean(),
    tag: z.string(),
    handle: z.string(),
    progressBar: z.boolean(),
  }),
  lines: z.array(LineSchema).min(1),
  end: z.object({
    enabled: z.boolean(),
    beats: z.number().int().min(2).max(16),
    headline: z.string(),
    showLogo: z.boolean(),
  }),
});
export type KineticProps = z.infer<typeof KineticSchema>;
