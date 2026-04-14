class ChatEchoWidget extends HTMLElement {
  private readonly shadowRootRef: ShadowRoot;
  private messagesEl!: HTMLDivElement;
  private inputEl!: HTMLTextAreaElement;
  private sendButtonEl!: HTMLButtonElement;
  private socket: WebSocket | null = null;
  private backendUrl = "";

  constructor() {
    super();
    this.shadowRootRef = this.attachShadow({ mode: "open" });
  }

  connectedCallback(): void {
    this.backendUrl = this.getAttribute("backend-url") || this.defaultBackendUrl();
    this.render();
    this.bindEvents();
    this.connectWebSocket();
    void this.callHttpEcho();
    this.inputEl.focus();
  }

  disconnectedCallback(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  private defaultBackendUrl(): string {
    const host = window.location.hostname || "localhost";
    return `${window.location.protocol}//${host}:8000`;
  }

  private toWebSocketUrl(httpUrl: string): string {
    const url = new URL(httpUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return url.toString();
  }

  private render(): void {
    this.shadowRootRef.innerHTML = `
      <style>
        :host {
          all: initial;
          font-family: "Fira Sans", "Trebuchet MS", sans-serif;
        }

        .widget {
          position: fixed;
          right: 16px;
          bottom: 16px;
          width: 340px;
          height: 420px;
          display: grid;
          grid-template-rows: auto 1fr auto;
          border-radius: 14px;
          border: 1px solid #d8b17b;
          background: linear-gradient(170deg, #fcf8f1 0%, #efe7db 100%);
          box-shadow: 0 14px 30px rgba(48, 39, 22, 0.28);
          color: #1f2c34;
          overflow: hidden;
          z-index: 9999;
        }

        .header {
          padding: 10px 12px;
          font-size: 14px;
          letter-spacing: 0.03em;
          font-weight: 700;
          background: #f0d9b7;
          border-bottom: 1px solid #d8b17b;
        }

        .messages {
          overflow-y: auto;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .line {
          font-size: 13px;
          line-height: 1.35;
          padding: 8px 9px;
          border-radius: 9px;
          max-width: 92%;
          word-break: break-word;
        }

        .line.client {
          align-self: flex-end;
          background: #d4eadf;
          border: 1px solid #95c2ad;
        }

        .line.server {
          align-self: flex-start;
          background: #d8e6f4;
          border: 1px solid #9cb8d2;
        }

        .line.system {
          align-self: center;
          background: #f4e4c9;
          border: 1px solid #d3b486;
        }

        .composer {
          border-top: 1px solid #d8b17b;
          background: #f9f4eb;
          padding: 8px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
        }

        textarea {
          resize: none;
          min-height: 56px;
          max-height: 92px;
          padding: 8px;
          font-family: inherit;
          font-size: 13px;
          border-radius: 8px;
          border: 1px solid #bca079;
          background: #fff;
          color: #1f2c34;
        }

        button {
          align-self: end;
          height: 38px;
          padding: 0 14px;
          border-radius: 8px;
          border: 1px solid #255f58;
          background: #2f7f75;
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        button:hover {
          background: #26695f;
        }
      </style>

      <div class="widget">
        <div class="header">Widget Echo Chat</div>
        <div class="messages" id="messages"></div>
        <div class="composer">
          <textarea id="chat-input" placeholder="Type a message. Ctrl+Enter sends."></textarea>
          <button id="send-button" type="button">Send</button>
        </div>
      </div>
    `;

    this.messagesEl = this.shadowRootRef.querySelector("#messages") as HTMLDivElement;
    this.inputEl = this.shadowRootRef.querySelector("#chat-input") as HTMLTextAreaElement;
    this.sendButtonEl = this.shadowRootRef.querySelector("#send-button") as HTMLButtonElement;
  }

  private bindEvents(): void {
    this.sendButtonEl.addEventListener("click", () => {
      this.sendCurrentInput();
    });

    this.inputEl.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "Enter" && event.ctrlKey) {
        event.preventDefault();
        this.sendCurrentInput();
      }
    });
  }

  private connectWebSocket(): void {
    const wsUrl = this.toWebSocketUrl(`${this.backendUrl}/chat-echo`);
    this.socket = new WebSocket(wsUrl);

    this.socket.addEventListener("open", () => {
      this.addLine("system", "WebSocket connected.");
    });

    this.socket.addEventListener("message", (event: MessageEvent<string>) => {
      this.addLine("server", event.data);
    });

    this.socket.addEventListener("error", () => {
      this.addLine("system", "WebSocket error.");
    });

    this.socket.addEventListener("close", () => {
      this.addLine("system", "WebSocket closed.");
    });
  }

  private async callHttpEcho(): Promise<void> {
    try {
      const response = await fetch(`${this.backendUrl}/echo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: "Hello" })
      });

      const payload = await response.json();
      this.addLine("system", `HTTP /echo response: ${JSON.stringify(payload)}`);
    } catch {
      this.addLine("system", "HTTP /echo failed.");
    }
  }

  private sendCurrentInput(): void {
    const text = this.inputEl.value.trim();
    if (!text) {
      return;
    }

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.addLine("system", "WebSocket not connected yet.");
      return;
    }

    this.socket.send(text);
    this.addLine("client", text);
    this.inputEl.value = "";
    this.inputEl.focus();
  }

  private addLine(role: "client" | "server" | "system", text: string): void {
    const line = document.createElement("div");
    line.className = `line ${role}`;
    line.textContent = text;
    this.messagesEl.appendChild(line);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;

    this.dispatchEvent(
      new CustomEvent("widget-message", {
        bubbles: true,
        composed: true,
        detail: { role, text }
      })
    );
  }
}

if (!customElements.get("chat-echo-widget")) {
  customElements.define("chat-echo-widget", ChatEchoWidget);
}
