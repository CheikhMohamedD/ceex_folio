#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  FEKK — bande-son 20 s, 100 % JavaScript (Node ≥ 22, aucune dépendance).
//  Afro-house minimal à 120 BPM inspiré du sabar + sound design calé sur la
//  cue sheet de STORYBOARD.md.  Sortie : audio/fekk.wav (48 kHz, stéréo, 16 bits).
//
//  Tonalité unique : fa majeur / ré mineur relatif. Les mélodies (kora, cloches,
//  pings) n'utilisent que la pentatonique F G A C D (= ré mineur pentatonique).
//  Grille harmonique : Dm9 → B♭maj9 → C6/9 → Fadd9 (cadence IV–V–I au logo).
//
//  Chaîne : oscillateurs (sinus, saw polyBLEP, FM, Karplus-Strong) → enveloppes
//  ADSR (rampes ≥ 2 ms partout) → biquads RBJ → saturation douce → bus
//  (drums, bass, pad, music, sfx, amb) → sidechain du kick → envois réverb
//  Freeverb + delay ping-pong → master (HP, compresseur, saturation, limiteur
//  à anticipation, normalisation BS.1770 à -14 LUFS, true-peak < -1 dBTP) →
//  dither TPDF → WAV PCM 16 bits.  Tout l'aléatoire passe par un PRNG seedé.
// ─────────────────────────────────────────────────────────────────────────────
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'fekk.wav');

const SR = 48000;
const DUR = 20;
const N = SR * DUR;
const TAU = Math.PI * 2;
const BEAT = 0.5;            // 120 BPM
const STEP = BEAT / 4;       // double-croche
const BAR = BEAT * 4;        // 2 s
const TARGET_LUFS = -14;
const TP_CEIL = -1.2;        // dBTP visé (marge sous -1)

// ── utilitaires ─────────────────────────────────────────────────────────────
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const RNG = mulberry32(0xf3cc2026);           // décisions musicales
let noiseSeed = 7;
const noiseGen = () => { const r = mulberry32(Math.imul(noiseSeed++, 2654435761)); return () => r() * 2 - 1; };
const rr = (a, b) => a + (b - a) * RNG();
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const db = (d) => Math.pow(10, d / 20);
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, u) => a + (b - a) * u;
const smooth = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
const softclip = (x, drive = 1) => Math.tanh(x * drive) / Math.tanh(drive);

// enveloppe ADSR linéaire (attaque ≥ 2 ms imposée)
function adsr(t, gate, a, d, s, r) {
  a = Math.max(a, 0.002); r = Math.max(r, 0.003);
  let v;
  if (t < a) v = t / a;
  else if (t < a + d) v = 1 - (1 - s) * ((t - a) / d);
  else v = s;
  if (t >= gate) {
    const atGate = gate < a ? gate / a : gate < a + d ? 1 - (1 - s) * ((gate - a) / d) : s;
    v = Math.min(v, atGate) * Math.max(0, 1 - (t - gate) / r);
  }
  return v;
}

// ── biquad RBJ ──────────────────────────────────────────────────────────────
class Biquad {
  constructor(type = 'lp', f = 1000, q = 0.707, gain = 0) { this.x1 = this.x2 = this.y1 = this.y2 = 0; this.set(type, f, q, gain); }
  set(type, f, q = 0.707, gain = 0) {
    this.type = type;
    f = clamp(f, 10, SR * 0.45);
    const w = (TAU * f) / SR, c = Math.cos(w), s = Math.sin(w), al = s / (2 * q);
    const A = Math.pow(10, gain / 40);
    let b0, b1, b2, a0, a1, a2;
    switch (type) {
      case 'hp': b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; break;
      case 'bp': b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; break;
      case 'peak': b0 = 1 + al * A; b1 = -2 * c; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * c; a2 = 1 - al / A; break;
      case 'ls': {
        const sq = 2 * Math.sqrt(A) * al;
        b0 = A * ((A + 1) - (A - 1) * c + sq); b1 = 2 * A * ((A - 1) - (A + 1) * c); b2 = A * ((A + 1) - (A - 1) * c - sq);
        a0 = (A + 1) + (A - 1) * c + sq; a1 = -2 * ((A - 1) + (A + 1) * c); a2 = (A + 1) + (A - 1) * c - sq; break;
      }
      case 'hs': {
        const sq = 2 * Math.sqrt(A) * al;
        b0 = A * ((A + 1) + (A - 1) * c + sq); b1 = -2 * A * ((A - 1) + (A + 1) * c); b2 = A * ((A + 1) + (A - 1) * c - sq);
        a0 = (A + 1) - (A - 1) * c + sq; a1 = 2 * ((A - 1) - (A + 1) * c); a2 = (A + 1) - (A - 1) * c - sq; break;
      }
      default: b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al;
    }
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0;
    return this;
  }
  p(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y;
    return y;
  }
}
const filt = (buf, ...fs) => { for (let i = 0; i < buf.length; i++) { let v = buf[i]; for (const f of fs) v = f.p(v); buf[i] = v; } return buf; };

// ── oscillateurs ────────────────────────────────────────────────────────────
function polyblep(t, dt) {
  if (t < dt) { t /= dt; return t + t - t * t - 1; }
  if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; }
  return 0;
}
class Saw {
  constructor(phase = 0) { this.ph = phase; }
  p(f) { const dt = f / SR; this.ph += dt; if (this.ph >= 1) this.ph -= 1; return 2 * this.ph - 1 - polyblep(this.ph, dt); }
}
class Square {
  constructor(phase = 0) { this.ph = phase; }
  p(f) {
    const dt = f / SR; this.ph += dt; if (this.ph >= 1) this.ph -= 1;
    let v = this.ph < 0.5 ? 1 : -1;
    v += polyblep(this.ph, dt);
    let t2 = this.ph + 0.5; if (t2 >= 1) t2 -= 1;
    v -= polyblep(t2, dt);
    return v;
  }
}

// ── bus & placement ─────────────────────────────────────────────────────────
const mkBus = () => ({ L: new Float32Array(N), R: new Float32Array(N) });
const BUS = { drums: mkBus(), bass: mkBus(), pad: mkBus(), music: mkBus(), sfx: mkBus(), amb: mkBus(), rev: mkBus(), dly: mkBus() };

// Place une voix mono (rampes d'entrée/sortie automatiques → pas de clic).
function place(bus, t0, mono, { gain = 1, pan = 0, rev = 0, dly = 0, fadeIn = 0.002, fadeOut = 0.005 } = {}) {
  const n = mono.length;
  const fi = Math.min(n, Math.max(1, Math.round(fadeIn * SR)));
  const fo = Math.min(n, Math.max(1, Math.round(fadeOut * SR)));
  for (let i = 0; i < fi; i++) mono[i] *= i / fi;
  for (let i = 0; i < fo; i++) mono[n - 1 - i] *= i / fo;
  const a = ((clamp(pan, -1, 1) + 1) * Math.PI) / 4;
  const gl = Math.cos(a) * Math.SQRT2 * gain, gr = Math.sin(a) * Math.SQRT2 * gain;
  const s0 = Math.round(t0 * SR);
  for (let i = 0; i < n; i++) {
    const j = s0 + i; if (j < 0) continue; if (j >= N) break;
    const l = mono[i] * gl, r = mono[i] * gr;
    bus.L[j] += l; bus.R[j] += r;
    if (rev) { BUS.rev.L[j] += l * rev; BUS.rev.R[j] += r * rev; }
    if (dly) { BUS.dly.L[j] += l * dly; BUS.dly.R[j] += r * dly; }
  }
}
function placeStereo(bus, t0, L, R, { gain = 1, rev = 0, dly = 0, fadeIn = 0.002, fadeOut = 0.008 } = {}) {
  const n = L.length;
  const fi = Math.min(n, Math.max(1, Math.round(fadeIn * SR))), fo = Math.min(n, Math.max(1, Math.round(fadeOut * SR)));
  for (let i = 0; i < fi; i++) { L[i] *= i / fi; R[i] *= i / fi; }
  for (let i = 0; i < fo; i++) { L[n - 1 - i] *= i / fo; R[n - 1 - i] *= i / fo; }
  const s0 = Math.round(t0 * SR);
  for (let i = 0; i < n; i++) {
    const j = s0 + i; if (j < 0) continue; if (j >= N) break;
    const l = L[i] * gain, r = R[i] * gain;
    bus.L[j] += l; bus.R[j] += r;
    if (rev) { BUS.rev.L[j] += l * rev; BUS.rev.R[j] += r * rev; }
    if (dly) { BUS.dly.L[j] += l * dly; BUS.dly.R[j] += r * dly; }
  }
}
const len = (sec) => new Float32Array(Math.max(1, Math.round(sec * SR)));

// sidechain : liste de déclencheurs [temps, profondeur]
const SC = [];

// ═════════════════════════════════════════════════════════════════════════════
//  INSTRUMENTS
// ═════════════════════════════════════════════════════════════════════════════

// Kick rond : sinus à chute de hauteur + petit clic, saturation douce.
function kick(vel = 1, { dur = 0.5, tail = 0.17, fEnd = 47 } = {}) {
  const out = len(dur), nz = noiseGen(), hp = new Biquad('hp', 1800, 0.7);
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const f = fEnd + 115 * Math.exp(-t / 0.032) + 70 * Math.exp(-t / 0.005);
    ph += (TAU * f) / SR;
    const amp = Math.min(1, t / 0.0012) * Math.exp(-t / tail) * (t > dur - 0.06 ? (dur - t) / 0.06 : 1);
    const click = hp.p(nz()) * Math.exp(-t / 0.0018) * 0.35;
    out[i] = softclip(Math.sin(ph) * amp * 1.15 + click, 1.6) * vel;
  }
  return out;
}

