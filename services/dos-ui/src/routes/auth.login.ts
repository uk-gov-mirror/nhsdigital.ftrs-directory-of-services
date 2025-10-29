import { createFileRoute } from "@tanstack/react-router";
import { getAuthorisationUrl } from "@/utils/auth_util.ts";

export const Route = createFileRoute("/auth/login")({
  server: {
    handlers: {
      GET: async () => {

        const authData = await getAuthorisationUrl();

        console.log("[SERVER] Authorization URL generated:", authData.url);
        console.log("[SERVER] Setting cookies:", {
          hasState: !!authData.cookies.state,
          hasNonce: !!authData.cookies.nonce,
          hasCodeVerifier: !!authData.cookies.codeVerifier
        });

        const isProduction = process.env.NODE_ENV === 'production';
        const secureFlag = isProduction ? ' Secure;' : '';

        return new Response(null, {
          status: 302,
          headers: {
            Location: authData.url,
            'Set-Cookie': [
              `oidc_state=${authData.cookies.state}; HttpOnly;${secureFlag} SameSite=Lax; Path=/; Max-Age=600`,
              `oidc_nonce=${authData.cookies.nonce}; HttpOnly;${secureFlag} SameSite=Lax; Path=/; Max-Age=600`,
              `oidc_code_verifier=${authData.cookies.codeVerifier}; HttpOnly;${secureFlag} SameSite=Lax; Path=/; Max-Age=600`,
            ].join(', ')
          }
        });
      }
    }
  }
});

