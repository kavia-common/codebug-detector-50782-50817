/**
 * Centralized config for PUBLIC_* env handling.
 * Determines effective apiBase and mode (demo vs connected).
 *
 * Exposed object:
 *  - apiBase: string | null   -> base URL for API calls if connected, otherwise null
 *  - mode: 'demo' | 'connected'
 *  - isDemo: boolean
 *
 * This module only reads Astro public env variables.
 */

// PUBLIC_INTERFACE
export function getConfig() {
  /** This function reads environment variables and returns the app config. */
  // Astro public env support; code must be isomorphic-safe. Use import.meta.env.* in Astro.
  // Possible variables available per container_env:
  // PUBLIC_API_BASE, PUBLIC_BACKEND_URL, PUBLIC_FRONTEND_URL, PUBLIC_WS_URL, PUBLIC_NODE_ENV,
  // PUBLIC_NEXT_TELEMETRY_DISABLED, PUBLIC_ENABLE_SOURCE_MAPS, PUBLIC_PORT, PUBLIC_TRUST_PROXY,
  // PUBLIC_LOG_LEVEL, PUBLIC_HEALTHCHECK_PATH, PUBLIC_FEATURE_FLAGS, PUBLIC_EXPERIMENTS_ENABLED

  const env = (import.meta as any).env ?? import.meta.env;

  const apiBaseRaw = (env?.PUBLIC_API_BASE as string | undefined)?.trim();
  const backendUrlRaw = (env?.PUBLIC_BACKEND_URL as string | undefined)?.trim();

  // Prefer PUBLIC_API_BASE if set; fall back to PUBLIC_BACKEND_URL
  const chosen = apiBaseRaw || backendUrlRaw || '';

  // Normalize: ensure no trailing slash for consistency
  const normalized = chosen.replace(/\/+$/, '');

  const connected = normalized.length > 0;

  const config = {
    apiBase: connected ? normalized : null,
    mode: connected ? ('connected' as const) : ('demo' as const),
    isDemo: !connected,
  };

  return config;
}

// PUBLIC_INTERFACE
export const appConfig = getConfig();
/** This is a public constant snapshot of the configuration for use in .astro and client code. */
