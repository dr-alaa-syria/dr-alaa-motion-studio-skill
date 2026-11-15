"""
يولّد مكتبة مؤثرات صوتية للموشن (whoosh، pop، click، impact، riser، بكسلات...) بالكود فقط (numpy).
لا توجد عينات خارجية، فلا مشاكل ترخيص تجاري. الناتج حتمي (نفس الملفات كل مرة).

التشغيل:
  python -I scripts/sfx_synth.py [--out <folder>] [--overwrite]
أو عبر:
  python scripts/studio.py sfx

الصيغة: WAV، 48 kHz، 16 بت، ستيريو.
الافتراضي: <مساحة العمل>/audio/sfx (متغير MOTION_STUDIO_WORKSPACE، وإلا ~/MotionStudio)
"""

from __future__ import annotations

import argparse
import os
import wave
from pathlib import Path

import numpy as np

SR = 48_000
STUDIO_ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = Path(os.environ.get("MOTION_STUDIO_WORKSPACE", Path.home() / "MotionStudio"))
DEFAULT_OUT = WORKSPACE / "audio" / "sfx"
RNG = np.random.default_rng(20261115)


# ---------- أدوات ----------

def t_axis(dur: float) -> np.ndarray:
    return np.arange(int(dur * SR)) / SR


def env_ad(n: int, attack: float, decay_curve: float = 4.0) -> np.ndarray:
    """غلاف: صعود خطي ثم هبوط أسّي. attack كنسبة من الطول."""
    a = max(1, int(n * attack))
    up = np.linspace(0, 1, a, endpoint=False) ** 1.5
    down = np.exp(-decay_curve * np.linspace(0, 1, n - a))
    return np.concatenate([up, down])


def fade_edges(x: np.ndarray, ms: float = 3.0) -> np.ndarray:
    k = max(1, int(SR * ms / 1000))
    x = x.copy()
    ramp = np.linspace(0, 1, k)
    x[:k] *= ramp
    x[-k:] *= ramp[::-1]
    return x


def sweep_noise(dur: float, f0: float, f1: float, width_oct: float = 0.9, curve: str = "log") -> np.ndarray:
    """ضجيج مرشَّح بنطاق يتحرك من f0 إلى f1 (STFT + overlap-add)."""
    n = int(dur * SR)
    noise = RNG.standard_normal(n + 4096)
    win = 2048
    hop = 512
    window = np.hanning(win)
    freqs = np.fft.rfftfreq(win, 1 / SR)
    logf = np.log2(np.maximum(freqs, 1.0))
    out = np.zeros(n + 4096)
    norm = np.zeros(n + 4096)
    frames = range(0, n, hop)
    total = max(1, len(frames) - 1)
    for k, start in enumerate(frames):
        u = k / total
        fc = f0 * (f1 / f0) ** u if curve == "log" else f0 + (f1 - f0) * u
        mask = np.exp(-0.5 * ((logf - np.log2(fc)) / (width_oct / 2)) ** 2)
        seg = noise[start:start + win] * window
        spec = np.fft.rfft(seg) * mask
        out[start:start + win] += np.fft.irfft(spec, win) * window
        norm[start:start + win] += window ** 2
    out = out / np.maximum(norm, 1e-3)
    return out[:n]


def chirp(dur: float, f0: float, f1: float, kind: str = "exp") -> np.ndarray:
    t = t_axis(dur)
    if kind == "exp":
        k = np.log(f1 / f0) / dur
        phase = 2 * np.pi * f0 * (np.exp(k * t) - 1) / k
    else:
        phase = 2 * np.pi * (f0 * t + (f1 - f0) * t ** 2 / (2 * dur))
    return np.sin(phase)


def lowpass(x: np.ndarray, cutoff: float) -> np.ndarray:
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    spec *= 1 / (1 + (f / cutoff) ** 4)
    return np.fft.irfft(spec, len(x))


def highpass(x: np.ndarray, cutoff: float) -> np.ndarray:
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    spec *= 1 - 1 / (1 + (f / cutoff) ** 4)
    return np.fft.irfft(spec, len(x))


def reverb(x: np.ndarray, tail: float = 0.8, mix: float = 0.25) -> np.ndarray:
    n = int(tail * SR)
    ir = RNG.standard_normal(n) * np.exp(-6 * np.linspace(0, 1, n))
    ir = lowpass(ir, 5000)
    ir = fade_edges(ir, 40)
    ir /= np.sqrt(np.sum(ir ** 2))
    L = len(x) + n
    wet = np.fft.irfft(np.fft.rfft(x, L) * np.fft.rfft(ir, L), L)
    dry = np.concatenate([x, np.zeros(n)])
    return dry * (1 - mix) + wet * mix


