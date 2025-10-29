import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/logout")({
  server: {
    handlers: {
      GET: async () => {
        console.log("[SERVER] /auth/logout - Clearing user session");

        // Clear user info cookie and redirect to home
        return new Response(null, {
          status: 302,
          headers: {
            Location: '/',
            'Set-Cookie': 'user_info=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax',
          },
        });
      }
    }
  }
});

