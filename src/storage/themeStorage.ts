import { DEFAULT_APP_THEME_ID, isAppThemeId, type AppThemeId } from '../themeRegistry';

const STORAGE_KEY_THEME = 'wamp.theme.v1';
const LEGACY_STORAGE_KEY_THEME = 'mac2.theme.v1';
const LEGACY_THEME_ALIASES: Record<string, AppThemeId> = {
  'sunset-static': 'ghetto-blaster',
};

export function loadAppTheme(): AppThemeId {
  const stored = localStorage.getItem(STORAGE_KEY_THEME) ?? localStorage.getItem(LEGACY_STORAGE_KEY_THEME);
  if (!stored) return DEFAULT_APP_THEME_ID;

  const normalized = LEGACY_THEME_ALIASES[stored] ?? stored;
  return isAppThemeId(normalized) ? normalized : DEFAULT_APP_THEME_ID;
}

export function saveAppTheme(themeId: AppThemeId): void {
  localStorage.setItem(STORAGE_KEY_THEME, themeId);
}
