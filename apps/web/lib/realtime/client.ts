import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { getAuthToken } from "../api/client";
import { useRealtimeStore } from "../../stores/realtimeStore";

// Attach Pusher to window for Laravel Echo
if (typeof window !== "undefined") {
  (window as any).Pusher = Pusher;
}

let echoInstance: Echo<"reverb"> | null = null;

function getApiOrigin(): string {
  if (typeof window !== "undefined") {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && (envUrl.startsWith("http://") || envUrl.startsWith("https://"))) {
      try {
        return new URL(envUrl).origin;
      } catch {
        return window.location.origin;
      }
    }
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

function getReverbHost(): string {
  if (typeof window !== "undefined" && window.location.hostname) {
    const envHost = process.env.NEXT_PUBLIC_REVERB_HOST;
    if (envHost && envHost !== "localhost" && envHost !== "127.0.0.1") {
      return envHost;
    }
    return window.location.hostname;
  }
  return process.env.NEXT_PUBLIC_REVERB_HOST || "localhost";
}

function getReverbPort(): number {
  if (typeof window !== "undefined") {
    // When on HTTPS (production), WSS MUST connect over standard port 443 (or browser port)
    // because reverse proxy (NGINX) routes /app/ and /apps/ through port 443 with SSL.
    if (window.location.protocol === "https:") {
      return window.location.port ? Number(window.location.port) : 443;
    }

    // In local dev on port 3000, Reverb usually runs on 8080
    if (window.location.port === "3000") {
      return 8080;
    }

    // If explicit env variable was provided and not default fallback
    if (process.env.NEXT_PUBLIC_REVERB_PORT) {
      const p = Number(process.env.NEXT_PUBLIC_REVERB_PORT);
      if (!isNaN(p)) return p;
    }

    // If accessed via another HTTP port (e.g. 8888 for docker gateway)
    if (window.location.port) {
      return Number(window.location.port);
    }

    return 80;
  }

  if (process.env.NEXT_PUBLIC_REVERB_PORT) {
    return Number(process.env.NEXT_PUBLIC_REVERB_PORT);
  }
  return 8080;
}

export function getEcho(): Echo<"reverb"> | null {
  if (typeof window === "undefined") return null;

  if (!echoInstance) {
    const key =
      process.env.NEXT_PUBLIC_REVERB_KEY ||
      process.env.NEXT_PUBLIC_REVERB_APP_KEY ||
      "ionlivechatkey";
    const host = getReverbHost();
    const port = getReverbPort();
    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    const scheme = isHttps ? "https" : (process.env.NEXT_PUBLIC_REVERB_SCHEME || "http");
    const isTls = scheme === "https";

    useRealtimeStore.getState().setStatus("connecting");

    echoInstance = new Echo({
      broadcaster: "reverb",
      key,
      wsHost: host,
      wsPort: isTls ? 443 : port,
      wssPort: isTls ? port : 443,
      forceTLS: isTls,
      enabledTransports: ["ws", "wss"],
      authorizer: (channel: any) => ({
        authorize: (socketId: string, callback: (error: any, authData: any) => void) => {
          const token = getAuthToken();
          const authUrl = `${getApiOrigin()}/broadcasting/auth`;

          fetch(authUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channel.name,
            }),
          })
            .then(async (response) => {
              if (!response.ok) {
                // Fallback to /api/v1/broadcasting/auth if needed
                if (response.status === 404) {
                  return fetch(`${getApiOrigin()}/api/v1/broadcasting/auth`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Accept: "application/json",
                      Authorization: token ? `Bearer ${token}` : "",
                    },
                    body: JSON.stringify({
                      socket_id: socketId,
                      channel_name: channel.name,
                    }),
                  });
                }
                throw new Error(`Broadcast auth failed with status ${response.status}`);
              }
              return response;
            })
            .then(async (res) => {
              const data = await res.json();
              callback(null, data);
            })
            .catch((err) => {
              console.warn("Realtime authorization failed for channel:", channel.name, err);
              callback(err, null);
            });
        },
      }),
    });

    // Wire up connection state listeners
    const pusher = (echoInstance.connector as any)?.pusher;
    if (pusher?.connection) {
      pusher.connection.bind("state_change", (states: { previous: string; current: string }) => {
        const current = states.current;
        if (current === "connected" || current === "connecting" || current === "disconnected" || current === "unavailable") {
          useRealtimeStore.getState().setStatus(current);
        }
      });
      pusher.connection.bind("connected", () => {
        useRealtimeStore.getState().setStatus("connected");
      });
      pusher.connection.bind("disconnected", () => {
        useRealtimeStore.getState().setStatus("disconnected");
      });
      pusher.connection.bind("unavailable", () => {
        useRealtimeStore.getState().setStatus("unavailable");
      });
      pusher.connection.bind("error", (err: any) => {
        useRealtimeStore.getState().setError(err?.error?.data?.message || err?.message || "Koneksi realtime terputus");
      });
    }
  }

  return echoInstance;
}

export function disconnectEcho(): void {
  if (echoInstance) {
    try {
      echoInstance.disconnect();
    } catch {
      // Ignore cleanup error
    }
    echoInstance = null;
    useRealtimeStore.getState().setStatus("disconnected");
  }
}

export function reconnectEcho(): Echo<"reverb"> | null {
  disconnectEcho();
  return getEcho();
}
