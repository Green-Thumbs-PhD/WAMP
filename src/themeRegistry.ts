export type AppThemeId = 'the-stack' | 'cyberpunk' | 'sunset-static' | 'polar-signal';

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
    id: 'sunset-static',
    name: 'Sunset Static',
    description: 'Dusty motel gradients with tape heat and amber haze.',
    badges: ['Tape Echo Lane', 'Sunline Console', 'Palm Drive Recall'],
    preview: ['#ffb44d', '#ff5f6d', '#3a2158'],
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
