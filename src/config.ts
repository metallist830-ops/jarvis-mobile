/** Backend URL is supplied per environment; never hardcode private infrastructure here. */
export const JARVIS_API_BASE_URL = (process.env.EXPO_PUBLIC_JARVIS_API_URL ?? '').trim().replace(/\/+$/, '');
