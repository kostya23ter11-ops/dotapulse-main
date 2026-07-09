import openid from 'openid';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { getBaseUrl } from '@/lib/getBaseUrl';
import { getUserRole } from '@/lib/admin';

export async function GET(request: Request): Promise<Response> {
  const baseUrl = getBaseUrl(request);
  
  const relyingParty = new openid.RelyingParty(
    `${baseUrl}/api/auth/callback`,
    baseUrl,
    true,
    false,
    []
  );

  return new Promise<Response>((resolve) => {
    relyingParty.verifyAssertion(request.url, async (error, result) => {
      if (error || !result.authenticated) {
        console.error('Auth failed:', error || 'Not authenticated');
        return resolve(Response.redirect(`${baseUrl}/?error=auth_failed`));
      }

      const steamId = result.claimedIdentifier.split('/').pop() ?? '';
      
      let user = {
        steamId: steamId.toString(),
        name: `Player ${steamId.toString().substring(0, 6)}`,
        avatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
      };

      try {
        const steamApiKey = (process.env.STEAM_API_KEY || '').replace(/["']/g, '').trim();
        const steamId64 = steamId.toString().trim();
        
        if (steamApiKey) {
          const params = new URLSearchParams({
            key: steamApiKey,
            steamids: steamId64
          });

          const steamApiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?${params.toString()}`;
          
          const response = await fetch(steamApiUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0'
            },
            next: { revalidate: 0 }
          });

          if (response.ok) {
            const data = await response.json();
            const player = data.response?.players?.[0];
            if (player) {
              user = {
                steamId: player.steamid,
                name: player.personaname,
                avatar: player.avatarfull,
              };
            }
          }
        }
      } catch {
      }

      try {
        if (!process.env.AUTH_SECRET) {
          return resolve(Response.redirect(`${baseUrl}/?error=auth_not_configured`));
        }
        const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
        const userWithRole = {
          ...user,
          role: getUserRole(user.steamId),
        };
        const token = await new SignJWT(userWithRole)
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('30d')
          .sign(secret);

        const cookieStore = await cookies();
        cookieStore.set('auth_token', token, {
          httpOnly: true,
          secure: baseUrl.startsWith('https'),
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        });

        resolve(Response.redirect(`${baseUrl}/`));
      } catch (jwtError) {
        console.error('JWT/Cookie error:', jwtError);
        resolve(Response.redirect(`${baseUrl}/?error=session_error`));
      }
    });
  });
}
