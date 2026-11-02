import type { GameAudio } from '../../shell/types';

const NOISE_DURATION = 0.4;
const COG_PITCHES = [1318.51, 1760];
const COG_NOTE_GAP = 0.08;
const COG_DURATION = 0.3;
const ROOM_PITCHES = [523.25, 659.26];
const ROOM_NOTE_GAP = 0.1;
const ROOM_DURATION = 0.25;
const LEVEL_PITCHES = [523.25, 659.26, 783.99];
const LEVEL_NOTE_GAP = 0.06;
const LEVEL_DURATION = 0.9;

export interface LeapSounds {
  jump(): void;
  land(): void;
  turn(): void;
  spring(): void;
  lever(): void;
  cog(): void;
  fall(): void;
  exitRoom(): void;
  exitLevel(): void;
}

export function createSounds(audio: GameAudio): LeapSounds {
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

  function tone(
    audioContext: AudioContext,
    output: AudioNode,
    frequency: number,
    start: number,
    duration: number,
    peak: number,
    type: OscillatorType = 'sine',
  ): OscillatorNode {
    const oscillator = audioContext.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.connect(envelope(audioContext, output, start, duration, peak));
    oscillator.start(start);
    oscillator.stop(start + duration);
    return oscillator;
  }

  function filteredNoise(
    audioContext: AudioContext,
    output: AudioNode,
    start: number,
    duration: number,
    peak: number,
    type: BiquadFilterType,
    frequency: number,
  ): BiquadFilterNode {
    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    source.buffer = noiseBuffer(audioContext);
    filter.type = type;
    filter.frequency.value = frequency;
    source.connect(filter).connect(envelope(audioContext, output, start, duration, peak));
    source.start(start);
    source.stop(start + duration);
    return filter;
  }

  function click(audioContext: AudioContext, output: AudioNode, start: number, peak: number): void {
    filteredNoise(audioContext, output, start, 0.015, peak, 'highpass', 4000);
    tone(audioContext, output, 3200, start, 0.01, peak / 3);
  }

  function notes(audioContext: AudioContext, output: AudioNode, start: number, pitches: number[], gap: number, duration: number, peak: number): void {
    pitches.forEach((pitch, index) => {
      const offset = index * gap;
      tone(audioContext, output, pitch, start + offset, duration - offset, peak);
    });
  }

  function play(render: (audioContext: AudioContext, output: AudioNode, start: number) => void): void {
    const audioContext = audio.context();
    const output = audio.output();
    if (audioContext && output) {
      render(audioContext, output, audioContext.currentTime);
    }
  }

  return {
    jump() {
      play((audioContext, output, start) => {
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1800;
        filter.connect(output);
        const oscillator = tone(audioContext, filter, 300, start, 0.08, 0.05, 'square');
        oscillator.frequency.setValueAtTime(300, start);
        oscillator.frequency.exponentialRampToValueAtTime(600, start + 0.08);
      });
    },
    land() {
      play((audioContext, output, start) => filteredNoise(audioContext, output, start, 0.03, 0.08, 'bandpass', 1200));
    },
    turn() {
      play((audioContext, output, start) => click(audioContext, output, start, 0.06));
    },
    spring() {
      play((audioContext, output, start) => {
        const oscillator = tone(audioContext, output, 200, start, 0.25, 0.12);
        oscillator.frequency.setValueAtTime(200, start);
        oscillator.frequency.exponentialRampToValueAtTime(700, start + 0.25);
        const vibrato = audioContext.createOscillator();
        const depth = audioContext.createGain();
        vibrato.frequency.value = 18;
        depth.gain.value = 40;
        vibrato.connect(depth).connect(oscillator.frequency);
        vibrato.start(start);
        vibrato.stop(start + 0.25);
      });
    },
    lever() {
      play((audioContext, output, start) => {
        click(audioContext, output, start, 0.2);
        click(audioContext, output, start + 0.03, 0.15);
      });
    },
    cog() {
      play((audioContext, output, start) => {
        for (const ratio of [1, 2]) {
          notes(
            audioContext,
            output,
            start,
            COG_PITCHES.map((pitch) => pitch * ratio),
            COG_NOTE_GAP,
            COG_DURATION,
            ratio === 1 ? 0.08 : 0.03,
          );
        }
      });
    },
    fall() {
      play((audioContext, output, start) => {
        const filter = filteredNoise(audioContext, output, start, 0.35, 0.2, 'bandpass', 2400);
        filter.Q.value = 4;
        filter.frequency.setValueAtTime(2400, start);
        filter.frequency.exponentialRampToValueAtTime(200, start + 0.35);
      });
    },
    exitRoom() {
      play((audioContext, output, start) => notes(audioContext, output, start, ROOM_PITCHES, ROOM_NOTE_GAP, ROOM_DURATION, 0.08));
    },
    exitLevel() {
      play((audioContext, output, start) => notes(audioContext, output, start, LEVEL_PITCHES, LEVEL_NOTE_GAP, LEVEL_DURATION, 0.1));
    },
  };
}
