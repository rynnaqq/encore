// Web Audio synthesizer engine for Pixel Fishing Pro
// Provides low-latency, rich 8-bit & 16-bit retro arcade sound effects without external audio files.

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;
let lastReelSoundTime = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      try {
        audioCtx = new AudioContextClass();
        compressor = audioCtx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-18, audioCtx.currentTime);
        compressor.knee.setValueAtTime(12, audioCtx.currentTime);
        compressor.ratio.setValueAtTime(6, audioCtx.currentTime);
        compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
        compressor.release.setValueAtTime(0.15, audioCtx.currentTime);

        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.7, audioCtx.currentTime);

        masterGain.connect(compressor);
        compressor.connect(audioCtx.destination);
      } catch (err) {
        console.warn('AudioContext creation failed:', err);
      }
    }
  }
  return audioCtx;
}

export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

// Noise buffer generator for splash, whoosh, and paper flips
function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export type FishingSoundType = 
  | 'cast' 
  | 'splash' 
  | 'bite' 
  | 'tap' 
  | 'caught' 
  | 'escape' 
  | 'reeling' 
  | 'release' 
  | 'perfect' 
  | 'page' 
  | 'click';

export function playFishingSound(type: FishingSoundType, enabled = true) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx || !masterGain) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;

  try {
    switch (type) {
      case 'cast': {
        // Line whoosh + rod whip sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.22);
        
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        // Add subtle white noise swoosh
        const noiseBuf = createNoiseBuffer(ctx, 0.18);
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(1800, now + 0.1);
        filter.Q.setValueAtTime(2, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.15, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        noiseSource.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(masterGain);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.23);
        noiseSource.start(now);
        noiseSource.stop(now + 0.18);
        break;
      }

      case 'splash': {
        // Realistic water splash (low sine bubble + filtered noise burst)
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

        oscGain.gain.setValueAtTime(0.35, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(oscGain);
        oscGain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.26);

        // Water bubble 2
        const osc2 = ctx.createOscillator();
        const osc2Gain = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(600, now + 0.04);
        osc2.frequency.exponentialRampToValueAtTime(150, now + 0.22);
        osc2Gain.gain.setValueAtTime(0.001, now);
        osc2Gain.gain.setValueAtTime(0.2, now + 0.04);
        osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc2.connect(osc2Gain);
        osc2Gain.connect(masterGain);
        osc2.start(now + 0.04);
        osc2.stop(now + 0.23);

        // Splash noise
        const noiseBuf = createNoiseBuffer(ctx, 0.25);
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, now);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.24);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.25, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        noiseSource.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(masterGain);

        noiseSource.start(now);
        noiseSource.stop(now + 0.25);
        break;
      }

      case 'bite': {
        // High urgency retro "!" bite alert - snappy double chime
        const tones = [
          { freq: 880, start: 0, dur: 0.09 },
          { freq: 1760, start: 0.09, dur: 0.22 },
        ];

        tones.forEach(t => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(t.freq, now + t.start);

          gain.gain.setValueAtTime(0.001, now + t.start);
          gain.gain.linearRampToValueAtTime(0.25, now + t.start + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, now + t.start + t.dur);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + t.start);
          osc.stop(now + t.start + t.dur);
        });
        break;
      }

      case 'tap': {
        // Hook set / reel tap click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.07);
        break;
      }

      case 'reeling': {
        // Mechanical ratchet click (throttled to avoid sound pileup)
        if (now - lastReelSoundTime < 0.045) return;
        lastReelSoundTime = now;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        // Alternating pitch for ratchet sensation
        const freq = (Math.random() > 0.5 ? 520 : 640) + Math.random() * 40;
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.035);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }

      case 'caught': {
        // Celebratory retro fanfare (C5, E5, G5, C6 arpeggio + sparkle chords)
        const notes = [
          { freq: 523.25, start: 0, dur: 0.11 },      // C5
          { freq: 659.25, start: 0.11, dur: 0.11 },   // E5
          { freq: 783.99, start: 0.22, dur: 0.11 },   // G5
          { freq: 1046.50, start: 0.33, dur: 0.35 },  // C6
          { freq: 1318.51, start: 0.44, dur: 0.35 },  // E6 high harmonizer
        ];

        notes.forEach(n => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(n.freq, now + n.start);

          gain.gain.setValueAtTime(0.001, now + n.start);
          gain.gain.linearRampToValueAtTime(0.28, now + n.start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.dur);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + n.start);
          osc.stop(now + n.start + n.dur);
        });

        // Add bright shimmer bell
        const bell = ctx.createOscillator();
        const bellGain = ctx.createGain();
        bell.type = 'sine';
        bell.frequency.setValueAtTime(2093, now + 0.35); // C7
        bellGain.gain.setValueAtTime(0.001, now + 0.35);
        bellGain.gain.linearRampToValueAtTime(0.18, now + 0.38);
        bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        bell.connect(bellGain);
        bellGain.connect(masterGain);
        bell.start(now + 0.35);
        bell.stop(now + 0.8);
        break;
      }

      case 'escape': {
        // Comical descending tension fail sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.35);

        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.36);
        break;
      }

      case 'release': {
        // Uplifting gentle water return
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.35);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.36);
        break;
      }

      case 'perfect': {
        // Sparkly chime for perfect cast
        const notes = [1046.50, 1318.51, 1567.98, 2093.00];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);

          gain.gain.setValueAtTime(0.001, now + idx * 0.05);
          gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.05 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.25);
        });
        break;
      }

      case 'page': {
        // Paper flip sound
        const noiseBuf = createNoiseBuffer(ctx, 0.09);
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.exponentialRampToValueAtTime(400, now + 0.08);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.2, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        noiseSource.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(masterGain);

        noiseSource.start(now);
        noiseSource.stop(now + 0.09);
        break;
      }

      case 'click': {
        // Clean tactile UI click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.035);
        break;
      }
    }
  } catch (e) {
    console.warn('Error playing fishing sound:', e);
  }
}