def normalize(x: np.ndarray, peak_db: float) -> np.ndarray:
    peak = np.max(np.abs(x)) or 1.0
    return x / peak * (10 ** (peak_db / 20))


def stereo(mono: np.ndarray, pan_from: float = 0.0, pan_to: float = 0.0, width: float = 0.0) -> np.ndarray:
    """pan من -1 (يسار) إلى 1 (يمين) يتحرك خلال الصوت، وwidth يضيف فرقاً بسيطاً بين القناتين."""
    n = len(mono)
    pan = np.linspace(pan_from, pan_to, n)
    gl = np.cos((pan + 1) * np.pi / 4)
    gr = np.sin((pan + 1) * np.pi / 4)
    left = mono * gl
    right = mono * gr
    if width > 0:
        d = int(SR * 0.0007 * width)
        right = np.concatenate([np.zeros(d), right[:-d]]) if d else right
    return np.stack([left, right], axis=1) * np.sqrt(2)


def write_wav(path: Path, data: np.ndarray) -> None:
    data = np.clip(data, -1, 1)
    pcm = (data * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


# ---------- المؤثرات ----------

def whoosh(dur=0.55, f0=250, f1=2600, peak_at=0.55, pan=(-0.6, 0.6)):
    x = sweep_noise(dur, f0, f1, 1.1)
    n = len(x)
    a = int(n * peak_at)
    e = np.concatenate([np.linspace(0, 1, a) ** 2.2, np.exp(-5 * np.linspace(0, 1, n - a))])
    return stereo(fade_edges(normalize(x * e, -5)), *pan, width=1)


def whoosh_out():
    x = sweep_noise(0.45, 3200, 380, 1.0)
    e = env_ad(len(x), 0.08, 3.5)
    return stereo(fade_edges(normalize(x * e, -6)), 0.5, -0.5, width=1)


def swoosh_up():
    x = sweep_noise(0.42, 380, 5200, 0.8)
    tone = chirp(0.42, 260, 1300) * 0.12
    n = len(x)
    e = np.concatenate([np.linspace(0, 1, int(n * 0.7)) ** 2, np.exp(-6 * np.linspace(0, 1, n - int(n * 0.7)))])
    return stereo(fade_edges(normalize((x + tone) * e, -6)), -0.2, 0.3, width=1)


def pop():
    t = t_axis(0.14)
    f = 260 + 700 * np.exp(-t * 45)
    phase = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(phase) * np.exp(-t * 32)
    click = highpass(RNG.standard_normal(len(t)), 3000) * np.exp(-t * 900) * 0.25
    return stereo(fade_edges(normalize(body + click, -6), 1))


def click():
    t = t_axis(0.045)
    burst = highpass(RNG.standard_normal(len(t)), 3500) * np.exp(-t * 600)
    tone = np.sin(2 * np.pi * 2300 * t) * np.exp(-t * 180) * 0.6
    return stereo(fade_edges(normalize(burst + tone, -8), 0.5))


def tick():
    t = t_axis(0.03)
    burst = highpass(RNG.standard_normal(len(t)), 5000) * np.exp(-t * 900)
    tone = np.sin(2 * np.pi * 4600 * t) * np.exp(-t * 400) * 0.4
    return stereo(fade_edges(normalize(burst + tone, -12), 0.5))


def impact():
    dur = 1.6
    t = t_axis(dur)
    f_sub = 42 + 90 * np.exp(-t * 14)
    sub = np.sin(2 * np.pi * np.cumsum(f_sub) / SR) * np.exp(-t * 3.2)
    f_body = 75 + 170 * np.exp(-t * 22)
    body = np.sin(2 * np.pi * np.cumsum(f_body) / SR) * np.exp(-t * 9) * 0.6
    hit = lowpass(RNG.standard_normal(len(t)), 900) * np.exp(-t * 28) * 0.9
    snap = highpass(RNG.standard_normal(len(t)), 2500) * np.exp(-t * 120) * 0.35
    x = sub + body + hit + snap
    x[-int(SR * 0.3):] *= np.linspace(1, 0, int(SR * 0.3)) ** 2
    x = reverb(x, tail=0.9, mix=0.22)
    x = fade_edges(normalize(x, -1.0), 5)
    return stereo(x, width=2)


def riser():
    dur = 1.5
    x = sweep_noise(dur, 220, 6500, 0.9)
    tone = chirp(dur, 180, 900) * 0.15
    n = len(x)
    e = np.linspace(0, 1, n) ** 2.6
    e[-int(SR * 0.02):] *= np.linspace(1, 0, int(SR * 0.02))
    return stereo(normalize((x + tone) * e, -5), -0.3, 0.3, width=2)


PIXEL_NOTES = [1046.5, 1174.7, 1318.5, 1568.0, 1760.0]  # خماسي: C6 D6 E6 G6 A6


def pixel(i: int):
    t = t_axis(0.11)
    f0 = PIXEL_NOTES[i]
    f = f0 * (1 + 0.03 * (1 - np.exp(-t * 60)))
    ph = 2 * np.pi * np.cumsum(f) / SR
    wave_ = np.sin(ph) + 0.28 * np.sin(3 * ph) + 0.12 * np.sin(5 * ph)
    e = np.exp(-t * 38)
    e[: int(SR * 0.001)] *= np.linspace(0, 1, int(SR * 0.001))
    pan = -0.4 + 0.2 * i
    return stereo(fade_edges(normalize(wave_ * e, -11), 1), pan, pan)


def shimmer():
    dur = 1.1
    t = t_axis(dur)
    x = np.zeros(len(t))
    for k in range(9):
        f = 2000 + RNG.random() * 4500
        trem = 0.5 + 0.5 * np.sin(2 * np.pi * (6 + RNG.random() * 8) * t + RNG.random() * 6)
        x += np.sin(2 * np.pi * f * t + RNG.random() * 6) * trem
    e = np.sin(np.pi * np.linspace(0, 1, len(t))) ** 1.5
    return stereo(fade_edges(normalize(x * e, -16)), -0.5, 0.5, width=3)


SOUNDS = {
    "whoosh": lambda: whoosh(),
    "whoosh_short": lambda: whoosh(0.3, 600, 4200, 0.5, (-0.4, 0.4)),
    "whoosh_out": whoosh_out,
    "swoosh_up": swoosh_up,
    "pop": pop,
    "click": click,
    "tick": tick,
    "impact": impact,
    "riser": riser,
    "pixel_1": lambda: pixel(0),
    "pixel_2": lambda: pixel(1),
    "pixel_3": lambda: pixel(2),
    "pixel_4": lambda: pixel(3),
    "pixel_5": lambda: pixel(4),
    "shimmer": shimmer,
}

DESCRIPTIONS = {
    "whoosh": "انتقال عادي (0.55 ث)، يتحرك من اليسار لليمين",
    "whoosh_short": "انتقال سريع 6–10 فريمات (0.3 ث)",
    "whoosh_out": "خروج/ابتعاد، نغمة هابطة (0.45 ث)",
    "swoosh_up": "صعود عنصر أو خط (0.42 ث)",
    "pop": "ظهور شارة أو بطاقة أو أيقونة",
    "click": "نقرة واجهة/زر",
    "tick": "نقرة خفيفة جداً (كتابة، عدّاد)",
    "impact": "ضربة الشعار أو الكلمة الكبيرة، مع ذيل صدى (1.6 ث)",
    "riser": "تصاعد قبل لحظة مهمة (1.5 ث)، ينتهي فجأة",
    "pixel_1": "بكسل رقمي، النغمة 1 من 5 (خماسية صاعدة)",
    "pixel_2": "بكسل رقمي، النغمة 2",
    "pixel_3": "بكسل رقمي، النغمة 3",
    "pixel_4": "بكسل رقمي، النغمة 4",
    "pixel_5": "بكسل رقمي، النغمة 5",
    "shimmer": "لمعة خفيفة للخلفية (1.1 ث)",
}


def main() -> int:
    p = argparse.ArgumentParser(description="توليد مكتبة المؤثرات الصوتية")
    p.add_argument("--out", default=str(DEFAULT_OUT))
    p.add_argument("--overwrite", action="store_true")
    args = p.parse_args()

    out = Path(args.out) if args.out else DEFAULT_OUT
    if not out.is_absolute():
        out = Path.cwd() / out
    out.mkdir(parents=True, exist_ok=True)
    made = skipped = 0
    lines = ["# Sound effects pack", "", "Generated by `scripts/sfx_synth.py` (numpy only). No sample libraries are used.", "", "WAV, 48 kHz, 16-bit, stereo.", "", "| File | Use | Duration |", "|---|---|---|"]
    for name, fn in SOUNDS.items():
        path = out / f"{name}.wav"
        if path.exists() and not args.overwrite:
            skipped += 1
            with wave.open(str(path)) as w:
                dur = w.getnframes() / w.getframerate()
        else:
            data = fn()
            write_wav(path, data)
            dur = len(data) / SR
            made += 1
        lines.append(f"| `{name}.wav` | {DESCRIPTIONS[name]} | {dur:.2f} ث |")
    (out / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"OK: مؤثرات جديدة {made}، موجودة مسبقاً {skipped} -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
