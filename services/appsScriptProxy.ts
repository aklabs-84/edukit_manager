const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

const isLocalDev = (): boolean => {
  if (typeof window === 'undefined') return false;
  return LOCAL_HOSTS.has(window.location.hostname);
};

export const resolveAppsScriptUrl = (url: string): string => {
  if (!url || !isLocalDev()) return url;

  try {
    const parsed = new URL(url);
    const isAppsScriptHost =
      parsed.hostname === 'script.google.com' ||
      parsed.hostname === 'script.googleusercontent.com';

    if (!isAppsScriptHost) return url;

    return `/google-script${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
};
