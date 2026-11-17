/**
 * RoofDynamics - WebSocket Service (Socket.io)
 * Real-time updates for dashboard, quotes, jobs, and notifications.
 */

import { io, Socket } from "socket.io-client";
import { env } from "../env";

const SOCKET_URL = env.VITE_API_BASE.replace("/api", "") || "http://localhost:5000";

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(tenantId: string): void {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket?.id);
      this.socket?.emit("join-tenant", tenantId);
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    // Re-register all listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((cb) => {
        this.socket?.on(event, cb);
      });
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    this.socket?.on(event, callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
      this.socket?.off(event, callback);
    };
  }

  emit(event: string, data: any): void {
    this.socket?.emit(event, data);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
export default socketService;
