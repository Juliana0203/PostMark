import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

type SoundName = 'thud' | 'rustle' | 'click';

const SOURCES: Record<SoundName, number> = {
  thud: require('../../assets/sounds/stamp-thud.wav') as number,
  rustle: require('../../assets/sounds/paper-rustle.wav') as number,
  click: require('../../assets/sounds/shutter-click.wav') as number,
};
const VOLUME: Record<SoundName, number> = { thud: 1, rustle: 0.7, click: 0.6 };

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let configured: Promise<void> | null = null;

function configure(): Promise<void> {
  // Suena aunque el interruptor de silencio esté activo y no interrumpe la música del usuario.
  configured ??= setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => undefined);
  return configured;
}

function getPlayer(name: SoundName): AudioPlayer {
  let player = players[name];
  if (!player) {
    player = createAudioPlayer(SOURCES[name]);
    player.volume = VOLUME[name];
    players[name] = player;
  }
  return player;
}

function play(name: SoundName): void {
  void configure().then(() => {
    try {
      const player = getPlayer(name);
      void player.seekTo(0);
      player.play();
    } catch {
      // Un fallo de audio nunca debe romper la interacción.
    }
  });
}

const haptic = (style: Haptics.ImpactFeedbackStyle) => Haptics.impactAsync(style).catch(() => undefined);

/** Precarga los reproductores para que el primer sonido no tenga latencia. */
export function preloadSounds(): void {
  void configure().then(() => {
    try {
      (Object.keys(SOURCES) as SoundName[]).forEach(getPlayer);
    } catch {
      // Se reintentará al reproducir.
    }
  });
}

export function playStampThud(): void {
  play('thud');
  void haptic(Haptics.ImpactFeedbackStyle.Heavy);
}

export function playPaperRustle(): void {
  play('rustle');
  void haptic(Haptics.ImpactFeedbackStyle.Light);
}

export function playShutterClick(): void {
  play('click');
  void haptic(Haptics.ImpactFeedbackStyle.Medium);
}
