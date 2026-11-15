// Visual identity for the project: read from src/brand/brand.json (written by scripts/studio.py from brands/<id>)
// and validated with zod, so a bad brand file fails with a clear message before rendering.
import {staticFile} from 'remotion';
import {z} from 'zod';
import rawBrand from '../brand/brand.json';
import rawLockups from '../brand/lockups.json';

const Hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'لون بصيغة #RRGGBB');

const ThemeSchema = z.object({
  bg: Hex,
  fg: Hex,
  accent: Hex,
  muted: Hex,
  surface: Hex,
  line: Hex,
  markBase: Hex,
  markAccent: Hex,
  highlight: z.enum(['color', 'box']),
  logo: z.enum(['OnDark', 'OnLight', 'MonoBlack', 'MonoWhite']),
});

const FontFace = z.object({weight: z.number(), file: z.string()});
const FontFamily = z.object({family: z.string(), faces: z.array(FontFace).min(1)});

const PartSchema = z.discriminatedUnion('type', [
  z.object({role: z.enum(['base', 'accent', 'pixel']), type: z.literal('polygon'), points: z.string()}),
  z.object({
    role: z.enum(['base', 'accent', 'pixel']),
    type: z.literal('rect'),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number().optional(),
  }),
]);

export const BrandSchema = z.object({
  id: z.string(),
  version: z.string(),
  name: z.string(),
  nameAr: z.string(),
  tagline: z.object({text: z.string(), accentWord: z.string()}).optional(),
  taglineAr: z.string(),
  // ألوان إلزامية تستخدمها القوالب، والباقي اختياري
  colors: z.object({ink: Hex, paper: Hex, accent: Hex, gray700: Hex, gray800: Hex}).catchall(Hex),
  themes: z.object({dark: ThemeSchema, light: ThemeSchema, lime: ThemeSchema}),
  fonts: z.object({arabic: FontFamily, latin: FontFamily}),
  type: z.object({
    headlineWeight: z.number(),
    bodyWeight: z.number(),
    headlineLineHeight: z.number(),
    bodyLineHeight: z.number(),
    labelTracking: z.string(),
  }),
  logo: z.object({
    mark: z.object({viewBox: z.tuple([z.number(), z.number(), z.number(), z.number()]), parts: z.array(PartSchema)}),
    wordmark: z.object({aspect: z.number(), files: z.record(z.string(), z.string())}),
    arabic: z.record(z.string(), z.string()).optional(),
  }).passthrough(),
  // اختياري: القوالب تعرض التواصل فقط عند طلبه في المحتوى
  contact: z
    .object({
      phone: z.string().optional(),
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      email: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
  rules: z.array(z.string()).optional(),
});

const Transform = z.object({x: z.number(), y: z.number(), scale: z.number()});
const Box = z.tuple([z.number(), z.number(), z.number(), z.number()]);
const LockupSchema = z.object({
  viewBox: Box,
  mark: Transform,
  markBox: Box.optional(),
  wordmark: z.object({transform: Transform, svg: z.string(), bbox: Box.optional()}),
  tagline: z.object({transform: Transform, svg: z.string(), bbox: Box.optional()}).optional(),
});
const LockupsSchema = z.object({
  horizontal: LockupSchema,
  stacked: LockupSchema,
  horizontalNoTagline: LockupSchema.optional(),
});

const parse = <T>(schema: z.ZodType<T>, data: unknown, file: string): T => {
  const r = schema.safeParse(data);
  if (!r.success) {
    throw new Error(`خطأ في ${file}:\n${z.prettifyError(r.error)}`);
  }
  return r.data;
};

export type Brand = z.infer<typeof BrandSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type MarkPart = z.infer<typeof PartSchema>;
export type Lockup = z.infer<typeof LockupSchema>;

export const brand: Brand = parse(BrandSchema, rawBrand, 'src/brand/brand.json');
export const lockups = parse(LockupsSchema, rawLockups, 'src/brand/lockups.json');

export const ThemeName = z.enum(['dark', 'light', 'lime']);
export type ThemeName = z.infer<typeof ThemeName>;

export const getTheme = (name: ThemeName): Theme => brand.themes[name];

/** لون الكلمة المميّزة داخل الجملة اللفظية (tagline): ليموني على الداكن، ولون النص على الفاتح والليموني */
export const taglineAccent = (t: Theme) => (t.highlight === 'color' ? t.accent : t.fg);

/** مسار ملف داخل public/brand */
export const brandAsset = (rel: string) => staticFile(`brand/${rel}`);
