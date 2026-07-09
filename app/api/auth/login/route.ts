import openid from 'openid';
import { getBaseUrl } from '@/lib/getBaseUrl';

export async function GET(request: Request): Promise<Response> {
  const baseUrl = getBaseUrl(request);
  const relyingParty = new openid.RelyingParty(
    `${baseUrl}/api/auth/callback`,
    baseUrl,
    true,
    false,
    [],
  );

  return new Promise<Response>((resolve) => {
    relyingParty.authenticate('https://steamcommunity.com/openid', false, (error, authUrl) => {
      if (error) {
        return resolve(Response.json({ error: 'Authentication failed' }, { status: 500 }));
      }
      if (!authUrl) {
        return resolve(Response.json({ error: 'Authentication failed' }, { status: 500 }));
      }
      resolve(Response.redirect(authUrl));
    });
  });
}