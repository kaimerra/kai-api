import { EventEmitter } from "eventemitter3";
import { RateLimiter} from "./rate-limit";

interface LoginMessage {
  bearer: string;
}

export interface CounterMessage {
  id: string;
  count?: number;
  inc?: number;
}

interface Message {
  messageType: "login" | "counter";
  login?: LoginMessage;
  counter?: CounterMessage[];
}

interface GenericWebSocket {
  readyState: number;
  addEventListener(eventName: string, listener: Function): void;
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
  close(): void;
}

interface KaipodTokenResponse {
  token: string;
}

export declare interface Kai {
  on(
    event: "any",
    fn: (messages: Map<string, number>) => void,
    context?: any
  ): this;
  on(event: "open", fn: () => void, context?: any): this;
  on(event: "close", fn: () => void, context?: any): this;
  on(
    event: string,
    fn: (absolute: number, delta: number) => void,
    context?: any
  ): this;
}

export const RATE_LIMIT: number = 60;
export const TIME_LIMIT: number = 60000;

export class Kai extends EventEmitter {
  bearer: string;
  websocket: GenericWebSocket;
  counters: Map<string, number> = new Map();
  rates: Map<String, RateLimiter> = new Map();
  lastClearTime: number;

  static async createForBrowser() {
    const bearer = await Kai.getTokenFromKaipod();
    const websocket = new WebSocket("wss://backend.kaimerra.com/ws");

    return new Kai(websocket, bearer);
  }

  constructor(websocket: GenericWebSocket, bearer: string) {
    super();
    this.websocket = websocket;
    this.bearer = bearer;

    this.configureWebsocket();
  }

  configureWebsocket() {
    this.websocket.addEventListener("message", (request: MessageEvent) => {
      const data = request.data;
      const message = JSON.parse(data.toString());
      switch (message.messageType) {
        case "counter": {
          const oldCounters = new Map(this.counters);
          const updates = message.counter as CounterMessage[];
          for (const update of updates) {
            this.counters.set(update.id, update.count);
            this.rates.set(update.id, new RateLimiter(RATE_LIMIT, TIME_LIMIT));
            this.emit(
              update.id,
              update.count,
              update.count - oldCounters.get(update.id)
            );
          }
          this.emit("any", this.counters);
          break;
        }
      }
    });

    this.websocket.addEventListener("open", (event: Event) => {
      const loginMessage: Message = {
        messageType: "login",
        login: {
          bearer: this.bearer,
        },
      };
      this.websocket.send(JSON.stringify(loginMessage));
      this.emit("open");
      this.lastClearTime = Date.now();
    });

    this.websocket.addEventListener("close", (event: CloseEvent) => {
      console.log("Closed:", event.reason);
      this.emit("close");
    });
  }

  disconnect() {
    this.websocket.close();
  }

  isConnected(): boolean {
    return this.websocket.readyState == WebSocket.OPEN;
  }

  /**
   * Increment (or decrement) a counter
   * @param counter the counter to modify, can be negative.
   * @param increment the amount to increment the counter by
   */
  incrementCounter(counter: string, increment: number): number {
    const limiter = this.rates.get(counter);
    if (limiter.ready()) {
      const approvedLimit = limiter.use(increment);
      return this._incrementCounter(counter, approvedLimit);
    } else {
      return this.counters.get(counter);
    }
  }

  private _incrementCounter(counter: string, increment: number) {
    const request: Message = {
      messageType: "counter",
      counter: [{ id: counter, inc: increment }],
    };
    this.websocket.send(JSON.stringify(request));
    this.counters.set(counter, this.counters.get(counter) + increment);
    return this.counters.get(counter);
  }

  /**
   * Get the current state of the counters
   * @returns a copy of the latest state of all counters
   */
  getCounters(): Map<string, number> {
    return new Map(this.counters);
  }

  /**
   * Get the latest value for a specified counter
   * @param counter the counter id
   * @returns the latest value for specified counter
   */
  getCounter(counter: string) {
    return this.counters.get(counter);
  }

  /**
   * Get the bearer token from a locally running kaipod. Kaipod
   * must be authed and running to return this response.
   * @returns a bearer token for use in constructing a new Kai.
   */

  static async getTokenFromKaipod(): Promise<string> {
    const response = await fetch("http://localhost:3002/auth");
    const tokenResponse: KaipodTokenResponse = await response.json();
    return tokenResponse.token;
  }
}
