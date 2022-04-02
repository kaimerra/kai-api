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

## Internal Development
### To publish

1. npm run build
2. npm run rollup
3. npm publish
