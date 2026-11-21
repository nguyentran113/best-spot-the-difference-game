// Twin Peeks — synthesized sound effects. Every sound is built with the
// Web Audio API (oscillators and a noise buffer); no audio files are loaded.

let audioContext = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMuted() {
  muted = !muted;
  return muted;
}

// AudioContext must start from a user gesture; call this on the first click.
export function ensureAudio() {
  if (!audioContext) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (Ctor) audioContext = new Ctor();
  }
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

function tone(freq, startAt, length, type, volume) {
  const ctx = ensureAudio();
  if (!ctx || muted) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + startAt);
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startAt + length);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + startAt);
  osc.stop(ctx.currentTime + startAt + length + 0.05);
}

function noiseBurst(startAt, length, volume) {
  const ctx = ensureAudio();
  if (!ctx || muted) return;
  const size = Math.floor(ctx.sampleRate * length);
  const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / size);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(ctx.currentTime + startAt);
}

export function playUiClick() {
  tone(620, 0, 0.07, 'triangle', 0.12);
}

export function playFound() {
  tone(523.25, 0, 0.12, 'sine', 0.22);
  tone(659.25, 0.08, 0.12, 'sine', 0.22);
  tone(783.99, 0.16, 0.22, 'sine', 0.24);
}

export function playWrong() {
  tone(160, 0, 0.18, 'sawtooth', 0.12);
  tone(110, 0.05, 0.22, 'sawtooth', 0.1);
  noiseBurst(0, 0.12, 0.08);
}

export function playHint() {
  tone(880, 0, 0.1, 'sine', 0.16);
  tone(1174.66, 0.09, 0.18, 'sine', 0.16);
}

export function playLevelComplete() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => tone(freq, i * 0.1, 0.18, 'triangle', 0.2));
}

export function playWinFanfare() {
  const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.51];
  notes.forEach((freq, i) => tone(freq, i * 0.13, 0.28, 'triangle', 0.2));
  tone(261.63, 0, 0.9, 'sine', 0.1);
}
