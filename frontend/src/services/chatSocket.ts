import { ChatMessage } from '../types/models';

interface ChatSocketOptions {
  chatId: string;
  token?: string | null;
  onMessage: (message: ChatMessage) => void;
}

export class ChatSocket {
  private ws: WebSocket | null = null;
  private shouldReconnect = true;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private options: ChatSocketOptions) {}

  connect() {
    const baseWsUrl = process.env.EXPO_PUBLIC_WS_URL ?? 'ws://localhost:8000/ws/chats';
    const tokenPart = this.options.token ? `?token=${encodeURIComponent(this.options.token)}` : '';
    const url = `${baseWsUrl}/${this.options.chatId}${tokenPart}`;

    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string) as ChatMessage;
        this.options.onMessage(payload);
      } catch {
        // Ignore malformed payloads to keep chat UI stable.
      }
    };

    this.ws.onclose = () => {
      if (!this.shouldReconnect) {
        return;
      }

      this.reconnectTimer = setTimeout(() => this.connect(), 2500);
    };
  }

  sendMessage(body: string, senderId: string, senderName: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.ws.send(
      JSON.stringify({
        type: 'chat.message',
        body,
        senderId,
        senderName
      })
    );
  }

  disconnect() {
    this.shouldReconnect = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.ws?.close();
    this.ws = null;
  }
}
