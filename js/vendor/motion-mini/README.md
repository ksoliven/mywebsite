# Motion mini

Motion 14.9.0, MIT licensed. Only `animate` from `motion/mini` is bundled here.
The ESM bundle is served locally; no runtime CDN or site build step is needed.

To regenerate with esbuild and Motion installed in a temporary working directory:

```js
// mini-entry.js
export { animate } from 'motion/mini';
```

```sh
esbuild mini-entry.js --bundle --minify --format=esm --target=es2020 --outfile=animate.js
```

Source and documentation: https://motion.dev/docs/animate
