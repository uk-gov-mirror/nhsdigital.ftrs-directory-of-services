import * as client from 'openid-client';
import {getAuthConfig, getOIDCConfig} from "@/utils/auth-config.ts";

export interface AuthorizationData {
  url: string;
  cookies: {
    state: string;
    nonce: string;
    codeVerifier: string;
  };
}

export const getAuthorisationUrl = async (): Promise<AuthorizationData> => {

  try {
    const oidcConfig = await getOIDCConfig();
    const config = getAuthConfig();

    const state = client.randomState();
    const nonce = client.randomNonce();
    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);

    const parameters = {
      redirect_uri: config.redirectUri,
      scope: config.scope,
      acr_values: "AAL2_OR_AAL3_ANY",
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      max_age: '300'
    };
    const authorizationUrl = client.buildAuthorizationUrl(oidcConfig, parameters);
    console.log('Authorization URL:', authorizationUrl.href);
    return {
      url: authorizationUrl.href,
      cookies: {
        state,
        nonce,
        codeVerifier
      }
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);

      // Check if it's the specific issuer mismatch error
      if (error.message.includes('OAUTH_JSON_ATTRIBUTE_COMPARISON_FAILED') ||
        error.message.includes('issuer')) {
        console.error('This appears to be an OIDC issuer mismatch error.');
        console.error('Please verify your OIDC_ISSUER_URL environment variable matches the issuer in your OIDC discovery endpoint.');
      }
    }
    throw error;
  }
}
