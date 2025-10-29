import { createFileRoute } from "@tanstack/react-router";

function getCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const cookie = cookieHeader.split(';').find(c => c.trim().startsWith(`${name}=`));
  return cookie?.split('=')[1];
}

export const Route = createFileRoute("/api/user-info")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cookieHeader = request.headers.get('cookie');
        const userInfoCookie = getCookie(cookieHeader, 'user_info');

        console.log('[SERVER] /api/user-info - Cookie header:', cookieHeader);
        console.log('[SERVER] /api/user-info - User info cookie:', userInfoCookie ? 'found' : 'not found');

        if (!userInfoCookie) {
          return new Response(JSON.stringify({ userInfo: null }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        try {
          // Decode base64 cookie value
          const userInfoJson = Buffer.from(userInfoCookie, 'base64').toString('utf-8');
          const userInfo = JSON.parse(userInfoJson);
          console.log('[SERVER] /api/user-info - User info decoded successfully');

          return new Response(JSON.stringify({ userInfo }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('[SERVER] /api/user-info - Failed to parse user info:', error);
          return new Response(JSON.stringify({ userInfo: null }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }
  }
});