// Shaker : bruit filtré passe-bande aigu, attaque douce (graines qui roulent).
function shaker(vel = 1, decay = 0.035) {
  const out = len(0.12), nz = noiseGen(), hp = new Biquad('hp', 5200, 0.7), bp = new Biquad('bp', 8500, 0.9);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const e = t < 0.006 ? t / 0.006 : Math.exp(-(t - 0.006) / decay);
    out[i] = bp.p(hp.p(nz())) * e * vel * 2.4;
  }
  return out;
}

// Hi-hat ouvert « métal » : 6 carrés inharmoniques + bruit, passe-haut.
function openHat(vel = 1, decay = 0.09) {
  const out = len(0.3), nz = noiseGen(), hp = new Biquad('hp', 7000, 0.8), hp2 = new Biquad('hp', 6000, 0.7);
  const fr = [205.3, 304.4, 369.6, 522.7, 540.0, 800.0].map((f) => f * 1.7);
  const osc = fr.map((_, k) => new Square(k * 0.13));
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    let m = 0; for (let k = 0; k < 6; k++) m += osc[k].p(fr[k]);
    const e = Math.min(1, t / 0.002) * Math.exp(-t / decay);
    out[i] = hp2.p(hp.p(m * 0.12 + nz() * 0.5)) * e * vel;
  }
  return out;
}

// Crash / cymbale douce (même moteur, décroissance longue, sombre).
function crash(vel = 1, decay = 0.9, dur = 2.2) {
  const out = len(dur), nz = noiseGen(), hp = new Biquad('hp', 3500, 0.6), lp = new Biquad('lp', 11000, 0.6);
  const fr = [205.3, 304.4, 369.6, 522.7, 540.0, 800.0].map((f) => f * 2.3);
  const osc = fr.map((_, k) => new Square(k * 0.21));
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    let m = 0; for (let k = 0; k < 6; k++) m += osc[k].p(fr[k]);
    const e = Math.min(1, t / 0.004) * Math.exp(-t / decay);
    out[i] = lp.p(hp.p(m * 0.08 + nz() * 0.6)) * e * vel;
  }
  return out;
}

// Clave (bois) : deux partiels + clic.
function clave(vel = 1, f = 2350) {
  const out = len(0.09), nz = noiseGen(), bp = new Biquad('bp', 3200, 2);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const e = Math.min(1, t / 0.0008) * Math.exp(-t / 0.018);
    out[i] = (Math.sin(TAU * f * t) * 0.8 + Math.sin(TAU * f * 2.71 * t) * 0.15 * Math.exp(-t / 0.006) + bp.p(nz()) * 0.3 * Math.exp(-t / 0.003)) * e * vel;
  }
  return out;
}

// Tambour sabar : membrane à chute de hauteur + claque du bâton.
//   gin = grave ouvert · tan = medium · pax = claque aiguë sèche
const SABAR = {
  gin: { f: 116, decay: 0.26, slap: 0.25, slapF: 900, bend: 0.9 },
  tan: { f: 196, decay: 0.15, slap: 0.45, slapF: 1700, bend: 0.75 },
  pax: { f: 294, decay: 0.07, slap: 1.0, slapF: 2600, bend: 0.6 },
};
function sabar(type = 'tan', vel = 1, pitch = 1) {
  const P = SABAR[type], out = len(P.decay * 4 + 0.05), nz = noiseGen();
  const bp = new Biquad('bp', P.slapF * pitch, 1.3), hp = new Biquad('hp', 400, 0.7);
  let ph = 0, ph2 = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const f = P.f * pitch * (1 + P.bend * Math.exp(-t / 0.016)) * (1 - 0.07 * Math.min(1, t / 0.3));
    ph += (TAU * f) / SR; ph2 += (TAU * f * 1.59) / SR;
    const body = (Math.sin(ph) + 0.35 * Math.sin(ph2) * Math.exp(-t / (P.decay * 0.35))) * Math.exp(-t / P.decay);
    const slap = hp.p(bp.p(nz())) * Math.exp(-t / 0.011) * P.slap * 2.2;
    out[i] = softclip((body + slap) * Math.min(1, t / 0.0008), 1.4) * vel;
  }
  return out;
}

// Basse sub : sinus + harmoniques légères, ADSR, saturation, passe-bas.
function bassNote(f, gate, vel = 1) {
  const out = len(gate + 0.06), lp = new Biquad('lp', 700, 0.8);
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const ff = f * (1 + 0.04 * Math.exp(-t / 0.012));
    ph += (TAU * ff) / SR;
    const e = adsr(t, gate, 0.004, 0.12, 0.72, 0.04);
    const s = Math.sin(ph) + 0.32 * Math.sin(2 * ph) + 0.16 * Math.sin(3 * ph) + 0.06 * Math.sin(4 * ph);
    out[i] = lp.p(softclip(s * e * 1.2, 1.8)) * vel;
  }
  return out;
}

// Pad chaud : 3 saws désaccordées par note, gauche/droite décorrélées.
function padChord(notes, dur, { att = 0.5, rel = 0.6, gain = 1 } = {}) {
  const L = len(dur + rel), R = len(dur + rel);
  const det = [-0.11, 0, 0.09];
  for (const m of notes) {
    const f = mtof(m);
    for (const side of [L, R]) {
      const oscs = det.map((d, k) => ({ o: new Saw(RNG()), f: f * Math.pow(2, (d + (side === L ? -0.035 : 0.035) * (k - 1)) / 12) }));
      const vib = RNG() * TAU;
      for (let i = 0; i < side.length; i++) {
        const t = i / SR;
        const v = 1 + 0.0012 * Math.sin(TAU * 4.6 * t + vib);
        let s = 0; for (const o of oscs) s += o.o.p(o.f * v);
        // attaque en S (pas de clic), relâchement en cosinus
        const ea = smooth(t / att);
        const er = t < dur ? 1 : 0.5 + 0.5 * Math.cos(Math.PI * clamp((t - dur) / rel, 0, 1));
        side[i] += (s / 3) * ea * er * gain / Math.sqrt(notes.length);
      }
    }
  }
  return [L, R];
}

// Corde pincée Karplus-Strong (timbre kora) : excitation bruitée filtrée avec
// position de pincement, boucle moyenneuse amortie, petite résonance de caisse.
function pluck(f, { dur = 1.6, t60 = 1.3, bright = 0.55, vel = 1 } = {}) {
  const out = len(dur), nz = noiseGen();
  const P = SR / f, D = P - 0.5;               // compense le demi-échantillon du moyenneur
  const rho = Math.pow(10, -3 / (f * t60));
  const exLen = Math.round(P);
  const ex = new Float32Array(exLen);
  let lpz = 0; const a = clamp(bright, 0.05, 0.98);
  for (let i = 0; i < exLen; i++) { lpz += a * (nz() - lpz); ex[i] = lpz; }
  const pick = Math.max(1, Math.round(exLen * 0.13));
  const ex2 = new Float32Array(exLen);
  let mean = 0;
  for (let i = 0; i < exLen; i++) { ex2[i] = ex[i] - (i >= pick ? ex[i - pick] : 0); mean += ex2[i]; }
  mean /= exLen;
  const read = (x) => { if (x < 0) return 0; const i0 = Math.floor(x), fr = x - i0; return out[i0] * (1 - fr) + out[i0 + 1] * fr; };
  for (let i = 0; i < out.length; i++) {
    const e = i < exLen ? (ex2[i] - mean) * Math.min(1, i / 24) : 0;
    const x = i - D;
    out[i] = e + (x >= 1 ? rho * 0.5 * (read(x) + read(x - 1)) : 0);
  }
  const body = new Biquad('peak', 2600, 1.2, 4), body2 = new Biquad('peak', 320, 1.5, 3), hp = new Biquad('hp', 90, 0.7);
  for (let i = 0; i < out.length; i++) out[i] = hp.p(body2.p(body.p(out[i]))) * vel * 1.4;
  return out;
}

// Cloche FM (rapport inharmonique) — notifications, carillon, pings.
function bell(f, { dur = 1.4, ratio = 3.5, index = 2, decay = 0.45, idxDecay = 0.12, vel = 1, att = 0.002, partial = 0 } = {}) {
  const out = len(dur);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const I = index * Math.exp(-t / idxDecay);
    let s = Math.sin(TAU * f * t + I * Math.sin(TAU * f * ratio * t));
    if (partial) s += partial * Math.sin(TAU * f * 2.756 * t) * Math.exp(-t / (decay * 0.25));
    out[i] = s * Math.min(1, t / att) * Math.exp(-t / decay) * vel;
  }
  return out;
}

// Stab d'accord (hits de S2) : saws + passe-bas à enveloppe.
function stab(notes, vel = 1, dur = 0.42) {
  const out = len(dur), lp = new Biquad('lp', 3000, 1.6);
  const oscs = []; for (const m of notes) for (const d of [-0.08, 0.08]) oscs.push({ o: new Saw(RNG()), f: mtof(m) * Math.pow(2, d / 12) });
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    if ((i & 15) === 0) lp.set('lp', 500 + 5200 * Math.exp(-t / 0.07), 1.6);
    let s = 0; for (const o of oscs) s += o.o.p(o.f);
    out[i] = lp.p(s / oscs.length) * adsr(t, dur - 0.12, 0.003, 0.1, 0.35, 0.11) * vel * 1.6;
  }
  return out;
}

