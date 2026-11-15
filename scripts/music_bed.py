"""
يولّد موسيقى خلفية إلكترونية بسيطة (minimal electronic) بالكود فقط (numpy)، بلا عينات خارجية،
فهي آمنة للاستخدام التجاري. مصممة للإعلانات والريلز: 120 BPM افتراضياً = 15 فريم لكل نبضة على 30fps.

البنية (لكل 8 مازورات دورة): مقدمة (كيك + باد) ← دخول الهاي هات والباص ← بناء كامل مع الكلاب والأربيجيو.
التشغيل:
  python -I scripts/music_bed.py [--bpm 120] [--bars 32] [--out <path.wav>]
الافتراضي: <مساحة العمل>/audio/music/music_bed_<bpm>bpm.wav
مساحة العمل: متغير MOTION_STUDIO_WORKSPACE، وإلا ~/MotionStudio
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
RNG = np.random.default_rng(1205)

# Am - F - C - G (لكل مازورة وتر)
PROGRESSION = [
    (57, [57, 60, 64]),  # A minor
    (53, [53, 57, 60]),  # F
    (48, [55, 60, 64]),  # C
    (55, [55, 59, 62]),  # G
]


def mtof(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def place(buf: np.ndarray, sig: np.ndarray, at: int, gain: float = 1.0) -> None:
    end = min(len(buf), at + len(sig))
    if at < len(buf) and end > at:
        buf[at:end] += sig[: end - at] * gain


def kick() -> np.ndarray:
    t = np.arange(int(0.32 * SR)) / SR
    f = 46 + 110 * np.exp(-t * 32)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    click = np.exp(-t * 900) * 0.25 * np.sin(2 * np.pi * 2200 * t)
    return np.tanh((body + click) * 1.6)


def hat(open_: bool = False) -> np.ndarray:
    dur = 0.22 if open_ else 0.045
    t = np.arange(int(dur * SR)) / SR
    n = RNG.standard_normal(len(t))
    spec = np.fft.rfft(n)
    fr = np.fft.rfftfreq(len(n), 1 / SR)
    spec *= (fr > 7000)
    n = np.fft.irfft(spec, len(n))
    return n * np.exp(-t * (14 if open_ else 90)) * 0.5


def clap() -> np.ndarray:
    t = np.arange(int(0.25 * SR)) / SR
    n = RNG.standard_normal(len(t))
    spec = np.fft.rfft(n)
    fr = np.fft.rfftfreq(len(n), 1 / SR)
    spec *= np.exp(-0.5 * ((fr - 1600) / 900) ** 2)
    n = np.fft.irfft(spec, len(n))
    env = np.exp(-t * 22)
    for d in (0.008, 0.017):
        k = int(d * SR)
        env[k:] += np.exp(-t[: len(t) - k] * 30) * 0.6
    return n * env * 0.9


def bass_note(midi: int, dur: float) -> np.ndarray:
    t = np.arange(int(dur * SR)) / SR
    f = mtof(midi - 24)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t)
    env = np.minimum(1, t / 0.006) * np.exp(-t * 5)
    return np.tanh(x * env * 1.8) * 0.8


def pad_chord(notes: list[int], dur: float) -> np.ndarray:
    t = np.arange(int(dur * SR)) / SR
    x = np.zeros(len(t))
    for m in notes:
        for det in (-0.08, 0.0, 0.07):
            f = mtof(m + det)
            # موجة غنية مبسطة (مجموع توافقيات متناقصة)
            for h in range(1, 6):
                x += np.sin(2 * np.pi * f * h * t + h) / (h * 1.6)
    spec = np.fft.rfft(x)
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    spec *= 1 / (1 + (fr / 1800) ** 2)
    x = np.fft.irfft(spec, len(x))
    env = np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.3)
    return x * env


def pluck(midi: int) -> np.ndarray:
    t = np.arange(int(0.25 * SR)) / SR
    f = mtof(midi + 12)
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(6 * np.pi * f * t)
    return x * np.exp(-t * 18) * np.minimum(1, t / 0.002)


def render(bpm: float, bars: int) -> np.ndarray:
    beat = 60.0 / bpm
    bar = beat * 4
    n = int((bars * bar + 1.0) * SR)
    drums = np.zeros(n)
    bass = np.zeros(n)
    pad = np.zeros(n)
    arp = np.zeros(n)
    duck = np.ones(n)

    K, H, HO, C = kick(), hat(), hat(True), clap()
    duck_shape = 1 - 0.65 * np.exp(-np.arange(int(beat * SR)) / SR * 9)

    for b in range(bars):
        cyc = b % 16
        section = 0 if b < 2 else (1 if cyc < 8 else 2)
        root, chord = PROGRESSION[b % 4]
        t0 = b * bar
        # الباد: طول المازورة
        place(pad, pad_chord(chord, bar + 0.3), int(t0 * SR), 0.10)
        for q in range(4):
            tb = t0 + q * beat
            i = int(tb * SR)
            place(drums, K, i, 1.0)
            seg = duck_shape[: max(0, min(len(duck_shape), n - i))]
            duck[i:i + len(seg)] = np.minimum(duck[i:i + len(seg)], seg)
            if section >= 1:
                place(drums, H, int((tb + beat / 2) * SR), 0.55 + 0.1 * RNG.random())
            if section >= 2 and q in (1, 3):
                place(drums, C, i, 0.55)
            if section >= 1:
                for e in range(2):
                    place(bass, bass_note(root, beat / 2 * 0.9), int((tb + e * beat / 2) * SR), 1.0 if e == 0 else 0.7)
        if section >= 1 and b % 2 == 1:
            place(drums, HO, int((t0 + 3.5 * beat) * SR), 0.18)
        if section >= 2:
            seq = chord + [chord[1] + 12]
            for s in range(16):
                place(arp, pluck(seq[s % len(seq)]), int((t0 + s * beat / 4) * SR), 0.14 if s % 4 == 0 else 0.09)

    mix = drums * 0.9 + bass * 0.55 * duck + pad * duck + arp * (0.6 + 0.4 * duck)
    # نهاية: ذيل قصير بعد آخر مازورة
    tail = int(1.0 * SR)
    mix[-tail:] *= np.linspace(1, 0, tail) ** 2
    mix = np.tanh(mix * 0.9)
    mix /= np.max(np.abs(mix)) or 1
    mix *= 10 ** (-1.5 / 20)
    # ستيريو بسيط: الأربيجيو والهاي هات أعرض قليلاً
    wide = (arp * 0.25 + drums * 0.0)
    left = mix + wide * 0.15
    right = mix - wide * 0.15
    st = np.stack([left, right], axis=1)
    return st / max(1.0, np.max(np.abs(st)) / 10 ** (-1.0 / 20))


def main() -> int:
    p = argparse.ArgumentParser(description="توليد موسيقى خلفية بالكود")
    p.add_argument("--bpm", type=float, default=120)
    p.add_argument("--bars", type=int, default=32)
    p.add_argument("--out")
    p.add_argument("--overwrite", action="store_true")
    args = p.parse_args()
    out = Path(args.out) if args.out else WORKSPACE / "audio" / "music" / f"music_bed_{int(args.bpm)}bpm.wav"
    if not out.is_absolute():
        out = Path.cwd() / out
    if out.exists() and not args.overwrite:
        print(f"OK: موجود مسبقاً (استخدم --overwrite لإعادة التوليد): {out}")
        return 0
    out.parent.mkdir(parents=True, exist_ok=True)
    data = render(args.bpm, args.bars)
    pcm = (np.clip(data, -1, 1) * 32767).astype("<i2")
    with wave.open(str(out), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"OK: {out} ({len(data) / SR:.1f} ث، {args.bpm:g} BPM، {args.bars} مازورة)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
