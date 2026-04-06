import { DEFAULT_APP_THEME_ID, isAppThemeId, type AppThemeId } from '../themeRegistry';

const STORAGE_KEY_THEME = 'wamp.theme.v1';
const LEGACY_STORAGE_KEY_THEME = 'mac2.theme.v1';

export function loadAppTheme(): AppThemeId {
  const stored = localStorage.getItem(STORAGE_KEY_THEME) ?? localStorage.getItem(LEGACY_STORAGE_KEY_THEME);
  return stored && isAppThemeId(stored) ? stored : DEFAULT_APP_THEME_ID;
}

export function saveAppTheme(themeId: AppThemeId): void {
  localStorage.setItem(STORAGE_KEY_THEME, themeId);
}
