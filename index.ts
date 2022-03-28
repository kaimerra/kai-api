const remoteWs = "wss://backend.kaimerra.com";

type counterId = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type eventType = counterId | "any" | "close";

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

export class Kai {
  bearer: string;
  websocket: WebSocket;
  counters: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  listeners: Map<String, Map<number, Function>> = new Map();
  listenerCounter: number = 0;

  private connectBackEnd() {
    try {
      console.log("client trying to connect " + Date.now());
      const client = new WebSocket(`${remoteWs}/ws`);

      client.onmessage = (request: MessageEvent) => {
        const data = request.data;
        const message = JSON.parse(data.toString());
        switch (message.messageType) {
          case "counter": {
            const oldCounters = this.counters;
            const updates = message.counter as CounterMessage[];
            for (const update of updates) {
              const id = parseInt(update.id);
              this.counters[id] = update.count;
              if (this.listeners.has(update.id)) {
                this.listeners.get(update.id).forEach((listener) => {
                  //Pass in the new absolute value and delta change
                  listener(update.count, update.count - oldCounters[id]);
                });
              }
            }
            if (this.listeners.has("any")) {
              this.listeners
                .get("any")
                .forEach((listener) => listener(this.counters));
            }
            break;
          }
        }
      };

      client.onopen = (event: Event) => {
        const loginMessage: Message = {
          messageType: "login",
          login: {
            bearer: this.bearer,
          },
        };
        client.send(JSON.stringify(loginMessage));
      };

      client.onclose = (event: CloseEvent) => {
        const closeCallbacks = this.listeners.get("close") || new Map();
        closeCallbacks.forEach((callback: Function) => {
          callback(event);
        });
      };

      return client;
    } catch (error: any) {
      console.log("Yeeouch!");
      console.log(error);
    }
  }

  connect(bearer: string) {
    this.bearer = bearer;
    this.websocket = this.connectBackEnd();
  }

  disconnect() {
    this.websocket.close();
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
  }

  /**
   * Register callbacks for various counter/network events.
   *
   * for individual counter events, the callback parameters are:
   * callback(newAbsoluteValue: number, deltaChange: number)
   *
   * for "any" counter events, the callback parameters are:
   * callback(latestCounterValues: number[]) //Array of all counters
   *
   * for "close" network events, the callback parameters are:
   * callback(event: CloseEvent)
   *
   * @param event the name of the event to register a callback for
   * @param callback the callback to be executed when a corresponding event is received
   * @returns a function to be called to deregister this callback
   */
  on(event: eventType, callback: Function): Function {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Map());
    }
    const handle = this.listenerCounter++;
    this.listeners.get(event).set(handle, callback);
    return () => this.listeners.get(event).delete(handle);
  }

  /**
   * Get the current state of the counters
   * @returns a copy of the latest state of all counters
   */
  getCounters(): number[] {
    return this.counters.slice();
  }

  /**
   * Get the latest value for a specified counter
   * @param counterNumber the counter id
   * @returns the latest value for specified counter
   */
  get(counterNumber: counterId) {
    return this.counters[parseInt(counterNumber)];
  }

  /**
   * Unregisters all listeners/callbacks for events
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }
}
