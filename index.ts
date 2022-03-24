const remoteWs = "wss://backend.kaimerra.com";

interface LoginMessage {
    bearer: string;
}

export interface CounterMessage {
    id: string,
    count?: number
    inc?: number
}
  
interface Message {
    messageType: "login" | "counter";
    login?: LoginMessage;
    counter? : CounterMessage[];
}

export class Kai {
    bearer: string;
    websocket: WebSocket;
    onMessage: Function;
    onClose: Function;
    
    private connectBackEnd() {
        try {
            console.log("client trying to connect " + Date.now());
            const client = new WebSocket(`${remoteWs}/ws`);

            client.onerror = (error: Event) => {
                console.error("Error connecting to backend");
                console.error(error);
            };

            client.onmessage = (request: MessageEvent) => {
                const data = request.data;
                const message = JSON.parse(data.toString());
                switch (message.messageType) {
                    case "counter": {
                        if (this.onMessage) {
                            this.onMessage(message.counter);
                        }
                        break;
                    }
                }
            };

            client.onopen = (event: Event) => {
                //Send auth request, perhaps set up pings
                const loginMessage: Message = { 
                    messageType: "login",
                    login: {
                        bearer: this.bearer
                    }
                };
                client.send(JSON.stringify(loginMessage));
            };

            client.onclose = (event: CloseEvent) => {
                //We are closed for business.
                //Todo elevate event to user
                if(this.onClose) {
                    this.onClose(event);
                }
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

    isConnected() {
        return this.websocket.readyState == WebSocket.OPEN;
    }

    incrementCounter(counter: string, increment: number) {
        const request : Message = { 
            messageType: "counter",
            counter: [{ id: counter, inc: increment }]
        };
        this.websocket.send(JSON.stringify(request));
    }

    on(event: "message" | "close", callback: Function) {
        if(event === "message") {
            this.onMessage = callback;
        } else if (event === "close") {
            this.onClose = callback;
        }
    }
}