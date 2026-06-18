#!/usr/bin/env node
/**
 * generate-audio.mjs — Procedural WAV audio generator for Shell-Hero
 *
 * Generates proper BGM tracks (60s each) and all 13 SFX files to replace
 * the 0.1-second placeholder tones.
 *
 * Pure Node.js, zero dependencies.
 *
 * Usage:  node scripts/generate-audio.mjs
 * Output: public/assets/audio/*.wav
 */

import fs from "fs"
import path from "path"

const SAMPLE_RATE = 44100
const AUDIO_DIR = path.resolve("public/assets/audio")
const TAU = Math.PI * 2

// ─── WAV Writer ───────────────────────────────────────────────

function writeWAV(filename, samples) {
  const numChannels = 1
  const bitsPerSample = 16
  const byteRate = SAMPLE_RATE * numChannels * (bitsPerSample / 8)
  const blockAlign = numChannels * (bitsPerSample / 8)
  const dataSize = samples.length * blockAlign
  const buf = Buffer.alloc(44 + dataSize)

  // RIFF header
  buf.write("RIFF", 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write("WAVE", 8)

  // fmt chunk
  buf.write("fmt ", 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20) // PCM
  buf.writeUInt16LE(numChannels, 22)
  buf.writeUInt32LE(SAMPLE_RATE, 24)
  buf.writeUInt32LE(byteRate, 28)
  buf.writeUInt16LE(blockAlign, 32)
  buf.writeUInt16LE(bitsPerSample, 34)

  // data chunk
  buf.write("data", 36)
  buf.writeUInt32LE(dataSize, 40)

  for (let i = 0; i < samples.length; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]))
    s = s < 0 ? s * 0x8000 : s * 0x7fff
    buf.writeInt16LE(Math.round(s), 44 + i * 2)
  }

  const fp = path.join(AUDIO_DIR, filename)
  fs.writeFileSync(fp, buf)
  const secs = (samples.length / SAMPLE_RATE).toFixed(1)
  console.log(`  ✓ ${filename}  (${secs}s, ${buf.length} bytes)`)
}

// ─── Audio Primitives ─────────────────────────────────────────

/** Sine wave oscillator */
function sine(freq, t) {
  return Math.sin(TAU * freq * t)
}

/** Square wave oscillator */
function square(freq, t, pulseWidth = 0.5) {
  return Math.sin(TAU * freq * t) >= 0 ? pulseWidth : -pulseWidth
}

/** Sawtooth wave oscillator */
function saw(freq, t) {
  return 2 * ((freq * t) % 1) - 1
}

/** White noise */
function noise() {
  return Math.random() * 2 - 1
}

/** Linear ADSR envelope */
function envelope(t, attack, decay, sustain, sustainLevel, release, dur) {
  const relStart = dur - release
  if (t < 0) return 0
  if (t < attack) return t / attack
  if (t < attack + decay) return 1 - (1 - sustainLevel) * ((t - attack) / decay)
  if (t < relStart) return sustainLevel
  if (t < dur) return sustainLevel * (1 - (t - relStart) / release)
  return 0
}

/** Generate a silent buffer of given duration (seconds) */
function silent(dur) {
  return new Float32Array(Math.floor(SAMPLE_RATE * dur))
}

/** Mix multiple Float32Array buffers together (in-place on target) */
function mix(target, ...sources) {
  for (const src of sources) {
    for (let i = 0; i < Math.min(target.length, src.length); i++) {
      target[i] = (target[i] || 0) + src[i]
    }
  }
  // Normalize
  let max = 0
  for (let i = 0; i < target.length; i++) {
    const abs = Math.abs(target[i])
    if (abs > max) max = abs
  }
  if (max > 1) {
    for (let i = 0; i < target.length; i++) target[i] /= max
  }
  return target
}

// ─── Music Generators ─────────────────────────────────────────

/**
 * Generate a chord pad layer
 * @param {number[]} freqs - chord frequencies
 * @param {number} dur - total duration in seconds
 * @param {number} bpm - beats per minute
 * @param {number[]} chordTimes - when each chord starts (in beats)
 * @param {number} beatsPerChord - beats per chord change
 */
function chordPad(freqs, dur, bpm, chordPattern, beatsPerChord) {
  const totalSamples = Math.floor(SAMPLE_RATE * dur)
  const buf = new Float32Array(totalSamples)
  const beatLen = 60 / bpm
  const samplesPerBeat = Math.floor(SAMPLE_RATE * beatLen)

  // Build chord progression: array of [startSample, freqSet]
  const chords = chordPattern.map((chordFreqs, idx) => ({
    start: idx * samplesPerBeat * beatsPerChord,
    freqs: chordFreqs,
  }))

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE

    // Find active chord
    let active = chords[0]
    for (let c = chords.length - 1; c >= 0; c--) {
      if (i >= chords[c].start) { active = chords[c]; break }
    }

    const env = envelope(t, 0.5, 0.3, 0.7, 0.7, 1.0, dur)
    for (const f of active.freqs) {
      // Soft sine with slight detune for warmth
      buf[i] += sine(f, t) * 0.15
      buf[i] += sine(f * 1.005, t) * 0.05
    }
    buf[i] *= env
  }
  return buf
}

