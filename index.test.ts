import { Kai } from "./index";

const getDummyWebSocket = () => {
  return {
    readyState: 3,
    addEventListener: (eventName: string, listener: Function) => {
      if(eventName === "message") {
        const initialCounters = JSON.stringify({
          messageType: "counter",
          counter: [
            {id:"0",count:0},
            {id:"1",count:0},
            {id:"2",count:0},
            {id:"3",count:0},
            {id:"4",count:0},
            {id:"5",count:0},
            {id:"6",count:0},
            {id:"7",count:0},
            {id:"8",count:0},
            {id:"9",count:0},
          ]
        })
        listener.call(this, {data:initialCounters});
      } else if (eventName === "open") {
        listener.call(this);
      }
    },
    send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {},
    close: () => {}
  }
}

test("construct kai", () => {
  // Let's just test that we can at least construct a kai
  // object.
  const fakeBearer = "testing-purposes-only";
  const fakeWebSocket = getDummyWebSocket();

  const kai = new Kai(fakeWebSocket, fakeBearer);
});

test("get counters", () => {
  // Let's just test that we can at least construct a kai
  // object.
  const fakeBearer = "testing-purposes-only";
  const fakeWebSocket = getDummyWebSocket();

  const kai = new Kai(fakeWebSocket, fakeBearer);
  const counters = kai.getCounters();
  expect(counters).toBeInstanceOf(Map);
  expect(counters.get("1")).toEqual(0);
});

test("validate rate-limiting", () => {
  const fakeBearer = "testing-purposes-only";
  const fakeWebSocket = getDummyWebSocket();

  const kai = new Kai(fakeWebSocket, fakeBearer);

  //should be able to increment in positive direction
  let result = kai.incrementCounter("0", 1);
  expect(result).toEqual(1);
  
  //should be able to increment in negative direction
  result = kai.incrementCounter("0", -1);
  expect(result).toEqual(0);

  //Both increments should count against rate limit, resulting in 60 here
  result = kai.incrementCounter("0", 60);
  expect(result).toEqual(58);

  //Subsequent additions and subtractions should be ignored
  result = kai.incrementCounter("0", 100);
  expect(result).toEqual(58);
  result = kai.incrementCounter("0", -100);
  expect(result).toEqual(58);

  //Let's pretend time skipped ahead a minute
  jest.useFakeTimers().setSystemTime(Date.now() + 60001); 

  //Should be able to increment again now 
  result = kai.incrementCounter("0", 1);
  expect(result).toEqual(59);

  //But only up to 60, total
  result = kai.incrementCounter("0", -60);
  expect(result).toEqual(0);


});
