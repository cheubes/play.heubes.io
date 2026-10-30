import type { GameAudio } from './types';

export interface AudioService {
  gameAudio: GameAudio;
  // Must run in a player gesture the first time: browsers only let an AudioContext start from one.
  activate(): void;
  suspend(): void;
  setEnabled(enabled: boolean): void;
}

export function createAudioService(enabled: boolean): AudioService {
  let context: AudioContext | undefined;
  let output: GainNode | undefined;
  let soundEnabled = enabled;

  function create(): void {
    try {
      context = new AudioContext();
      output = context.createGain();
      output.gain.value = soundEnabled ? 1 : 0;
      output.connect(context.destination);
    } catch (error) {
      console.error(error);
      context = undefined;
      output = undefined;
    }
  }

  return {
    gameAudio: {
      context: () => context,
      output: () => output,
    },
    activate() {
      if (!context) {
        create();
      }
      context?.resume().catch((error: unknown) => console.error(error));
    },
    suspend() {
      context?.suspend().catch((error: unknown) => console.error(error));
    },
    setEnabled(enabled) {
      soundEnabled = enabled;
      if (output) {
        output.gain.value = enabled ? 1 : 0;
      }
    },
  };
}