/**
 * Generate a bass line
 */
function bassLine(dur, bpm, chordPattern, beatsPerChord, rootFreqs) {
  const totalSamples = Math.floor(SAMPLE_RATE * dur)
  const buf = new Float32Array(totalSamples)
  const beatLen = 60 / bpm
  const samplesPerBeat = Math.floor(SAMPLE_RATE * beatLen)

  const chords = chordPattern.map((_, idx) => ({
    start: idx * samplesPerBeat * beatsPerChord,
    freq: rootFreqs[idx],
  }))

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE
    let active = chords[0]
    for (let c = chords.length - 1; c >= 0; c--) {
      if (i >= chords[c].start) { active = chords[c]; break }
    }
    const env = envelope(t, 0.05, 0.05, 0.8, 0.8, 0.3, dur)
    const beatPhase = (i % samplesPerBeat) / samplesPerBeat
    const pulse = beatPhase < 0.5 ? 1 : 0.6
    buf[i] = saw(active.freq, t) * 0.2 * env * pulse
  }
  return buf
}

/**
 * Generate arpeggio pattern
 */
function arpeggio(dur, bpm, chordPattern, beatsPerChord) {
  const totalSamples = Math.floor(SAMPLE_RATE * dur)
  const buf = new Float32Array(totalSamples)
  const beatLen = 60 / bpm
  const samplesPerBeat = Math.floor(SAMPLE_RATE * beatLen)

  const chords = chordPattern.map((freqs, idx) => ({
    start: idx * samplesPerBeat * beatsPerChord,
    freqs,
  }))

  const noteLen = samplesPerBeat / 4 // 16th notes

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE
    let active = chords[0]
    for (let c = chords.length - 1; c >= 0; c--) {
      if (i >= chords[c].start) { active = chords[c]; break }
    }
    const localBeat = (i - active.start) / samplesPerBeat
    const noteIdx = Math.floor(localBeat * 4) % active.freqs.length
    const notePos = (i - active.start) % noteLen
    const env = envelope(notePos / SAMPLE_RATE, 0.01, 0.05, 0.3, 0.3, 0.1, noteLen / SAMPLE_RATE)
    buf[i] = sine(active.freqs[noteIdx] * 2, t) * 0.08 * env
  }
  return buf
}

/**
 * Generate percussion (noise bursts on beats)
 */
function percussion(dur, bpm, beatsPerChord, pattern) {
  const totalSamples = Math.floor(SAMPLE_RATE * dur)
  const buf = new Float32Array(totalSamples)
  const beatLen = 60 / bpm
  const samplesPerBeat = Math.floor(SAMPLE_RATE * beatLen)

  // pattern: which 16th notes get hits, e.g. [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0] = kick on quarter
  const totalBeats = Math.floor(dur / beatLen)
  for (let beat = 0; beat < totalBeats; beat++) {
    for (let sub = 0; sub < 16; sub++) {
      if (!pattern[sub % pattern.length]) continue
      const startSample = beat * samplesPerBeat + Math.floor(sub / 16 * samplesPerBeat * 4)
      if (startSample >= totalSamples) break
      for (let j = 0; j < Math.min(samplesPerBeat / 4, totalSamples - startSample); j++) {
        const t = j / SAMPLE_RATE
        // Kick: low sine thump + noise
        if (sub % 4 === 0) {
          buf[startSample + j] += sine(80 - j * 2, t) * 0.3 * Math.exp(-t * 30)
          buf[startSample + j] += noise() * 0.05 * Math.exp(-t * 20)
        }
        // Snare/clap: noise burst
        if (sub % 4 === 2) {
          buf[startSample + j] += noise() * 0.15 * Math.exp(-t * 25)
          buf[startSample + j] += sine(200, t) * 0.05 * Math.exp(-t * 40)
        }
        // Hi-hat: short noise
        if (sub % 2 === 1) {
          buf[startSample + j] += noise() * 0.04 * Math.exp(-t * 60)
        }
      }
    }
  }
  return buf
}

// ─── Chord Definitions ────────────────────────────────────────

// Frequency helpers
const C3 = 130.81, D3 = 146.83, E3 = 164.81, F3 = 174.61, G3 = 196.00, A3 = 220.00, Bb3 = 233.08, B3 = 246.94
const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00, Bb4 = 466.16, B4 = 493.88
const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99, A5 = 880.00

