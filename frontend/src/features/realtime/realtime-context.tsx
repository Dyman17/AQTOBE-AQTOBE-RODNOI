import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { appConfig } from "@/app/config";
import type { RealtimeEventPayload } from "@/shared/types/domain";

type ConnectionState = "connecting" | "online" | "offline";

type RealtimeContextValue = {
  connectionState: ConnectionState;
  lastEvent: RealtimeEventPayload | null;
  lastEventAt: string | null;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

function toWsUrl(baseUrl: string) {
  if (baseUrl.startsWith("https://")) return `wss://${baseUrl.slice("https://".length)}/ws/updates`;
  if (baseUrl.startsWith("http://")) return `ws://${baseUrl.slice("http://".length)}/ws/updates`;
  return `${baseUrl}/ws/updates`;
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [lastEvent, setLastEvent] = useState<RealtimeEventPayload | null>(null);
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let retry: number | null = null;

    const connect = () => {
      setConnectionState("connecting");
      socket = new WebSocket(toWsUrl(appConfig.apiBaseUrl));

      socket.onopen = () => {
        setConnectionState("online");
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as RealtimeEventPayload;
          setLastEvent(parsed);
          setLastEventAt(parsed.sent_at);
        } catch {
          // Ignore malformed frames.
        }
      };

      socket.onerror = () => {
        setConnectionState("offline");
      };

      socket.onclose = () => {
        setConnectionState("offline");
        retry = window.setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (retry) window.clearTimeout(retry);
      socket?.close();
    };
  }, []);

  const value = useMemo(
    () => ({
      connectionState,
      lastEvent,
      lastEventAt,
    }),
    [connectionState, lastEvent, lastEventAt],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used inside RealtimeProvider");
  }
  return context;
}
