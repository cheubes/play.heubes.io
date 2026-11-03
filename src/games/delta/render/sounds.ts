import type { GameAudio } from '../../shell/types';

const TIDE_DURATION = 0.4;
// G major pentatonic, from G4: the bell climbs one degree per basin held.
const BELL_ROOT = 392;
const PENTATONIC = [0, 2, 4, 7, 9];
// Partials of a bell: ratio to the pitch, and share of the peak.
const BELL_PARTIALS: readonly [number, number][] = [
  [1, 1],
  [2.76, 0.3],
  [5.4, 0.1],
];
const BELL_DURATION = 0.5;
const VICTORY_PITCHES = [523.25, 659.26, 783.99];
const VICTORY_NOTE_GAP = 0.06;
const CHORD_DURATION = 0.9;
const DEFEAT_PITCHES = [110, 130.81, 164.81];

export interface DeltaSounds {
  select(): void;
  route(): void;
  hold(): void;
  taken(held: number): void;
  lost(): void;
  tide(): void;
  victory(): void;
  defeat(): void;
}

function bellPitch(held: number): number {
  const degree = Math.max(0, held - 1);
  const semitones = 12 * Math.floor(degree / PENTATONIC.length) + PENTATONIC[degree % PENTATONIC.length]!;
  return BELL_ROOT * 2 ** (semitones / 12);
}

export function createSounds(audio: GameAudio): DeltaSounds {
  let noise: AudioBuffer | undefined;

  function noiseBuffer(audioContext: AudioContext): AudioBuffer {
    if (noise?.sampleRate !== audioContext.sampleRate) {
      noise = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * TIDE_DURATION), audioContext.sampleRate);
      const samples = noise.getChannelData(0);
      for (let index = 0; index < samples.length; index++) {
        samples[index] = Math.random() * 2 - 1;
      }
    }
    return noise;
  }

  function envelope(audioContext: AudioContext, output: AudioNode, start: number, duration: number, peak: number, attack = 0.004): GainNode {
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    gain.connect(output);
    return gain;
  }

  function tone(audioContext: AudioContext, output: AudioNode, frequency: number, start: number, duration: number, peak: number, type: OscillatorType = 'sine'): OscillatorNode {
    const oscillator = audioContext.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.connect(envelope(audioContext, output, start, duration, peak));
    oscillator.start(start);
    oscillator.stop(start + duration);
    return oscillator;
  }

  function sweep(audioContext: AudioContext, output: AudioNode, from: number, to: number, start: number, duration: number, peak: number, type: OscillatorType = 'sine'): void {
    const oscillator = tone(audioContext, output, from, start, duration, peak, type);
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
  }

  function play(render: (audioContext: AudioContext, output: AudioNode, start: number) => void): void {
    const audioContext = audio.context();
    const output = audio.output();
    if (audioContext && output) {
      render(audioContext, output, audioContext.currentTime);
    }
  }

  return {
    select() {
      play((audioContext, output, start) => tone(audioContext, output, 1200, start, 0.03, 0.05));
    },
    route() {
      play((audioContext, output, start) => sweep(audioContext, output, 400, 700, start, 0.12, 0.08));
    },
    hold() {
      play((audioContext, output, start) => sweep(audioContext, output, 600, 400, start, 0.1, 0.07));
    },
    taken(held) {
      play((audioContext, output, start) => {
        const pitch = bellPitch(held);
        for (const [ratio, share] of BELL_PARTIALS) {
          tone(audioContext, output, pitch * ratio, start, BELL_DURATION, 0.1 * share);
        }
      });
    },
    lost() {
      play((audioContext, output, start) => sweep(audioContext, output, 220, 110, start, 0.3, 0.14, 'triangle'));
    },
    tide() {
      play((audioContext, output, start) => {
        const source = audioContext.createBufferSource();
        const filter = audioContext.createBiquadFilter();
        source.buffer = noiseBuffer(audioContext);
        filter.type = 'lowpass';
        filter.frequency.value = 700;
        source.connect(filter).connect(envelope(audioContext, output, start, TIDE_DURATION, 0.025, TIDE_DURATION / 2));
        source.start(start);
        source.stop(start + TIDE_DURATION);
      });
    },
    victory() {
      play((audioContext, output, start) => {
        VICTORY_PITCHES.forEach((pitch, index) => {
          const offset = index * VICTORY_NOTE_GAP;
          tone(audioContext, output, pitch, start + offset, CHORD_DURATION - offset, 0.09);
        });
      });
    },
    defeat() {
      play((audioContext, output, start) => {
        for (const pitch of DEFEAT_PITCHES) {
          tone(audioContext, output, pitch, start, CHORD_DURATION, 0.1, 'triangle');
        }
      });
    },
  };
}