// Clap : trois micro-bursts + queue.
function clap(vel = 1) {
  const out = len(0.25), nz = noiseGen(), bp = new Biquad('bp', 1500, 1.1), hp = new Biquad('hp', 600, 0.7);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    let e = 0;
    for (const o of [0, 0.009, 0.018]) if (t >= o) e = Math.max(e, Math.exp(-(t - o) / 0.006));
    if (t >= 0.022) e = Math.max(e, 0.55 * Math.exp(-(t - 0.022) / 0.07));
    out[i] = hp.p(bp.p(nz())) * e * Math.min(1, t / 0.0006) * vel * 2;
  }
  return out;
}

// Bruit « inversé » (swell / reverse cymbal) : montée exponentielle, filtre qui s'ouvre.
function swell(dur, { f0 = 600, f1 = 9000, q = 0.8, curve = 2.6, vel = 1 } = {}) {
  const out = len(dur), nz = noiseGen(), bp = new Biquad('bp', f0, q), hp = new Biquad('hp', 250, 0.7);
  for (let i = 0; i < out.length; i++) {
    const u = i / out.length;
    if ((i & 15) === 0) bp.set('bp', f0 * Math.pow(f1 / f0, u), q);
    out[i] = hp.p(bp.p(nz())) * Math.pow(u, curve) * vel * 2.2;
  }
  return out;
}

// ═════════════════════════════════════════════════════════════════════════════
//  HARMONIE
// ═════════════════════════════════════════════════════════════════════════════
const CHORD = {
  Dm: { bass: 38, pad: [53, 57, 60, 64], kora: [62, 65, 69, 72, 74, 77] },      // Dm9 (sans fondamentale)
  Bb: { bass: 34, pad: [53, 57, 60, 62], kora: [62, 65, 69, 72, 74, 77] },      // B♭maj9
  C: { bass: 36, pad: [55, 60, 62, 64], kora: [60, 67, 69, 72, 74, 79] },       // C6/9
  F: { bass: 41, pad: [57, 60, 65, 67], kora: [65, 69, 72, 74, 77, 79] },       // Fadd9
};
const PROG = [
  [0.0, 3.5, 'Dm'], [3.5, 5.5, 'Dm'], [5.5, 6.6, 'Bb'], [6.6, 7.0, 'C'],
  [7.0, 9.0, 'F'], [9.0, 11.0, 'Dm'], [11.0, 12.0, 'Bb'], [12.0, 13.4, 'C'],
  [13.4, 15.5, 'F'], [15.5, 17.0, 'Bb'], [17.0, 17.8, 'C'], [17.8, 20.0, 'F'],
];
const chordAt = (t) => CHORD[(PROG.find(([a, b]) => t >= a && t < b) || PROG[PROG.length - 1])[2]];

// ═════════════════════════════════════════════════════════════════════════════
//  PARTITION
// ═════════════════════════════════════════════════════════════════════════════
const drums = BUS.drums, music = BUS.music, sfx = BUS.sfx;
const hum = () => rr(-0.004, 0.004);
const at = (t) => Math.max(0, t + hum());   // humanisation, jamais avant 0

// ── Kicks (et déclencheurs de sidechain) ───────────────────────────────────
const KICKS = [];
for (const t of [0, 1, 2]) KICKS.push([t, 0.5]);                       // demi-groove intro
for (let t = 3.5; t < 6.0 - 1e-6; t += BEAT) KICKS.push([t, t === 3.5 ? 1 : 0.92]);   // drop
for (let t = 7.0; t < 15.0 - 1e-6; t += BEAT) KICKS.push([t, 0.9]);     // groove lumineux
KICKS.push([15.5, 0.55], [16.5, 0.5], [17.0, 0.45]);                    // retrouvailles (léger)
for (const [t, v] of KICKS) { place(drums, t, kick(v), { fadeIn: 0.0008, fadeOut: 0.03 }); SC.push([t, v]); }
place(drums, 17.8, kick(0.85, { dur: 1.0, tail: 0.24, fEnd: 43.6 }), { fadeIn: 0.0008, fadeOut: 0.2 });   // fa grave au logo
SC.push([17.8, 0.7]);

// ── Shaker, claves, open-hat, sabar ────────────────────────────────────────
const CLAVE_32 = [0, 3, 6, 10, 12];
const SABAR_A = [[2, 'pax', 0.6], [3, 'tan', 0.45], [7, 'gin', 0.75], [10, 'pax', 0.55], [11, 'tan', 0.4], [13, 'pax', 0.65], [15, 'gin', 0.55]];
const SABAR_B = [[1, 'tan', 0.4], [2, 'pax', 0.6], [5, 'tan', 0.45], [7, 'gin', 0.75], [9, 'pax', 0.5], [10, 'pax', 0.6], [12, 'tan', 0.45], [14, 'gin', 0.6], [15, 'pax', 0.55]];
function grooveRegion(t0, t1, { shakerVel = 1, clave: cl = true, hat = false, sab = 1, shaker8 = false } = {}) {
  const s0 = Math.ceil(t0 / STEP - 1e-6), s1 = Math.floor(t1 / STEP - 1e-6);
  for (let s = s0; s <= s1; s++) {
    const t = s * STEP, st = s % 16, bar = Math.floor(s / 16);
    if (t >= t1) break;
    const off = st % 4 === 2;
    if (!shaker8 || st % 2 === 0) {
      const v = (off ? 1 : st % 2 ? 0.42 : 0.6) * shakerVel * rr(0.85, 1.05);
      place(drums, at(t + (st % 2 ? 0.011 : 0)), shaker(v, off ? 0.045 : 0.03), { pan: 0.28, rev: 0.06 });
    }
    if (cl && CLAVE_32.includes(st)) place(drums, at(t), clave(0.38 * (st === 0 ? 1 : 0.85)), { pan: -0.3, rev: 0.12 });
    if (hat && off) place(drums, at(t), openHat(0.46 * rr(0.85, 1)), { pan: -0.12, rev: 0.05 });
    if (sab > 0) {
      const pat = bar % 2 ? SABAR_B : SABAR_A;
      for (const [ps, ty, v] of pat) if (ps === st) {
        const pan = ty === 'gin' ? 0.12 : ty === 'tan' ? -0.22 : 0.35;
        place(drums, at(t), sabar(ty, v * sab * rr(0.85, 1.05), rr(0.985, 1.015)), { pan, rev: 0.1 });
      }
    }
  }
}
grooveRegion(0.0, 2.25, { shakerVel: 0.45, sab: 0.0, shaker8: false });
grooveRegion(3.5, 6.0, { shakerVel: 0.9, sab: 0.9 });
grooveRegion(6.0, 6.6, { shakerVel: 0.55, sab: 0, clave: true });
grooveRegion(7.0, 15.0, { shakerVel: 1, hat: true, sab: 0.8 });
grooveRegion(15.5, 17.35, { shakerVel: 0.5, sab: 0.45, shaker8: true, clave: false });

// ── Basse ──────────────────────────────────────────────────────────────────
const BASS_PAT = [[0, 0, 0.22], [3, 0, 0.2], [6, 7, 0.14], [8, 0, 0.22], [11, 12, 0.12], [14, 7, 0.16]];
function bassRegion(t0, t1, vel = 1) {
  for (let b = Math.floor(t0 / BAR); b * BAR < t1; b++) {
    for (const [st, iv, g] of BASS_PAT) {
      const t = b * BAR + st * STEP;
      if (t < t0 - 1e-6 || t >= t1 - 1e-6) continue;
      const root = chordAt(t + 0.001).bass;
      place(BUS.bass, t, bassNote(mtof(root + iv), Math.min(g, t1 - t - 0.04), vel * (st === 0 ? 1 : 0.9)), { fadeOut: 0.02 });
    }
  }
}
bassRegion(3.5, 6.0, 1);
bassRegion(7.0, 15.0, 0.95);
// accent chaud sous « Jërëjëf » et fondamentale du logo
place(BUS.bass, 16.6, bassNote(mtof(34), 0.6, 0.6), { fadeOut: 0.04 });
{
  const b = len(2.2); let ph = 0;
  for (let i = 0; i < b.length; i++) { const t = i / SR; ph += (TAU * mtof(29)) / SR; b[i] = (Math.sin(ph) + 0.45 * Math.sin(2 * ph) + 0.12 * Math.sin(3 * ph)) * adsr(t, 1.0, 0.01, 0.4, 0.5, 0.95) * 0.5; }
  place(BUS.bass, 17.8, b, { fadeOut: 0.1 });
}