// Menu BGM: Cmaj7 → Fmaj7 → Am7 → G (I7 → IV7 → vi7 → V)
const MENU_CHORDS = [
  [C4, E4, G4, B4],      // Cmaj7
  [F4, A4, C5, E5],      // Fmaj7
  [A3, C4, E4, G4],      // Am7
  [G3, B3, D4, F4],      // G7
]

const MENU_ROOTS = [C3, F3, A3, G3]

// Game BGM: Dm → Bb → F → C (i → VI → III → VII) — driving progression
const GAME_CHORDS = [
  [D4, F4, A4, D5],      // Dm
  [Bb3, D4, F4, Bb4],    // Bb
  [F4, A4, C5, F5],      // F
  [C4, E4, G4, C5],      // C
]

const GAME_ROOTS = [D3, Bb3, F3, C3]

// ─── Generate BGM Tracks ──────────────────────────────────────

function generateMenuBGM() {
  const dur = 60
  const bpm = 80
  const beatsPerChord = 4  // 4 beats per chord
  const repeats = Math.ceil(dur / ((60 / bpm) * beatsPerChord * MENU_CHORDS.length))
  const pattern = []
  const roots = []
  for (let r = 0; r < repeats; r++) {
    for (const ch of MENU_CHORDS) pattern.push(ch)
    for (const rt of MENU_ROOTS) roots.push(rt)
  }

  console.log("  Generating bgm_menu...")
  const buf = silent(dur)
  mix(buf,
    chordPad(pattern, dur, bpm, pattern, beatsPerChord),
    bassLine(dur, bpm, pattern, beatsPerChord, roots),
    arpeggio(dur, bpm, pattern, beatsPerChord),
  )
  return buf
}

function generateGameBGM() {
  const dur = 60
  const bpm = 120
  const beatsPerChord = 4
  const repeats = Math.ceil(dur / ((60 / bpm) * beatsPerChord * GAME_CHORDS.length))
  const pattern = []
  const roots = []
  for (let r = 0; r < repeats; r++) {
    for (const ch of GAME_CHORDS) pattern.push(ch)
    for (const rt of GAME_ROOTS) roots.push(rt)
  }

  console.log("  Generating bgm_game...")
  const buf = silent(dur)
  mix(buf,
    chordPad(pattern, dur, bpm, pattern, beatsPerChord),
    bassLine(dur, bpm, pattern, beatsPerChord, roots),
    arpeggio(dur, bpm, pattern, beatsPerChord),
  )
  return buf
}

// ─── SFX Generators ───────────────────────────────────────────

function sfxShoot() {
  const dur = 0.12
  const buf = silent(dur)
  for (let i = 0; i < buf.length; i++) {
    const t = i / SAMPLE_RATE
    const env = Math.exp(-t * 30)
    buf[i] = noise() * 0.3 * env + sine(800 + t * 4000, t) * 0.3 * env
  }
  return buf
}

function sfxHitEnemy() {
  const dur = 0.15
  const buf = silent(dur)
  for (let i = 0; i < buf.length; i++) {
    const t = i / SAMPLE_RATE
    const env = Math.exp(-t * 20)
    buf[i] = noise() * 0.2 * env + sine(200 - t * 400, t) * 0.25 * env
  }
  return buf
}

function sfxKillEnemy() {
  const dur = 0.3
  const buf = silent(dur)
  for (let i = 0; i < buf.length; i++) {
    const t = i / SAMPLE_RATE
    const env = Math.exp(-t * 10)
    buf[i] = noise() * 0.3 * env + sine(300, t) * 0.2 * env + sine(600, t) * 0.15 * env
  }
  return buf
}

function sfxPlayerHurt() {
  const dur = 0.3
  const buf = silent(dur)
  for (let i = 0; i < buf.length; i++) {
    const t = i / SAMPLE_RATE
    const env = Math.exp(-t * 12)
    buf[i] = sine(180 - t * 60, t) * 0.35 * env + noise() * 0.1 * env
  }
  return buf
}

function sfxPlayerDodge() {
  const dur = 0.2
  const buf = silent(dur)
  for (let i = 0; i < buf.length; i++) {
    const t = i / SAMPLE_RATE
    const env = Math.exp(-t * 15)
    buf[i] = sine(300 + t * 2000, t) * 0.2 * env + noise() * 0.15 * env
  }
  return buf
}

function sfxLevelUp() {
  const dur = 0.5
  const buf = silent(dur)
  const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
  for (let i = 0; i < buf.length; i++) {
    const t = i / SAMPLE_RATE
    const noteIdx = Math.min(Math.floor(t / (dur / notes.length)), notes.length - 1)
    const noteT = t - noteIdx * (dur / notes.length)
    const env = Math.exp(-noteT * 6)
    buf[i] = sine(notes[noteIdx], t) * 0.25 * env + sine(notes[noteIdx] * 2, t) * 0.08 * env
  }
  return buf
}

