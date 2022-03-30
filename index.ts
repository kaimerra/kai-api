import { EventEmitter } from "eventemitter3"

type counterId = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

interface LoginMessage {
  bearer: string;
}

export interface CounterMessage {
  id: counterId | string;
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

export class Kai extends EventEmitter {
  bearer: string;
  websocket: GenericWebSocket;
  counters: Map<string, number> = new Map();

  constructor (websocket: GenericWebSocket, bearer: string) {
      super();
      this.websocket = websocket;
      this.bearer = bearer;

    try {
        this.websocket.addEventListener('message', (request: MessageEvent) => {
            const data = request.data;
            const message = JSON.parse(data.toString());
            switch (message.messageType) {
              case "counter": {
                const oldCounters = new Map(this.counters);
                const updates = message.counter as CounterMessage[];
                for (const update of updates) {
                  this.counters.set(update.id, update.count);
                  this.emit(update.id, update.count, update.count - oldCounters.get(update.id));
                }
                this.emit("any", this.counters);
                break;
              }
            }
          });
    
          this.websocket.addEventListener('open', (event: Event) => {
            const loginMessage: Message = {
              messageType: "login",
              login: {
                bearer: this.bearer,
              },
            };
            websocket.send(JSON.stringify(loginMessage));
            this.emit("open");
          });
    
          this.websocket.addEventListener('close', (event: CloseEvent) => {
            console.log(event);
            this.emit("close")
          });
    } catch (error: any) {
        console.log("Yeeouch!");
        console.log(error);
      }
      
  }

  disconnect() {
    this.websocket.close();
  }

  isConnected() : boolean {
      return this.websocket.readyState == WebSocket.OPEN;
  }

  /**
   * Increment (or decrement) a counter
   * @param counter the counter to modify, can be negative.
   * @param increment the amount to increment the counter by
   */
  incrementCounter(counter: string, increment: number) {
    const request: Message = {
      messageType: "counter",
      counter: [{ id: counter, inc: increment }],
    };
    this.websocket.send(JSON.stringify(request));
    this.counters.set(counter, this.counters.get(counter) + increment);
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
   * @param counterNumber the counter id
   * @returns the latest value for specified counter
   */
  get(counterNumber: counterId) {
    return this.counters.get(counterNumber);
  }
}