// ── Pad ────────────────────────────────────────────────────────────────────
const PAD_SEG = [
  [0.0, 3.447, 'Dm', 0.7, 0.55, 0.004], [3.5, 5.5, 'Dm', 0.03, 0.5], [5.5, 6.6, 'Bb', 0.15, 0.5], [6.6, 7.0, 'C', 0.2, 0.55],
  [7.0, 9.0, 'F', 0.05, 0.5], [9.0, 11.0, 'Dm', 0.12, 0.5], [11.0, 12.0, 'Bb', 0.12, 0.5], [12.0, 13.4, 'C', 0.12, 0.5],
  [13.4, 15.5, 'F', 0.08, 0.5], [15.5, 17.0, 'Bb', 0.3, 0.62], [17.0, 17.8, 'C', 0.15, 0.62], [17.8, 20.0, 'F', 0.02, 0.9],
];
for (const [a, b, name, att, g, rel = 0.12] of PAD_SEG) {
  const final = a >= 17.8;
  const notes = final ? [53, 57, 60, 65, 67, 69, 72] : CHORD[name].pad;
  const [L, R] = padChord(notes, final ? 0.9 : b - a, { att, rel: final ? 1.25 : rel, gain: g });
  placeStereo(BUS.pad, a, L, R, { rev: final ? 0.5 : 0.3, fadeIn: 0.003, fadeOut: Math.min(0.01, rel) });
}
// filtre du pad, automatisé par section
function padCutoff(t) {
  if (t < 3.0) return 650 + 150 * (t / 3);
  if (t < 3.5) return lerp(800, 3200, smooth((t - 3) / 0.45));
  if (t < 6.0) return 1500;
  if (t < 6.6) return 1100;
  if (t < 7.0) return lerp(1100, 3200, smooth((t - 6.6) / 0.4));
  if (t < 15.0) return 2300 + 300 * Math.sin(TAU * 0.25 * (t - 7));
  if (t < 15.5) return lerp(2300, 1400, smooth((t - 15) / 0.5));
  if (t < 17.2) return 1500;
  if (t < 17.8) return lerp(1500, 4200, smooth((t - 17.2) / 0.6));
  return lerp(4200, 900, smooth((t - 17.8) / 2.2));
}

// ── Kora ───────────────────────────────────────────────────────────────────
function kora(t, m, vel, { pan = rr(-0.45, 0.45), rev = 0.22, dly = 0, t60 = 1.2, bright = 0.55, dur = 1.5 } = {}) {
  place(music, t, pluck(mtof(m), { vel, t60, bright, dur }), { pan, rev, dly, fadeIn: 0.001, fadeOut: 0.05 });
}
// motif d'ouverture (avant le klaxon)
kora(0.04, 74, 0.5, { pan: -0.2, dly: 0.25 }); kora(0.29, 69, 0.36, { pan: 0.25, dly: 0.2 });
// ostinato kora du groove lumineux : alternance pouce grave / doigts aigus
const KORA_IDX = [0, 3, 1, 3, 4, 2, 1, 3, 0, 3, 1, 4, 5, 3, 2, 1];
for (let s = Math.round(7.0 / STEP); s * STEP < 14.9; s++) {
  const t = s * STEP, st = s % 16;
  if (t >= 7.75 && t < 9.65 && st % 2) continue;   // aère pendant la frappe
  if (t >= 11.95 && t < 12.9) continue;            // laisse la place à la notification
  if (t >= 13.35 && t < 14.3) continue;            // laisse la place à l'arpège
  if (RNG() < 0.18 && st % 4) continue;
  const tones = chordAt(t + 0.001).kora;
  const m = tones[KORA_IDX[st] % tones.length];
  const v = (st % 4 === 0 ? 0.36 : st % 2 ? 0.2 : 0.27) * rr(0.85, 1.1);
  kora(at(t), m, v, { pan: st % 2 ? 0.35 : -0.3, t60: 0.9, bright: 0.5, dur: 1.1, rev: 0.16 });
}
// mélodie des retrouvailles (croches, chantante)
const MEL = [[15.5, 69], [15.75, 72], [16.0, 74], [16.25, 72], [16.5, 77], [17.0, 74], [17.25, 72], [17.5, 79]];
for (const [t, m] of MEL) kora(t, m, 0.38, { pan: rr(-0.3, 0.3), t60: 1.6, bright: 0.6, dur: 1.8, rev: 0.3, dly: 0.15 });

// ═════════════════════════════════════════════════════════════════════════════
//  SOUND DESIGN (cue sheet)
// ═════════════════════════════════════════════════════════════════════════════

// 0.0 — Ambiance de rue : bruit rose doux filtré, respiration lente, voix lointaines.
{
  const d = 3.45, L = len(d), R = len(d);
  for (const [buf, seedOff] of [[L, 0], [R, 1]]) {
    const nz = noiseGen(); const hp = new Biquad('hp', 180, 0.6), lp = new Biquad('lp', 1600, 0.6);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < buf.length; i++) {
      const t = i / SR, w = nz();
      b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0527;   // bruit rose
      const pink = (b0 + b1 + b2 + w * 0.1848) * 0.2;
      const breath = 0.75 + 0.25 * Math.sin(TAU * (0.31 + seedOff * 0.07) * t + seedOff);
      buf[i] = lp.p(hp.p(pink)) * breath * smooth(t / 0.35) * 0.55;
    }
  }
  // brouhaha : formants vocaux lointains (bandes de bruit modulées)
  for (let k = 0; k < 7; k++) {
    const t0 = rr(0.05, 2.9), dd = rr(0.25, 0.6), b = len(dd), nz = noiseGen();
    const f1 = rr(450, 800), f2 = rr(1100, 1900), bp1 = new Biquad('bp', f1, 6), bp2 = new Biquad('bp', f2, 7);
    for (let i = 0; i < b.length; i++) { const t = i / SR, x = nz(); b[i] = (bp1.p(x) + 0.6 * bp2.p(x)) * Math.sin(Math.PI * t / dd) * (0.6 + 0.4 * Math.sin(TAU * rr(4, 6) * t)) * 0.9; }
    place(BUS.amb, t0, b, { pan: rr(-0.8, 0.8), rev: 0.3, fadeOut: 0.02 });
  }
  placeStereo(BUS.amb, 0, L, R, { rev: 0.1, fadeIn: 0.01 });
}

// 0.25–2.5 — Moteur du car rapide : arrive par la droite, ralenti, repart à gauche.
{
  const t0 = 0.25, d = 2.3, b = len(d), lp = new Biquad('lp', 520, 1.1), lp2 = new Biquad('lp', 1100, 0.7), hpE = new Biquad('hp', 70, 0.7);
  const osc = new Saw(0), osc2 = new Square(0.3), nz = noiseGen();
  let ph = 0;
  const pans = new Float32Array(b.length);
  for (let i = 0; i < b.length; i++) {
    const t = i / SR + t0;
    const rev = t < 1.4 ? lerp(1.15, 0.85, smooth((t - 0.25) / 1.1)) : lerp(0.85, 1.5, smooth((t - 1.55) / 0.8));
    const f = 46 * rev;
    ph += (TAU * f * 0.5) / SR;
    const putt = 0.55 + 0.45 * Math.max(0, Math.sin(ph)) ** 2;    // explosions du moteur diesel
    const amp = smooth((t - 0.25) / 0.35) * (t < 1.4 ? 1 : t < 1.55 ? 0.75 : lerp(1.1, 0, smooth((t - 1.9) / 0.6)));
    b[i] = hpE.p(lp2.p(lp.p(osc.p(f) * 0.6 + osc2.p(f * 2) * 0.35 + nz() * 0.25))) * putt * amp * 1.6;
    pans[i] = t < 1.4 ? lerp(0.75, 0.05, smooth((t - 0.25) / 1.1)) : lerp(0.05, -0.85, smooth((t - 1.55) / 0.9));
  }
  // panoramique dynamique
  const s0 = Math.round(t0 * SR);
  for (let i = 0; i < b.length; i++) {
    const fo = Math.min(1, i / 96, (b.length - 1 - i) / 480);
    const a = ((pans[i] + 1) * Math.PI) / 4, v = b[i] * fo * 0.3;
    BUS.sfx.L[s0 + i] += v * Math.cos(a) * Math.SQRT2; BUS.sfx.R[s0 + i] += v * Math.sin(a) * Math.SQRT2;
  }
}

// 0.6 — Klaxon stylisé du car rapide : deux bips (tierce majeure fa–la).
function horn(dur) {
  const b = len(dur), o1 = new Square(0), o2 = new Square(0.37), bp = new Biquad('bp', 720, 0.9), pk = new Biquad('peak', 2100, 2, 6), hp = new Biquad('hp', 250, 0.7);
  for (let i = 0; i < b.length; i++) {
    const t = i / SR, bend = 1 - 0.03 * Math.exp(-t / 0.02);
    const e = adsr(t, dur - 0.03, 0.008, 0.04, 0.85, 0.03);
    b[i] = softclip(pk.p(bp.p(hp.p(o1.p(mtof(65) * bend) + 0.85 * o2.p(mtof(69) * bend)))) * 1.3, 2) * e;
  }
  return b;
}
place(sfx, 0.6, horn(0.16), { gain: 0.42, pan: 0.45, rev: 0.25, fadeOut: 0.006 });
place(sfx, 0.82, horn(0.26), { gain: 0.46, pan: 0.4, rev: 0.25, fadeOut: 0.006 });

