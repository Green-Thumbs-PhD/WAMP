export type AppThemeId = 'the-stack' | 'cyberpunk' | 'ghetto-blaster' | 'polar-signal';

export interface AppThemeDefinition {
  id: AppThemeId;
  name: string;
  description: string;
  badges: [string, string, string];
  preview: [string, string, string];
}

export const DEFAULT_APP_THEME_ID: AppThemeId = 'the-stack';

export const APP_THEME_REGISTRY: readonly AppThemeDefinition[] = [
  {
    id: 'the-stack',
    name: 'The Stack',
    description: 'Warm walnut rack tones and classic studio hardware glow.',
    badges: ['Tube Voice Matrix', 'Stereo Power Section', 'MIDI / Tempo Sync'],
    preview: ['#6a4b2a', '#d7a152', '#15110d'],
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon rails, magenta bloom, and midnight chrome surfaces.',
    badges: ['Neon Signal Bus', 'Chrome Pulse Grid', 'Afterhours Sync Link'],
    preview: ['#00f6ff', '#ff2db9', '#1c1035'],
  },
  {
    id: 'ghetto-blaster',
    name: 'Ghetto Blaster',
    description: 'Chunky tape-deck chrome, speaker grills, and street-lit cassette swagger.',
    badges: ['Dual Cassette Deck', 'Chrome Speaker Array', 'Street Tape Recall'],
    preview: ['#d7d9df', '#ff7a18', '#191919'],
  },
  {
    id: 'polar-signal',
    name: 'Polar Signal',
    description: 'Cold broadcast steel with ice-blue meters and clean frost.',
    badges: ['Cryo Monitor', 'Northline Relay', 'Signal Freeze Array'],
    preview: ['#d8f2ff', '#79bfff', '#183447'],
  },
] as const;

export function isAppThemeId(value: string): value is AppThemeId {
  return APP_THEME_REGISTRY.some((theme) => theme.id === value);
}

export function getAppThemeDefinition(themeId: AppThemeId): AppThemeDefinition {
  return APP_THEME_REGISTRY.find((theme) => theme.id === themeId) ?? APP_THEME_REGISTRY[0];
}
