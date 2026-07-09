/**
 * Надёжное определение базового URL приложения.
 * Особенно важно для Steam OpenID (realm + return_to должны совпадать с реальным доменом).
 */
export function getBaseUrl(request?: Request | null): string {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL;
  if (envBase) {
    let url = envBase.replace(/\/$/, '');
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (request) {
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const proto = forwardedProto ? forwardedProto.split(',')[0].trim() : 'https';
    const host =
      request.headers.get('x-forwarded-host') ||
      request.headers.get('host');

    if (host) {
      return `${proto}://${host}`;
    }
  }

  if (request) {
    try {
      const url = new URL(request.url);
      if (url.host) {
        return `${url.protocol}//${url.host}`;
      }
    } catch {
      // ignore malformed
    }
  }

  return 'http://localhost:3000';
}