function sfxWaveStart() {
  const dur = 0.4
  const buf = silent(dur)
  for (let i = 0; i < buf.length; i++) {
    const t = i / SAMPLE_RATE
    const env = Math.exp(-t * 8)
    buf[i] = sine(440 + t * 800, t) * 0.3 * env + sine(880 + t * 1600, t) * 0.15 * env
  }
  return buf
}

function sfxWaveClear() {
  const dur = 0.5
  const buf = silent(dur)
  for (let i = 0; i < buf.length; i++) {
    const t = i / SAMPLE_RATE
    const env = t < 0.1 ? t / 0.1 : Math.exp(-(t - 0.1) * 3)
    const freq = 600 - t * 400
    buf[i] = sine(freq, t) * 0.25 * env + sine(freq * 1.5, t) * 0.1 * env
  }
  return buf
}

function sfxBossAppear() {
  const dur = 1.0
  const buf = silent(dur)
  for (let i = 0; i < buf.length; i++) {
    const t = i / SAMPLE_RATE
    const env = t < 0.05 ? t / 0.05 : Math.exp(-(t - 0.05) * 2.5)
    buf[i] = sine(100 + t * 50, t) * 0.3 * env
    buf[i] += sine(200 + t * 100, t) * 0.15 * env
    buf[i] += noise() * 0.08 * env
  }
  return buf
}

function sfxBossPhase() {
  const dur = 0.6
  const buf = silent(dur)
  for (let i = 0; i < buf.length; i++) {
    const t = i / SAMPLE_RATE
    const env = Math.exp(-t * 4)
    buf[i] = sine(400 + t * 1200, t) * 0.25 * env + sine(500 + t * 1500, t) * 0.15 * env
  }
  return buf
}

function sfxBossDeath() {
  const dur = 1.2
  const buf = silent(dur)
  for (let i = 0; i < buf.length; i++) {
    const t = i / SAMPLE_RATE
    const env = Math.exp(-t * 2.5)
    const freq = 400 - t * 250
    buf[i] = sine(Math.max(50, freq), t) * 0.3 * env
    buf[i] += saw(Math.max(50, freq * 0.5), t) * 0.15 * env
    buf[i] += noise() * 0.1 * env
  }
  return buf
}

function sfxGameOver() {
  const dur = 1.0
  const buf = silent(dur)
  const notes = [392, 349, 330, 262] // G4, F4, E4, C4
  for (let i = 0; i < buf.length; i++) {
    const t = i / SAMPLE_RATE
    const noteIdx = Math.min(Math.floor(t / (dur / notes.length)), notes.length - 1)
    const env = Math.exp(-t * 2)
    buf[i] = sine(notes[noteIdx], t) * 0.25 * env
  }
  return buf
}

function sfxUiClick() {
  const dur = 0.06
  const buf = silent(dur)
  for (let i = 0; i < buf.length; i++) {
    const t = i / SAMPLE_RATE
    const env = Math.exp(-t * 120)
    buf[i] = sine(1200, t) * 0.2 * env + noise() * 0.1 * env
  }
  return buf
}

// ─── Ensure output directory exists ───────────────────────────

if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true })
}

// ─── Generate All Audio ───────────────────────────────────────

console.log("")
console.log("╔══════════════════════════════════════════╗")
console.log("║  Shell-Hero Audio Generator              ║")
console.log("╚══════════════════════════════════════════╝")
console.log("")

console.log("▶ BGM tracks:")
writeWAV("bgm_menu.wav", generateMenuBGM())
writeWAV("bgm_game.wav", generateGameBGM())

console.log("")
console.log("▶ SFX:")
writeWAV("shoot.wav", sfxShoot())
writeWAV("hit_enemy.wav", sfxHitEnemy())
writeWAV("kill_enemy.wav", sfxKillEnemy())
writeWAV("player_hurt.wav", sfxPlayerHurt())
writeWAV("player_dodge.wav", sfxPlayerDodge())
writeWAV("level_up.wav", sfxLevelUp())
writeWAV("wave_start.wav", sfxWaveStart())
writeWAV("wave_clear.wav", sfxWaveClear())
writeWAV("boss_appear.wav", sfxBossAppear())
writeWAV("boss_phase.wav", sfxBossPhase())
writeWAV("boss_death.wav", sfxBossDeath())
writeWAV("game_over.wav", sfxGameOver())
writeWAV("ui_click.wav", sfxUiClick())

console.log("")
console.log("✅ All audio files generated successfully!")
console.log(`   Output: ${AUDIO_DIR}`)
console.log("")