// 1.2–2.2 — Whoosh de chute avec ralenti au sommet (time-remap), hauteur qui descend.
{
  const t0 = 1.2, d = 1.05, b = len(d), nz = noiseGen(), bp = new Biquad('bp', 2500, 0.9), bp2 = new Biquad('bp', 1200, 3);
  let ph = 0, ph2 = 0;
  const pans = new Float32Array(b.length);
  for (let i = 0; i < b.length; i++) {
    const u = i / b.length;
    const w = u + (0.85 * Math.sin(TAU * u)) / TAU;            // dérivée faible au milieu = ralenti
    const fc = 3200 * Math.pow(220 / 3200, w);
    if ((i & 15) === 0) { bp.set('bp', fc, 0.9); bp2.set('bp', fc * 0.6, 4); }
    const spin = 0.7 + 0.3 * Math.sin(TAU * lerp(11, 4, w) * (i / SR));   // rotation du téléphone
    const amp = Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05)), 0.8) * (u > 0.93 ? (1 - u) / 0.07 : 1);
    const ft = 1150 * Math.pow(160 / 1150, w);                 // ton « slow-mo » qui descend
    ph += (TAU * ft) / SR; ph2 += (TAU * ft * 1.5) / SR;
    const tone = (Math.sin(ph) + 0.3 * Math.sin(ph2)) * 0.22 * Math.sin(Math.PI * u);
    const x = nz();
    b[i] = (bp.p(x) * 1.8 + bp2.p(x) * 1.2) * spin * amp + tone * amp;
    pans[i] = lerp(0.35, -0.1, w);
  }
  const s0 = Math.round(t0 * SR);
  for (let i = 0; i < b.length; i++) {
    const fo = Math.min(1, i / 96, (b.length - 1 - i) / 240), a = ((pans[i] + 1) * Math.PI) / 4, v = b[i] * fo * 1.0;
    BUS.sfx.L[s0 + i] += v * Math.cos(a) * Math.SQRT2; BUS.sfx.R[s0 + i] += v * Math.sin(a) * Math.SQRT2;
    BUS.rev.L[s0 + i] += v * 0.35; BUS.rev.R[s0 + i] += v * 0.35;
  }
}

// 2.3 — Impact : thump grave + crack + éclats de verre (fissure) + poussière ; rebonds.
function thump(f0, f1, decay, vel) {
  const b = len(decay * 4.5); let ph = 0;
  for (let i = 0; i < b.length; i++) { const t = i / SR; ph += (TAU * (f1 + (f0 - f1) * Math.exp(-t / 0.03))) / SR; b[i] = softclip(Math.sin(ph) * Math.exp(-t / decay) * 1.3, 1.5) * vel; }
  return b;
}
{
  place(sfx, 2.3, thump(105, 38, 0.17, 1), { gain: 1.15, fadeIn: 0.0008, fadeOut: 0.05 });
  const crack = len(0.12), nz = noiseGen(), hp = new Biquad('hp', 2200, 0.8), pk = new Biquad('peak', 4200, 2, 8);
  for (let i = 0; i < crack.length; i++) { const t = i / SR; crack[i] = pk.p(hp.p(nz())) * (Math.exp(-t / 0.006) + 0.25 * Math.exp(-t / 0.03)) * 1.1; }
  place(sfx, 2.302, crack, { gain: 0.5, pan: 0.05, rev: 0.2, fadeIn: 0.0005 });
  for (let k = 0; k < 7; k++) {                                // éclats de la fissure
    const f = rr(3200, 7800), dd = rr(0.04, 0.12), b = len(dd * 4);
    for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] = Math.sin(TAU * f * t) * Math.exp(-t / dd); }
    place(sfx, 2.305 + rr(0, 0.07), b, { gain: rr(0.03, 0.06), pan: rr(-0.5, 0.5), rev: 0.3 });
  }
  const dust = len(0.6), nz2 = noiseGen(), lp = new Biquad('lp', 900, 0.6), hp2 = new Biquad('hp', 120, 0.6);
  for (let i = 0; i < dust.length; i++) { const t = i / SR; dust[i] = hp2.p(lp.p(nz2())) * Math.min(1, t / 0.01) * Math.exp(-t / 0.14) * 1.5; }
  place(sfx, 2.31, dust, { gain: 0.35, pan: -0.1, rev: 0.2 });
  place(sfx, 2.46, thump(140, 60, 0.05, 0.35), { pan: 0.05, fadeIn: 0.0008 });   // rebond
  place(sfx, 2.55, thump(170, 80, 0.03, 0.14), { pan: 0.08, fadeIn: 0.0008 });
  SC.push([2.3, 0.85]);
}

// 3.0–3.45 — Riser (bruit + ton qui monte + roulement de sabar accélérant), coupure nette.
{
  const d = 0.45;
  place(sfx, 3.0, swell(d, { f0: 500, f1: 9500, q: 1.1, curve: 1.8, vel: 0.55 }), { pan: 0, rev: 0.15, fadeIn: 0.004, fadeOut: 0.003 });
  const tone = len(d), s1 = new Saw(0), s2 = new Saw(0.5), lp = new Biquad('lp', 800, 2);
  for (let i = 0; i < tone.length; i++) {
    const u = i / tone.length, f = mtof(50) * Math.pow(4, u * u);
    if ((i & 15) === 0) lp.set('lp', 600 + 5000 * u * u, 3);
    tone[i] = lp.p(s1.p(f) + s2.p(f * 1.005)) * u * u * 0.32;
  }
  place(sfx, 3.0, tone, { pan: 0, rev: 0.1, fadeOut: 0.003 });
  let t = 3.0, iv = 0.11, k = 0;
  while (t < 3.43) { place(drums, t, sabar(k % 2 ? 'tan' : 'pax', 0.3 + 0.55 * ((t - 3) / 0.45), 1 + (t - 3) * 0.4), { pan: k % 2 ? -0.25 : 0.25, rev: 0.12 }); t += iv; iv = Math.max(0.028, iv * 0.8); k++; }
}

// 3.5–5.1 — Drop : un hit par mot (stab + tom grave + clap), notes du sommet en
// pentatonique ascendante, panoramique alterné.
const WORD_HITS = [3.5, 3.95, 4.4, 4.75, 5.1];
const TOPS = [74, 77, 79, 81, 84];
WORD_HITS.forEach((t, k) => {
  const pan = [0, -0.35, 0.35, -0.25, 0.25][k];
  place(sfx, t, stab([50, 57, 62, 65, TOPS[k] - 12, TOPS[k]], 0.95 + 0.06 * k), { pan, rev: 0.25, dly: 0.12, fadeIn: 0.001 });
  place(drums, t, sabar('gin', 0.8, 0.85), { pan: -pan * 0.5, rev: 0.12 });
  place(drums, t + 0.003, clap(0.55 + 0.05 * k), { pan: pan * 0.6, rev: 0.22 });
  if (k) SC.push([t, 0.45]);
});
place(drums, 3.5, crash(0.42, 0.7, 1.8), { pan: 0.15, rev: 0.25, fadeIn: 0.001, fadeOut: 0.1 });
place(sfx, 3.5, thump(70, 34, 0.32, 0.55), { fadeIn: 0.0008, fadeOut: 0.05 });   // sub-drop

// 5.4–6.2 — Les objets deviennent des épingles sur la carte : petits plinks épars.
[[5.45, 86], [5.58, 81], [5.70, 84], [5.83, 79], [5.95, 86], [6.06, 81]].forEach(([t, m], k) =>
  place(music, t, bell(mtof(m), { dur: 0.5, ratio: 2, index: 0.8, decay: 0.12, vel: 0.13 }), { pan: [-0.6, 0.5, -0.2, 0.7, -0.45, 0.2][k], rev: 0.35, dly: 0.2 }));

// 6.6 — Pop de l'épingle, petit atterrissage, puis swell vers la transition de 7.0.
{
  const b = len(0.12); let ph = 0;
  for (let i = 0; i < b.length; i++) { const t = i / SR, f = 380 + 1250 * (1 - Math.exp(-t / 0.018)); ph += (TAU * f) / SR; b[i] = Math.sin(ph) * Math.exp(-t / 0.035) * 0.9; }
  place(sfx, 6.6, b, { gain: 0.6, rev: 0.25, dly: 0.2 });
  place(sfx, 6.6, clave(0.25, 1800), { rev: 0.1 });
  place(sfx, 6.72, thump(200, 90, 0.04, 0.35), { fadeIn: 0.0008 });             // fekk.land
  place(sfx, 6.62, swell(0.38, { f0: 400, f1: 7000, q: 0.7, curve: 2.4, vel: 0.5 }), { rev: 0.3, fadeIn: 0.01, fadeOut: 0.004 });
  const [L, R] = padChord([60, 65, 69, 74], 0.38, { att: 0.36, rel: 0.06, gain: 0.35 });
  placeStereo(BUS.pad, 6.62, L, R, { rev: 0.4, fadeOut: 0.004 });
}
// 7.0 — Transition : cymbale douce, groove qui reprend (plus lumineux).
place(drums, 7.0, crash(0.32, 0.55, 1.4), { pan: -0.15, rev: 0.3, fadeIn: 0.001, fadeOut: 0.1 });
place(music, 7.0, bell(mtof(77), { dur: 1.2, ratio: 2, index: 1.2, decay: 0.4, vel: 0.18 }), { pan: 0.2, rev: 0.35, dly: 0.25 });

