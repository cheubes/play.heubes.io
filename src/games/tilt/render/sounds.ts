import type { GameAudio } from '../../shell/types';
import type { Color } from '../logic/types';

const TARGET_PITCHES: Record<Color, number> = {
  amber: 1046.5,
  azure: 1174.66,
  rose: 1318.51,
  mint: 1567.98,
};
const TARGET_INTERVAL = 1.5;
const TARGET_NOTE_GAP = 0.06;
const VICTORY_PITCHES = [523.25, 659.26, 783.99, 1046.5];
const VICTORY_NOTE_GAP = 0.08;

export interface TiltSounds {
  slide(): void;
  impact(delay: number): void;
  blocked(): void;
  target(color: Color, delay: number): void;
  victory(delay: number): void;
  undo(): void;
  // Drops the sounds scheduled after an animation that an input has just finished.
  cancelPending(): void;
}

interface ScheduledSource {
  source: AudioScheduledSourceNode;
  start: number;
}

export function createSounds(audio: GameAudio): TiltSounds {
  const scheduled = new Set<ScheduledSource>();
  let noise: AudioBuffer | undefined;

  function noiseBuffer(audioContext: AudioContext): AudioBuffer {
    if (noise?.sampleRate !== audioContext.sampleRate) {
      noise = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * 0.1), audioContext.sampleRate);
      const samples = noise.getChannelData(0);
      for (let index = 0; index < samples.length; index++) {
        samples[index] = Math.random() * 2 - 1;
      }
    }
    return noise;
  }

  function schedule(source: AudioScheduledSourceNode, start: number, duration: number): void {
    const entry = { source, start };
    scheduled.add(entry);
    source.addEventListener('ended', () => scheduled.delete(entry));
    source.start(start);
    source.stop(start + duration);
  }

  function tone(audioContext: AudioContext, output: AudioNode, frequency: number, start: number, duration: number, peak: number): void {
    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(peak, start + 0.004);
    envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(envelope).connect(output);
    schedule(oscillator, start, duration);
  }

  function filteredNoise(
    audioContext: AudioContext,
    output: AudioNode,
    frequency: number,
    start: number,
    duration: number,
    shape: (gain: AudioParam) => void,
  ): void {
    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const envelope = audioContext.createGain();
    source.buffer = noiseBuffer(audioContext);
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = 1.2;
    shape(envelope.gain);
    source.connect(filter).connect(envelope).connect(output);
    schedule(source, start, duration);
  }

  function play(delay: number, render: (audioContext: AudioContext, output: AudioNode, start: number) => void): void {
    const audioContext = audio.context();
    const output = audio.output();
    if (audioContext && output) {
      render(audioContext, output, audioContext.currentTime + delay / 1000);
    }
  }

  return {
    slide() {
      play(0, (audioContext, output, start) =>
        filteredNoise(audioContext, output, 900, start, 0.09, (gain) => {
          gain.setValueAtTime(0, start);
          gain.linearRampToValueAtTime(0.25, start + 0.03);
          gain.linearRampToValueAtTime(0, start + 0.09);
        }),
      );
    },
    impact(delay) {
      play(delay, (audioContext, output, start) => tone(audioContext, output, 140, start, 0.09, 0.5));
    },
    blocked() {
      play(0, (audioContext, output, start) => tone(audioContext, output, 90, start, 0.07, 0.15));
    },
    target(color, delay) {
      play(delay, (audioContext, output, start) => {
        const pitch = TARGET_PITCHES[color];
        tone(audioContext, output, pitch, start, 0.12, 0.12);
        tone(audioContext, output, pitch * TARGET_INTERVAL, start + TARGET_NOTE_GAP, 0.16, 0.12);
      });
    },
    victory(delay) {
      play(delay, (audioContext, output, start) =>
        VICTORY_PITCHES.forEach((pitch, index) =>
          tone(audioContext, output, pitch, start + index * VICTORY_NOTE_GAP, 0.3, 0.16),
        ),
      );
    },
    // A reversed click: the noise swells, then stops dead.
    undo() {
      play(0, (audioContext, output, start) =>
        filteredNoise(audioContext, output, 2200, start, 0.05, (gain) => {
          gain.setValueAtTime(0.001, start);
          gain.exponentialRampToValueAtTime(0.3, start + 0.045);
          gain.linearRampToValueAtTime(0, start + 0.05);
        }),
      );
    },
    cancelPending() {
      const now = audio.context()?.currentTime ?? 0;
      for (const entry of scheduled) {
        if (entry.start > now) {
          entry.source.stop();
          scheduled.delete(entry);
        }
      }
    },
  };
}
