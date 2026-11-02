import type { GameAudio } from '../../shell/types';

const NOISE_DURATION = 0.4;
const FOLD_DURATION = 0.22;
const LAND_DURATION = 0.03;
const BLOCKED_GAP = 0.04;
const UNFOLD_DURATION = 0.15;
const RUSTLE_LOW = 800;
const RUSTLE_HIGH = 2500;
// C, E and G of the C major pentatonic scale.
const VICTORY_PITCHES = [523.25, 659.26, 783.99];
const VICTORY_NOTE_GAP = 0.06;
const VICTORY_DURATION = 0.9;

export interface FoldSounds {
  fold(): void;
  land(): void;
  blocked(): void;
  unfold(): void;
  victory(): void;
}

export function createSounds(audio: GameAudio): FoldSounds {
  let noise: AudioBuffer | undefined;

  function noiseBuffer(audioContext: AudioContext): AudioBuffer {
    if (noise?.sampleRate !== audioContext.sampleRate) {
      noise = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * NOISE_DURATION), audioContext.sampleRate);
      const samples = noise.getChannelData(0);
      for (let index = 0; index < samples.length; index++) {
        samples[index] = Math.random() * 2 - 1;
      }
    }
    return noise;
  }

  function envelope(audioContext: AudioContext, output: AudioNode, start: number, duration: number, peak: number): GainNode {
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    gain.connect(output);
    return gain;
  }

  // Rises and falls evenly, like paper sliding over paper.
  function bellEnvelope(audioContext: AudioContext, output: AudioNode, start: number, duration: number, peak: number): GainNode {
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + duration / 2);
    gain.gain.linearRampToValueAtTime(0, start + duration);
    gain.connect(output);
    return gain;
  }

  function filteredNoise(
    audioContext: AudioContext,
    destination: AudioNode,
    start: number,
    duration: number,
    type: BiquadFilterType,
    frequency: number,
  ): BiquadFilterNode {
    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    source.buffer = noiseBuffer(audioContext);
    filter.type = type;
    filter.frequency.value = frequency;
    source.connect(filter).connect(destination);
    source.start(start);
    source.stop(start + duration);
    return filter;
  }

  function rustle(audioContext: AudioContext, output: AudioNode, start: number, duration: number, from: number, to: number): void {
    const filter = filteredNoise(audioContext, bellEnvelope(audioContext, output, start, duration, 0.18), start, duration, 'bandpass', from);
    filter.Q.value = 1.5;
    filter.frequency.setValueAtTime(from, start);
    filter.frequency.exponentialRampToValueAtTime(to, start + duration);
  }

  function thud(audioContext: AudioContext, output: AudioNode, start: number, frequency: number, peak: number): void {
    filteredNoise(audioContext, envelope(audioContext, output, start, LAND_DURATION, peak), start, LAND_DURATION, 'lowpass', frequency);
  }

  function tone(audioContext: AudioContext, output: AudioNode, frequency: number, start: number, duration: number, peak: number): void {
    const oscillator = audioContext.createOscillator();
    oscillator.frequency.value = frequency;
    oscillator.connect(envelope(audioContext, output, start, duration, peak));
    oscillator.start(start);
    oscillator.stop(start + duration);
  }

  function play(render: (audioContext: AudioContext, output: AudioNode, start: number) => void): void {
    const audioContext = audio.context();
    const output = audio.output();
    if (audioContext && output) {
      render(audioContext, output, audioContext.currentTime);
    }
  }

  return {
    fold() {
      play((audioContext, output, start) => rustle(audioContext, output, start, FOLD_DURATION, RUSTLE_LOW, RUSTLE_HIGH));
    },
    land() {
      play((audioContext, output, start) => thud(audioContext, output, start, 600, 0.3));
    },
    blocked() {
      play((audioContext, output, start) => {
        for (const offset of [0, BLOCKED_GAP]) {
          thud(audioContext, output, start + offset, 250, 0.4);
          tone(audioContext, output, 110, start + offset, LAND_DURATION, 0.15);
        }
      });
    },
    unfold() {
      play((audioContext, output, start) => rustle(audioContext, output, start, UNFOLD_DURATION, RUSTLE_HIGH, RUSTLE_LOW));
    },
    victory() {
      play((audioContext, output, start) =>
        VICTORY_PITCHES.forEach((pitch, index) => {
          const offset = index * VICTORY_NOTE_GAP;
          tone(audioContext, output, pitch, start + offset, VICTORY_DURATION - offset, 0.1);
        }),
      );
    },
  };
}
