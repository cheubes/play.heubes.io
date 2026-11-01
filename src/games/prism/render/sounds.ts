import type { GameAudio } from '../../shell/types';
import type { ColorName } from '../logic/types';
import { COLOR_NAMES } from './board';

// C major pentatonic, ascending in the order of the colors, so that targets lit in a row always sound together.
const TARGET_PITCHES: Record<ColorName, number> = {
  red: 523.25,
  green: 587.33,
  blue: 659.26,
  yellow: 783.99,
  cyan: 880,
  magenta: 1046.5,
  white: 1174.66,
};
const BELL_PARTIALS = [
  { ratio: 1, peak: 0.1 },
  { ratio: 2, peak: 0.04 },
  { ratio: 3, peak: 0.02 },
];
const BELL_DURATION = 0.6;
const SECTOR_DURATION = 0.2;
const PRIMARIES = [1, 2, 4];
const VICTORY_PITCHES = [523.25, 783.99, 1318.51];
const VICTORY_NOTE_GAP = 0.06;
const VICTORY_DURATION = 0.9;

export interface PrismSounds {
  toggle(): void;
  targetLit(color: number): void;
  targetUnlit(): void;
  sectorsReceived(primaries: number): void;
  sectorsLost(primaries: number): void;
  victory(): void;
  undo(): void;
  // Stops every sound still playing or scheduled, including those already started.
  stopAll(): void;
}

export function createSounds(audio: GameAudio): PrismSounds {
  const active = new Set<AudioScheduledSourceNode>();
  let noise: AudioBuffer | undefined;

  function track(source: AudioScheduledSourceNode): void {
    active.add(source);
    source.addEventListener('ended', () => active.delete(source));
  }

  function noiseBuffer(audioContext: AudioContext): AudioBuffer {
    if (noise?.sampleRate !== audioContext.sampleRate) {
      noise = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * 0.05), audioContext.sampleRate);
      const samples = noise.getChannelData(0);
      for (let index = 0; index < samples.length; index++) {
        samples[index] = Math.random() * 2 - 1;
      }
    }
    return noise;
  }

  function tone(audioContext: AudioContext, output: AudioNode, frequency: number, start: number, duration: number, peak: number): OscillatorNode {
    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(peak, start + 0.004);
    envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(envelope).connect(output);
    track(oscillator);
    oscillator.start(start);
    oscillator.stop(start + duration);
    return oscillator;
  }

  function click(audioContext: AudioContext, output: AudioNode, start: number, cutoff: number, pitch: number): void {
    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const envelope = audioContext.createGain();
    source.buffer = noiseBuffer(audioContext);
    filter.type = 'highpass';
    filter.frequency.value = cutoff;
    envelope.gain.setValueAtTime(0.3, start);
    envelope.gain.exponentialRampToValueAtTime(0.001, start + 0.04);
    source.connect(filter).connect(envelope).connect(output);
    track(source);
    source.start(start);
    source.stop(start + 0.04);
    tone(audioContext, output, pitch, start, 0.012, 0.08);
  }

  function descend(audioContext: AudioContext, output: AudioNode, start: number, peak: number): void {
    const oscillator = tone(audioContext, output, 880, start, 0.15, peak);
    oscillator.frequency.setValueAtTime(880, start);
    oscillator.frequency.exponentialRampToValueAtTime(587.33, start + 0.15);
  }

  function play(render: (audioContext: AudioContext, output: AudioNode, start: number) => void): void {
    const audioContext = audio.context();
    const output = audio.output();
    if (audioContext && output) {
      render(audioContext, output, audioContext.currentTime);
    }
  }

  return {
    toggle() {
      play((audioContext, output, start) => click(audioContext, output, start, 4000, 2000));
    },
    targetLit(color) {
      const name = COLOR_NAMES[color];
      if (!name) {
        return;
      }
      play((audioContext, output, start) => {
        for (const { ratio, peak } of BELL_PARTIALS) {
          tone(audioContext, output, TARGET_PITCHES[name] * ratio, start, BELL_DURATION, peak);
        }
      });
    },
    targetUnlit() {
      play((audioContext, output, start) => descend(audioContext, output, start, 0.05));
    },
    sectorsReceived(primaries) {
      play((audioContext, output, start) => {
        for (const primary of PRIMARIES) {
          const name = COLOR_NAMES[primary];
          if (primaries & primary && name) {
            tone(audioContext, output, TARGET_PITCHES[name], start, SECTOR_DURATION, 0.05);
          }
        }
      });
    },
    sectorsLost(primaries) {
      if (primaries) {
        play((audioContext, output, start) => descend(audioContext, output, start, 0.025));
      }
    },
    victory() {
      play((audioContext, output, start) =>
        VICTORY_PITCHES.forEach((pitch, index) => {
          const offset = index * VICTORY_NOTE_GAP;
          tone(audioContext, output, pitch, start + offset, VICTORY_DURATION - offset, 0.12);
        }),
      );
    },
    undo() {
      play((audioContext, output, start) => click(audioContext, output, start, 1500, 1000));
    },
    stopAll() {
      for (const source of active) {
        source.stop();
      }
      active.clear();
    },
  };
}