// 7.8–9.3 — Frappe clavier (ticks), puis « tap » sur Publier à 9.3 et validation ✓.
function tick(vel) {
  const b = len(0.03), nz = noiseGen(), hp = new Biquad('hp', 3000, 0.8), f = rr(2600, 3400);
  for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] = (hp.p(nz()) * 0.6 + Math.sin(TAU * f * t) * 0.5) * Math.exp(-t / 0.0035) * vel; }
  return b;
}
place(sfx, 7.82, bell(mtof(84), { dur: 0.3, ratio: 3, index: 0.6, decay: 0.06, vel: 0.22 }), { pan: -0.1, rev: 0.15 });   // puce « Téléphone »
for (const [a, b] of [[7.95, 8.42], [8.5, 8.95], [9.0, 9.22]]) {
  let t = a;
  while (t < b) { place(sfx, t, tick(rr(0.22, 0.34)), { pan: rr(-0.25, 0.25), fadeIn: 0.0005, fadeOut: 0.003 }); t += rr(0.048, 0.085); }
}
{
  place(sfx, 9.3, thump(220, 120, 0.025, 0.55), { fadeIn: 0.0008 });             // doigt
  const b = len(0.35); let ph = 0;                                                // ripple
  for (let i = 0; i < b.length; i++) { const t = i / SR, f = 520 + 380 * (1 - Math.exp(-t / 0.05)); ph += (TAU * f) / SR; b[i] = Math.sin(ph) * Math.min(1, t / 0.004) * Math.exp(-t / 0.09) * 0.5; }
  place(sfx, 9.3, b, { rev: 0.35, dly: 0.1 });
  place(music, 9.46, bell(mtof(84), { dur: 0.8, ratio: 2, index: 1, decay: 0.22, vel: 0.28 }), { pan: 0.15, rev: 0.3 });  // ✓ mint
  place(music, 9.52, bell(mtof(89), { dur: 0.8, ratio: 2, index: 1, decay: 0.22, vel: 0.22 }), { pan: 0.25, rev: 0.3 });
}

// 9.8–12.0 — Pings radar (4 pulses) depuis Colobane, avec écho ping-pong.
[10.0, 10.5, 11.0, 11.5].forEach((t, k) => {
  const p = bell(mtof(86), { dur: 0.8, ratio: 1.0, index: 0.25, decay: 0.19, vel: 0.55, att: 0.003, partial: 0.15 });
  for (let i = 0; i < p.length; i++) p[i] *= 1 - 0.006 * Math.min(1, i / SR / 0.3);
  place(sfx, t, p, { pan: [-0.15, 0.15, -0.3, 0.3][k], rev: 0.35, dly: 0.12 });
  const sw = swell(0.14, { f0: 900, f1: 2200, q: 2, curve: 1.6, vel: 0.12 });
  place(sfx, t - 0.13, sw, { fadeOut: 0.01, rev: 0.2 });
});
[[10.25, 81], [10.62, 79], [10.88, 84], [11.24, 81], [11.62, 86]].forEach(([t, m]) =>      // épingles « trouvé »
  place(music, t, bell(mtof(m), { dur: 0.4, ratio: 2, index: 0.7, decay: 0.09, vel: 0.12 }), { pan: rr(-0.6, 0.6), rev: 0.3 }));

// 12.0 — Notification (deux notes ascendantes sol → do) + buzz de vibration.
{
  const n1 = bell(mtof(79), { dur: 0.9, ratio: 4, index: 1.1, decay: 0.28, idxDecay: 0.05, vel: 0.62, partial: 0.18 });
  const n2 = bell(mtof(84), { dur: 1.2, ratio: 4, index: 1.1, decay: 0.38, idxDecay: 0.05, vel: 0.62, partial: 0.18 });
  place(sfx, 12.0, n1, { pan: -0.08, rev: 0.25, dly: 0.15 });
  place(sfx, 12.11, n2, { pan: 0.08, rev: 0.3, dly: 0.2 });
  for (const [a, d] of [[12.18, 0.22], [12.47, 0.24]]) {
    const b = len(d), sq = new Square(0), lp = new Biquad('lp', 950, 2.5), hp = new Biquad('hp', 90, 0.7), nz = noiseGen();
    for (let i = 0; i < b.length; i++) {
      const t = i / SR, f = 168 * (1 + 0.01 * nz());
      const am = 0.6 + 0.4 * Math.sin(TAU * 31 * t);
      b[i] = hp.p(lp.p(sq.p(f))) * am * adsr(t, d - 0.02, 0.006, 0.02, 0.9, 0.018) * 0.55;
    }
    place(sfx, a, b, { pan: 0, rev: 0.05 });
  }
}

// 13.4 — Arpège ascendant du match (kora + cloche douce), triolets de doubles.
[65, 69, 72, 74, 77, 79, 81, 84, 86, 89].forEach((m, k) => {
  const t = 13.4 + k * (BEAT / 6);
  const pan = lerp(-0.55, 0.55, k / 9);
  kora(t, m, 0.5 + 0.02 * k, { pan, t60: k === 9 ? 2.2 : 1.2, bright: 0.7, dur: k === 9 ? 2.2 : 1.3, rev: 0.25, dly: 0.2 });
  place(music, t, bell(mtof(m + 12), { dur: 0.6, ratio: 2, index: 0.6, decay: 0.15, vel: 0.07 }), { pan, rev: 0.3 });
});
SC.push([13.4, 0.2]);

// 15.0 — Whoosh de sortie (la maquette part en zoom vers le bas).
{
  const d = 0.58, b = len(d), nz = noiseGen(), bp = new Biquad('bp', 400, 1.2);
  let ph = 0; const pans = new Float32Array(b.length);
  for (let i = 0; i < b.length; i++) {
    const u = i / b.length, fc = u < 0.55 ? 350 * Math.pow(18, u / 0.55) : 6300 * Math.pow(0.12, (u - 0.55) / 0.45);
    if ((i & 15) === 0) bp.set('bp', fc, 1.3);
    const amp = u < 0.55 ? Math.pow(u / 0.55, 1.8) : Math.pow(1 - (u - 0.55) / 0.45, 1.4);
    ph += (TAU * lerp(300, 70, u)) / SR;
    b[i] = (bp.p(nz()) * 1.9 + Math.sin(ph) * 0.25 * Math.sin(Math.PI * u)) * amp;
    pans[i] = lerp(-0.6, 0.6, u);
  }
  const s0 = Math.round(14.95 * SR);
  for (let i = 0; i < b.length; i++) {
    const fo = Math.min(1, i / 96, (b.length - 1 - i) / 240), a = ((pans[i] + 1) * Math.PI) / 4, v = b[i] * fo * 0.55;
    BUS.sfx.L[s0 + i] += v * Math.cos(a) * Math.SQRT2; BUS.sfx.R[s0 + i] += v * Math.sin(a) * Math.SQRT2;
    BUS.rev.L[s0 + i] += v * 0.3; BUS.rev.R[s0 + i] += v * 0.3;
  }
}

// 16.6 — « Jërëjëf » : carillon chaleureux égrené + roulement sabar + confettis.
{
  [74, 77, 81, 84].forEach((m, k) =>
    place(music, 16.6 + k * 0.045, bell(mtof(m), { dur: 2.0, ratio: 2.0, index: 1.4, decay: 0.7, idxDecay: 0.2, vel: 0.36 - k * 0.03, partial: 0.1 }), { pan: lerp(-0.4, 0.4, k / 3), rev: 0.45, dly: 0.2 }));
  place(music, 16.6, bell(mtof(62), { dur: 1.6, ratio: 1.0, index: 0.6, decay: 0.5, vel: 0.22 }), { rev: 0.35 });      // corps chaud
  [[16.48, 'pax', 0.5], [16.54, 'tan', 0.55], [16.6, 'gin', 0.8]].forEach(([t, ty, v]) => place(drums, t, sabar(ty, v), { pan: ty === 'pax' ? 0.3 : -0.1, rev: 0.15 }));
  for (let k = 0; k < 9; k++) {
    const m = [86, 89, 91, 93, 96][Math.floor(RNG() * 5)];
    place(music, 16.68 + k * 0.07 + rr(0, 0.03), bell(mtof(m), { dur: 0.35, ratio: 2, index: 0.5, decay: 0.07, vel: rr(0.05, 0.1) }), { pan: rr(-0.8, 0.8), rev: 0.4 });
  }
}

// 17.2–17.8 — Swell (cymbale inversée) + petit roulement, puis accord final au logo.
place(sfx, 17.2, swell(0.6, { f0: 700, f1: 11000, q: 0.6, curve: 2.8, vel: 0.5 }), { pan: 0, rev: 0.3, fadeIn: 0.01, fadeOut: 0.004 });
{ let t = 17.5, k = 0; while (t < 17.76) { place(drums, t, sabar(k % 2 ? 'tan' : 'pax', 0.25 + 0.4 * ((t - 17.5) / 0.26)), { pan: k % 2 ? -0.2 : 0.2, rev: 0.15 }); t += 0.0625 * (1 - k * 0.06); k++; } }
{
  // 17.8 — Fadd9 : grattage kora + cloches + crash doux (le pad et la basse sont plus haut)
  [41, 48, 53, 57, 60, 65, 69, 72, 79].forEach((m, k) => kora(17.8 + k * 0.022, m, 0.42 - k * 0.015, { pan: lerp(-0.5, 0.5, k / 8), t60: 2.6, bright: 0.6, dur: 2.2, rev: 0.4 }));
  [81, 84, 89].forEach((m, k) => place(music, 17.82 + k * 0.05, bell(mtof(m), { dur: 2.2, ratio: 2, index: 1.0, decay: 0.8, idxDecay: 0.25, vel: 0.2 }), { pan: [-0.3, 0.3, 0][k], rev: 0.5, dly: 0.15 }));
  place(drums, 17.8, crash(0.35, 1.0, 2.2), { pan: 0.1, rev: 0.35, fadeIn: 0.001, fadeOut: 0.2 });
}

