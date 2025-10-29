import * as client from 'openid-client';
import { DEMO_PRIVATE_KEY } from './demo-key-1.ts';

export interface AuthConfig {
  issuerUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  sessionSecret: string;
}

let cachedPrivateKey: CryptoKey | null = null;


const importPrivateKey = async (): Promise<CryptoKey> => {
  if (cachedPrivateKey) {
    return cachedPrivateKey;
  }

  try {
    const pemHeader = '';
    const pemFooter = '';
    const pemContents = DEMO_PRIVATE_KEY
      .replace(pemHeader, '')
      .replace(pemFooter, '')
      .replace(/\s/g, '');

    const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    cachedPrivateKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryDer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-512',
      },
      true,
      ['sign']
    );

    console.log('Private key imported successfully');
    return cachedPrivateKey;
  } catch (error) {
    console.error('Failed to import private key:', error);
    throw new Error(`Failed to import private key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};


export const getAuthConfig = (): AuthConfig => {
  const config = {
    issuerUrl: process.env.OIDC_ISSUER_URL || '',
    clientId: process.env.OIDC_CLIENT_ID || '',
    clientSecret: process.env.OIDC_CLIENT_SECRET || '',
    redirectUri: process.env.OIDC_REDIRECT_URI || 'http://localhost:8000/auth/callback',
    scope: process.env.OIDC_SCOPE || 'openid profile email',
    sessionSecret: process.env.SESSION_SECRET || 'change-this-to-a-secure-secret-in-production',
  };

  return config;
};

let cachedConfig: client.Configuration | null = null;

export const getOIDCConfig = async (): Promise<client.Configuration> => {
  if (cachedConfig) {
    return cachedConfig;
  }
  const config = getAuthConfig();

  if (!config.issuerUrl) {
    throw new Error('OIDC_ISSUER_URL environment variable is required');
  }
  if (!config.clientId) {
    throw new Error('OIDC_CLIENT_ID environment variable is required');
  }

  try {
    const issuerUrl =  new URL(config.issuerUrl);
    console.log('Parsed issuer URL:', issuerUrl.href);

    const discoveryURL = new URL('.well-known/openid-configuration', issuerUrl);
    console.log('Discovery endpoint:', discoveryURL.href);

    console.log('Importing private key...');
    const privateKey = await importPrivateKey();
    console.log('Private key imported');

    console.log('Attempting OIDC discovery with private key JWT...');

    cachedConfig = await client.discovery(
      discoveryURL,
      config.clientId,
      {},
      client.PrivateKeyJwt(privateKey)
    );

    console.log('OIDC discovery successful');

    try {
      const serverMetadata = cachedConfig.serverMetadata();
      console.log('Discovered endpoints:');
      console.log('- Authorization endpoint:', serverMetadata.authorization_endpoint);
      console.log('- Token endpoint:', serverMetadata.token_endpoint);
      console.log('- Issuer:', serverMetadata.issuer);
      console.log('- UserInfo endpoint:', serverMetadata.userinfo_endpoint);
    } catch (logError) {
      console.log('Note: Could not log endpoint details:', logError);
    }

    return cachedConfig;
  } catch (error) {
    console.error('OIDC discovery failed:', error);

    if (error instanceof Error) {
      console.error('Error properties:', Object.getOwnPropertyNames(error));
      console.error('Error stack:', error.stack);
      if ('code' in error) {
        console.error('Error code:', error.code);
      }

      if ('cause' in error) {
        console.error('Error cause:', error.cause);
      }
    }
    throw error;
  }
};

