// Expo replaces process.env.EXPO_PUBLIC_* with the values from .env when the app is built
declare const process: { env: { EXPO_PUBLIC_SUPABASE_URL?: string; EXPO_PUBLIC_SUPABASE_ANON_KEY?: string; [key: string]: string | undefined } };