// ═════════════════════════════════════════════════════════════════════════════
//  TRAITEMENT DES BUS
// ═════════════════════════════════════════════════════════════════════════════
// Pad : passe-bas automatisé + passe-haut.
{
  const fl = [new Biquad('lp', 1000, 0.9), new Biquad('lp', 1000, 0.9)], hl = [new Biquad('hp', 140, 0.7), new Biquad('hp', 140, 0.7)];
  for (let i = 0; i < N; i++) {
    if ((i & 31) === 0) { const fc = padCutoff(i / SR); fl[0].set('lp', fc, 0.9); fl[1].set('lp', fc, 0.9); }
    BUS.pad.L[i] = hl[0].p(fl[0].p(BUS.pad.L[i])); BUS.pad.R[i] = hl[1].p(fl[1].p(BUS.pad.R[i]));
  }
}
// Sidechain (kick → pad, basse, musique, ambiance).
const scEnv = new Float32Array(N);
for (const [t, depth] of SC) {
  const s0 = Math.round(t * SR), pre = Math.round(0.004 * SR), hold = Math.round(0.018 * SR), relTau = 0.085 * SR;
  for (let i = -pre; i < 0.45 * SR; i++) {
    const j = s0 + i; if (j < 0 || j >= N) continue;
    const d = i < 0 ? depth * (1 + i / pre) : i < hold ? depth : depth * Math.exp(-(i - hold) / relTau);
    if (d > scEnv[j]) scEnv[j] = d;
  }
}
const duck = (bus, k) => { for (let i = 0; i < N; i++) { const g = 1 - k * scEnv[i]; bus.L[i] *= g; bus.R[i] *= g; } };
duck(BUS.pad, 0.6); duck(BUS.bass, 0.85); duck(BUS.music, 0.25); duck(BUS.amb, 0.35);
// « Focus » : le groove s'efface de quelques dB sous les cues clés (notification,
// tap, carillon) pour qu'elles se détachent même sur un haut-parleur de téléphone.
const FOCUS = [[9.27, 9.62, -2.5], [11.96, 12.85, -4.5], [16.56, 17.05, -3]];
function focusGain(t) {
  let g = 0;
  for (const [a, b, d] of FOCUS) {
    if (t < a - 0.02 || t > b + 0.15) continue;
    const u = t < a ? smooth((t - (a - 0.02)) / 0.02) : t > b ? 1 - smooth((t - b) / 0.15) : 1;
    g = Math.min(g, d * u);
  }
  return db(g);
}
for (const k of ['drums', 'bass', 'pad']) { const bus = BUS[k]; for (let i = 0; i < N; i++) { const g = focusGain(i / SR); bus.L[i] *= g; bus.R[i] *= g; } }
// Saturation douce des bus drums et basse.
for (let i = 0; i < N; i++) {
  BUS.drums.L[i] = softclip(BUS.drums.L[i] * 1.1, 1.3) / 1.1; BUS.drums.R[i] = softclip(BUS.drums.R[i] * 1.1, 1.3) / 1.1;
  BUS.bass.L[i] = softclip(BUS.bass.L[i], 1.5); BUS.bass.R[i] = softclip(BUS.bass.R[i], 1.5);
}

// ── Réverb Freeverb (8 combs + 4 allpass par canal, étalement stéréo) ───────
function freeverb(inL, inR, { room = 0.82, damp = 0.35, width = 1, predelay = 0.02 } = {}) {
  const sc = SR / 44100;
  const combT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], apT = [556, 441, 341, 225], spread = 23;
  const fb = room * 0.28 + 0.7, d1 = damp * 0.4, d2 = 1 - d1;
  const mk = (off) => ({
    c: combT.map((l) => ({ b: new Float32Array(Math.round((l + off) * sc)), i: 0, s: 0 })),
    a: apT.map((l) => ({ b: new Float32Array(Math.round((l + off) * sc)), i: 0 })),
  });
  const ch = [mk(0), mk(spread)];
  const pd = Math.round(predelay * SR);
  const hp = [new Biquad('hp', 220, 0.7), new Biquad('hp', 220, 0.7)], lp = [new Biquad('lp', 7000, 0.7), new Biquad('lp', 7000, 0.7)];
  const oL = new Float32Array(N), oR = new Float32Array(N);
  for (let n = 0; n < N; n++) {
    const xl = n >= pd ? inL[n - pd] : 0, xr = n >= pd ? inR[n - pd] : 0;
    const x = (hp[0].p(lp[0].p(xl)) + hp[1].p(lp[1].p(xr))) * 0.015;
    const outs = [0, 0];
    for (let k = 0; k < 2; k++) {
      let acc = 0;
      for (const c of ch[k].c) { const y = c.b[c.i]; c.s = y * d2 + c.s * d1; c.b[c.i] = x + c.s * fb; if (++c.i >= c.b.length) c.i = 0; acc += y; }
      for (const a of ch[k].a) { const y = a.b[a.i]; const o = -acc + y; a.b[a.i] = acc + y * 0.5; if (++a.i >= a.b.length) a.i = 0; acc = o; }
      outs[k] = acc;
    }
    const w1 = width / 2 + 0.5, w2 = (1 - width) / 2;
    oL[n] = outs[0] * w1 + outs[1] * w2; oR[n] = outs[1] * w1 + outs[0] * w2;
  }
  return [oL, oR];
}
// ── Delay ping-pong (croche pointée = 0.375 s), passe-bas dans la boucle ─────
function pingpong(inL, inR, { time = 0.375, fb = 0.38 } = {}) {
  const D = Math.round(time * SR), bl = new Float32Array(N), br = new Float32Array(N);
  const lpL = new Biquad('lp', 3800, 0.7), lpR = new Biquad('lp', 3800, 0.7), hp = new Biquad('hp', 300, 0.7);
  for (let n = 0; n < N; n++) {
    const dl = n >= D ? bl[n - D] : 0, dr = n >= D ? br[n - D] : 0;
    bl[n] = hp.p((inL[n] + inR[n]) * 0.5) + lpR.p(dr) * fb;  // entrée mono à gauche, rebonds croisés
    br[n] = lpL.p(dl);
  }
  const oL = new Float32Array(N), oR = new Float32Array(N);
  for (let n = 0; n < N; n++) { oL[n] = n >= D ? bl[n - D] : 0; oR[n] = n >= D ? br[n - D] : 0; }
  return [oL, oR];
}
// Le delay nourrit aussi un peu la réverb.
const [dL, dR] = pingpong(BUS.dly.L, BUS.dly.R);
for (let i = 0; i < N; i++) { BUS.rev.L[i] += dL[i] * 0.3; BUS.rev.R[i] += dR[i] * 0.3; }
const [rL, rR] = freeverb(BUS.rev.L, BUS.rev.R, { room: 0.84, damp: 0.4 });

// ═════════════════════════════════════════════════════════════════════════════
//  MASTER
// ═════════════════════════════════════════════════════════════════════════════
const MIX = { drums: 0.62, bass: 0.45, pad: 0.42, music: 0.55, sfx: 0.7, amb: 0.22, rev: 2.6, dly: 0.42 };
// Les retours réverb/delay se taisent aussi pendant la coupure et ne reviennent
// qu'en fondu après le drop (la queue du riser ne « ressuscite » pas à 3.5).
const fxGate = (t) => (t < 3.447 ? 1 : t < 3.45 ? 1 - (t - 3.447) / 0.003 : t < 3.5 ? 0 : t < 3.62 ? smooth((t - 3.5) / 0.12) : 1);
for (let i = Math.round(3.4 * SR); i < Math.round(3.7 * SR); i++) { const g = fxGate(i / SR); rL[i] *= g; rR[i] *= g; dL[i] *= g; dR[i] *= g; }
let mL = new Float32Array(N), mR = new Float32Array(N);
for (let i = 0; i < N; i++) {
  mL[i] = BUS.drums.L[i] * MIX.drums + BUS.bass.L[i] * MIX.bass + BUS.pad.L[i] * MIX.pad + BUS.music.L[i] * MIX.music + BUS.sfx.L[i] * MIX.sfx + BUS.amb.L[i] * MIX.amb + rL[i] * MIX.rev + dL[i] * MIX.dly;
  mR[i] = BUS.drums.R[i] * MIX.drums + BUS.bass.R[i] * MIX.bass + BUS.pad.R[i] * MIX.pad + BUS.music.R[i] * MIX.music + BUS.sfx.R[i] * MIX.sfx + BUS.amb.R[i] * MIX.amb + rR[i] * MIX.rev + dR[i] * MIX.dly;
}

// Coupure nette 3.45 → 3.5 (silence de 45 ms avant le drop) + fin propre 19.1 → 20.
function masterGain(t) {
  let g = t < 0.002 ? t / 0.002 : 1;
  if (t >= 3.447 && t < 3.5) g = t < 3.450 ? 1 - (t - 3.447) / 0.003 : t >= 3.497 ? (t - 3.497) / 0.003 : 0;
  if (t > 19.1) g *= 0.5 + 0.5 * Math.cos(Math.PI * clamp((t - 19.1) / 0.9, 0, 1));
  return g;
}
{
  const hp = [new Biquad('hp', 30, 0.7), new Biquad('hp', 30, 0.7)], air = [new Biquad('hs', 7500, 0.7, 2), new Biquad('hs', 7500, 0.7, 2)];
  const lo = [new Biquad('ls', 90, 0.7, -1.5), new Biquad('ls', 90, 0.7, -1.5)];
  for (let i = 0; i < N; i++) { const g = masterGain(i / SR); mL[i] = air[0].p(lo[0].p(hp[0].p(mL[i]))) * g; mR[i] = air[1].p(lo[1].p(hp[1].p(mR[i]))) * g; }
}

