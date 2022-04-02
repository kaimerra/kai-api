# Kai-API

## Getting the API.

### NPM

You can access the api via npm:

install...
`npm install @kaimerra-corp/kai-api`

in your code...later

```
// import Kai
import { Kai } from "@kaimerra-corp/kai-api/dist/index";

// in some async function
const main = async () {
  const kai = await Kai.createForBrowser();

  // use the new kai object to do awesome things!
}
```

### Minimal HTML + Script Tag Example

You can also access the API via a script tag.

```
<html>
  <body>
    <script src="https://unpkg.com/@kaimerra-corp/kai-api@1.0.12/dist/kaimerra.min.js"></script>
    <script>
      (async () => {
        const kai = await Kai.Kai.createForBrowser();

        // use the new kai object to do awesome things!
      })();
    </script>
  </body>
</html>
```

## Using the API

nitty-gritty info can be found in: https://kaimerra.github.io/kai-api/

### Authentication

The API talks to 2 systems, a running Kaipod instance on your computer and the Kaimerra backend.

Before you call

```
const kai = await Kai.createForBrowser()
```

you must have your Kaipod running and logged in.

![You will see your username and a check mark in the bottom left corner of kaipod if you're logged in!](https://s3.us-west-2.amazonaws.com/secure.notion-static.com/7115d5be-9303-4999-bd10-5a3579eb3cda/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45EIPT3X45%2F20220402%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20220402T172223Z&X-Amz-Expires=86400&X-Amz-Signature=4a7fed5f7d118d146dc1443b05f4ac7fa6545a6cc147848e0289df7410d1f3fb&X-Amz-SignedHeaders=host&response-content-disposition=filename%20%3D%22Untitled.png%22&x-id=GetObject)


### Counters

Currently the shared Kaimerra exposes an API for counters. There are a set of methods that allow you
to get the values of counters and set them.

```
// Getting the current value of a counter:
kai.getCounter("fire"); // returns a number.

// Updating a counter:
kai.incrementCounter("fire", 10); // adds 10 to the value of fire.

// Subscribing to events:
kai.on("any", counters) {
  // counters is a Map<string, number> containing updated values.
  if (counters.has("fire")) {
    console.log("Fire's new value is", counters.get("fire"));
  }
}
```
Currently, to prevent counters from rapdily spiraling out of control, the API will allow you to **increment or decrement up to 10 points across all counters each second.** 
If you try to increment by more than 10 at a time, your changes will be rate-limited and reduced to at most 10 points per second. The api will write a warning to the console to inform you have hit your limit in this case.
You can check to see if you've hit your limit by calling .ready() on your kai api instance; if you still have room for more increments, it will return true.

## Internal Development

### To publish

1. npm run build
2. npm run rollup
3. npm publish
