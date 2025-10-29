import { createFileRoute } from '@tanstack/react-router'
import * as client from 'openid-client';
import {getOIDCConfig} from "@/utils/auth-config.ts";



function getCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const cookie = cookieHeader.split(';').find(c => c.trim().startsWith(`${name}=`));
  return cookie?.split('=')[1];
}
export const Route = createFileRoute('/auth/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');

        const cookieHeader = request.headers.get('cookie');

        const stateCookie = getCookie(cookieHeader, 'oidc_state');
        const nonceCookie = getCookie(cookieHeader, 'oidc_nonce');
        const codeVerifierCookie = getCookie(cookieHeader, 'oidc_code_verifier');

        console.log("[SERVER] Cookies retrieved:", {
          hasState: stateCookie,
          hasNonce: nonceCookie,
          hasCodeVerifier: codeVerifierCookie,
        });

        console.log('Authorization code:', code);
        console.log('State:', state);

        // Validate required parameters
        if (!code || !state) {
          console.error("[SERVER] Missing code or state parameter");
          return new Response('Invalid callback parameters', { status: 400 });
        }

        // Validate state matches
        if (state !== stateCookie) {
          console.error("[SERVER] State mismatch");
          return new Response('Invalid state parameter', { status: 400 });
        }

        // Validate code verifier exists
        if (!codeVerifierCookie) {
          console.error("[SERVER] Missing code verifier");
          return new Response('Missing code verifier', { status: 400 });
        }

        try {
          // Exchange authorization code for tokens with PKCE
          const currentURL = new URL(request.url);
          let oidcConfig = await getOIDCConfig();
          const tokens = await client.authorizationCodeGrant(
            oidcConfig,
            currentURL,
            {
              pkceCodeVerifier: codeVerifierCookie,
              expectedNonce: nonceCookie,
              expectedState: stateCookie,
            }
          );

        console.log("[SERVER] Tokens received:", {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          hasIdToken: !!tokens.id_token
        });

        const claims = tokens.claims();
        const userinfo = await client.fetchUserInfo(oidcConfig, tokens.access_token, claims?.sub ?? '');

        console.log("[SERVER] Userinfo received:", {
          sub: userinfo.sub,
          name: userinfo.name,
          email: userinfo.email
        });

        // Store user info in cookie (encode as base64 to handle special characters)
        const userInfoJson = JSON.stringify({
          sub: userinfo.sub,
          name: userinfo.name,
          email: userinfo.email,
          given_name: userinfo.given_name,
          family_name: userinfo.family_name,
        });
        const userInfoEncoded = Buffer.from(userInfoJson).toString('base64');

        console.log('[SERVER] Setting user_info cookie:', userInfoEncoded);

        // Check if we're in production (use Secure flag only in production)
        const isProduction = process.env.NODE_ENV === 'production';
        const secureFlag = isProduction ? ' Secure;' : '';

        // Clear OIDC cookies and redirect to dashboard
        const headers = new Headers();
        headers.append('Set-Cookie', `oidc_state=; Max-Age=0; Path=/; HttpOnly;${secureFlag} SameSite=Lax`);
        headers.append('Set-Cookie', `oidc_nonce=; Max-Age=0; Path=/; HttpOnly;${secureFlag} SameSite=Lax`);
        headers.append('Set-Cookie', `oidc_code_verifier=; Max-Age=0; Path=/; HttpOnly;${secureFlag} SameSite=Lax`);
        headers.append('Set-Cookie', `user_info=${userInfoEncoded}; Max-Age=3600; Path=/; HttpOnly;${secureFlag} SameSite=Lax`);
        headers.set('Location', '/dashboard');

        return new Response(null, {
          status: 302,
          headers: headers,
        });
        } catch (error) {
          console.error("[SERVER] Token exchange failed:", error);
          return new Response('Authentication failed', { status: 500 });
        }
      },
    },
  },
})
