# Kai-API

## Minimal HTML + Script Tag Example

```
<html>
  <body>
    <script src="https://unpkg.com/@kaimerra-corp/kai-api@1.0.12/dist/kaimerra.min.js"></script>
    <script>
      (async () => {
        const kai = await Kai.Kai.createForBrowser();
        console.log(kai.getCounter("0"));
      })();
    </script>
  </body>
</html>
```

## To publish

1. npm run build
2. npm run rollup
3. npm publish