// ── Mesure de sonie BS.1770-4 (pondération K, blocs 400 ms, double portillon) ─
function kweight(x) {
  const y = new Float64Array(x.length);
  const s1 = { b: [1.53512485958697, -2.69169618940638, 1.19839281085285], a: [-1.69065929318241, 0.73248077421585] };
  const s2 = { b: [1, -2, 1], a: [-1.99004745483398, 0.99007225036621] };
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0, u1 = 0, u2 = 0, z1 = 0, z2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = x[i];
    const a = s1.b[0] * v + s1.b[1] * x1 + s1.b[2] * x2 - s1.a[0] * y1 - s1.a[1] * y2; x2 = x1; x1 = v; y2 = y1; y1 = a;
    const b = s2.b[0] * a + s2.b[1] * u1 + s2.b[2] * u2 - s2.a[0] * z1 - s2.a[1] * z2; u2 = u1; u1 = a; z2 = z1; z1 = b;
    y[i] = b;
  }
  return y;
}
function lufs(L, R) {
  const kl = kweight(L), kr = kweight(R), blk = Math.round(0.4 * SR), hop = Math.round(0.1 * SR);
  const pw = [];
  for (let s = 0; s + blk <= L.length; s += hop) {
    let a = 0; for (let i = s; i < s + blk; i++) a += kl[i] * kl[i] + kr[i] * kr[i];
    pw.push(a / blk);
  }
  const L_ = (z) => -0.691 + 10 * Math.log10(z);
  const g1 = pw.filter((z) => L_(z) > -70);
  const rel = L_(g1.reduce((a, b) => a + b, 0) / g1.length) - 10;
  const g2 = g1.filter((z) => L_(z) > rel);
  return L_(g2.reduce((a, b) => a + b, 0) / g2.length);
}
// True-peak : suréchantillonnage ×4 (sinc fenêtré, 32 coefficients par phase).
const TP_TAPS = 16;
const TP_H = [1, 2, 3].map((p) => { const h = []; for (let k = -TP_TAPS + 1; k <= TP_TAPS; k++) { const x = k - p / 4, w = 0.5 + 0.5 * Math.cos((Math.PI * x) / (TP_TAPS + 1)); h.push((x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x)) * w); } return h; });
function truePeak(x) {
  let m = 0;
  for (let n = 0; n < x.length; n++) {
    const a = Math.abs(x[n]); if (a > m) m = a;
    if (n < TP_TAPS || n + TP_TAPS >= x.length) continue;
    for (const h of TP_H) { let s = 0; for (let k = 0; k < h.length; k++) s += x[n + k - TP_TAPS + 1] * h[k]; const v = Math.abs(s); if (v > m) m = v; }
  }
  return m;
}

// ── Compresseur de bus (stéréo lié, genou doux) ─────────────────────────────
function compress(L, R, { thr = -18, ratio = 2.5, knee = 6, att = 0.01, rel = 0.15, makeup = 0 } = {}) {
  const aA = Math.exp(-1 / (att * SR)), aR = Math.exp(-1 / (rel * SR));
  let gr = 0, maxGr = 0;
  for (let i = 0; i < L.length; i++) {
    const lvl = 20 * Math.log10(Math.max(Math.abs(L[i]), Math.abs(R[i])) + 1e-9);
    const over = lvl - thr;
    let tgt = 0;
    if (over > knee / 2) tgt = over * (1 - 1 / ratio);
    else if (over > -knee / 2) tgt = ((over + knee / 2) ** 2 / (2 * knee)) * (1 - 1 / ratio);
    gr = tgt > gr ? aA * gr + (1 - aA) * tgt : aR * gr + (1 - aR) * tgt;
    if (gr > maxGr) maxGr = gr;
    const g = db(makeup - gr);
    L[i] *= g; R[i] *= g;
  }
  return maxGr;
}
// ── Limiteur à anticipation (gain toujours ≤ requis, sans retard audio) ─────
function limit(L, R, ceil) {
  const n = L.length, W = Math.round(0.003 * SR), relC = 1 - Math.exp(-1 / (0.08 * SR));
  const gr = new Float32Array(n);
  for (let i = 0; i < n; i++) { const p = Math.max(Math.abs(L[i]), Math.abs(R[i])); gr[i] = p > ceil ? ceil / p : 1; }
  // minimum glissant sur [i, i+W] (deque)
  const A = new Float32Array(n), dq = new Int32Array(n); let h = 0, t = 0;
  for (let j = n - 1; j >= 0; j--) {
    while (t > h && gr[dq[t - 1]] >= gr[j]) t--;
    dq[t++] = j;
    while (dq[h] > j + W) h++;
    A[j] = gr[dq[h]];
  }
  const B = new Float32Array(n); let b = 1;
  for (let i = 0; i < n; i++) { b = Math.min(A[i], b + (1 - b) * relC); B[i] = b; }
  let acc = 0, minG = 1;
  for (let i = 0; i < n; i++) {
    acc += B[i]; if (i > W) acc -= B[i - W - 1];
    const g = acc / Math.min(i + 1, W + 1);
    if (g < minG) minG = g;
    L[i] *= g; R[i] *= g;
  }
  return minG;
}

// 1) pré-normalisation à -20 LUFS, compresseur de bus, saturation douce
const preLufs = lufs(mL, mR);
{
  const g = db(-20 - preLufs);
  for (let i = 0; i < N; i++) { mL[i] *= g; mR[i] *= g; }
}
const compGR = compress(mL, mR, { thr: -17, ratio: 2.2, knee: 8, att: 0.012, rel: 0.16 });
for (let i = 0; i < N; i++) { mL[i] = softclip(mL[i] * 1.0, 1.15); mR[i] = softclip(mR[i], 1.15); }

// 2) gain + limiteur, itéré jusqu'à -14 LUFS intégré et true-peak < TP_CEIL
let gain = db(TARGET_LUFS - lufs(mL, mR)), ceil = db(TP_CEIL - 0.6), oL, oR, measured, tp, limMin;
for (let it = 0; it < 12; it++) {
  oL = Float32Array.from(mL, (v) => v * gain); oR = Float32Array.from(mR, (v) => v * gain);
  limMin = limit(oL, oR, ceil);
  // sécurité finale : fin à zéro absolu
  measured = lufs(oL, oR);
  tp = 20 * Math.log10(Math.max(truePeak(oL), truePeak(oR)));
  const okL = Math.abs(measured - TARGET_LUFS) < 0.1, okP = tp < TP_CEIL + 0.05;
  if (okL && okP) break;
  if (!okP) ceil *= db(TP_CEIL - tp - 0.05);
  gain *= db(TARGET_LUFS - measured);
}

// 3) dither TPDF + écriture WAV PCM 16 bits
const dR_ = mulberry32(0xd17e);
const pcm = Buffer.alloc(44 + N * 4);
pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + N * 4, 4); pcm.write('WAVE', 8);
pcm.write('fmt ', 12); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(2, 22);
pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 4, 28); pcm.writeUInt16LE(4, 32); pcm.writeUInt16LE(16, 34);
pcm.write('data', 36); pcm.writeUInt32LE(N * 4, 40);
let clipped = 0;
for (let i = 0; i < N; i++) {
  const tail = i >= N - Math.round(0.01 * SR);   // 10 derniers ms : silence numérique
  for (let c = 0; c < 2; c++) {
    const v = (c ? oR : oL)[i] * 32767 + (tail ? 0 : dR_() - dR_());
    let q = tail ? 0 : Math.round(v);
    if (q > 32767) { q = 32767; clipped++; } if (q < -32768) { q = -32768; clipped++; }
    pcm.writeInt16LE(q, 44 + i * 4 + c * 2);
  }
}
writeFileSync(OUT, pcm);

// --stems : écrit chaque bus (niveau de mix, gain master appliqué, sans limiteur)
// dans out/audio-tmp/ pour l'analyse. Aucun autre fichier n'est écrit sinon.
if (process.argv.includes('--stems')) {
  const { mkdirSync } = await import('node:fs');
  const dir = join(HERE, '..', 'out', 'audio-tmp');
  mkdirSync(dir, { recursive: true });
  const g0 = gain * db(-20 - preLufs);
  for (const k of ['drums', 'bass', 'pad', 'music', 'sfx', 'amb']) {
    const buf = Buffer.alloc(44 + N * 4); pcm.copy(buf, 0, 0, 44);
    for (let i = 0; i < N; i++) for (let c = 0; c < 2; c++) {
      const v = clamp((c ? BUS[k].R : BUS[k].L)[i] * MIX[k] * g0, -1, 1);
      buf.writeInt16LE(Math.round(v * 32767), 44 + i * 4 + c * 2);
    }
    writeFileSync(join(dir, `stem-${k}.wav`), buf);
  }
}

const busLufs = Object.fromEntries(['drums', 'bass', 'pad', 'music', 'sfx', 'amb'].map((k) => [k, +(lufs(BUS[k].L.map((v) => v * MIX[k]), BUS[k].R.map((v) => v * MIX[k]))).toFixed(1)]));
console.log(`✔ ${OUT}`);
console.log(`  ${DUR}s · ${SR} Hz · stéréo · 16 bits`);
console.log(`  intégré ${measured.toFixed(2)} LUFS · true-peak ${tp.toFixed(2)} dBTP · comp max GR ${compGR.toFixed(1)} dB · limiteur min ${(20 * Math.log10(limMin)).toFixed(1)} dB · échantillons écrêtés ${clipped}`);
console.log('  sonie relative des bus (avant master) :', busLufs);
