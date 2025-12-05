1. Use [svgomg.net](https://jakearchibald.github.io/svgomg/) for optimization, which uses [SVGO](https://github.com/svg/svgo) as its backend.
   - Enable `Multipass`
   - Reduce `Number precision` and `Transform precision` as much as possible
2. Manual optimization
   - Use something like [SVGViewer](https://www.svgviewer.dev/) for convenience
   - Remove redundant attributes such as:
     - `rx="0" ry="0"`
     - `fill="none"`
     - `transform="matrix(1 0 0 1)`
   - Round numbers as much as possible. I'm working with pixel art, so I rounded most numbers to the nearest half-integer.
     - `matrix(1.001 0 0 1.005 -.01 -10.23)` becomes `matrix(1 0 0 1 0 -10)`
     - `d="M15.99 34.5H18"` becomes `d="M16 34.5H18"`
   - Make sure to check the preview on SVGViewer or similar to see if your changes have ruined something
3. Merge as many paths as possible
   - Use `<g></g>` tags to apply attributes to paths inside them. If 10 paths in a row are black, set `<g stroke="#000">` instead of on each path.
   - Try using just `d` instead of both `d` and `transform`
4. Use SVGViewer's optimizer
   - Put paths of similar color and attributes close to each other so that the optimizer merges them together. This can cause irreversable changes! Plan out your merges or else it'll become too hard to perform more of them.

The cursor SVG was `16.6 KB` initially.

1. `16.6 KB`
2. `4.59 KB` with SVGO optimizer
3. `3.68 KB` by optimizing manually
4. `2.44 KB` with SVGViewer optimizer
5. `1016 bytes` by repeating steps 3 and 4

94% reduction in file size. Could've been lower if I planned my merges better. Now the SVG is too confusing to merge without paths overlapping each other in the wrong ways. I'm happy that it's under a kilobyte though. There's probably a better way to automate this with a tailoring for pixel art.
