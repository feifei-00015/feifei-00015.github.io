# Site code

The website's source code lives in this folder. The project root keeps only a small `index.html` that opens `site/`; media and fonts stay in `../assets/`.

| Path | Purpose |
| --- | --- |
| `index.html` | Page structure and content |
| `styles/` | CSS grouped by page section; loaded in the order listed in `index.html` |
| `scripts/app.js` | Entry point and scroll/video coordination |
| `scripts/taste.js` and `scripts/taste-effect.js` | Taste section and animated cards |
| `scripts/mood.js`, `carousel.js`, `skills.js`, `lanyards.js` | Other page sections |
| `scripts/math.js` | Shared math helpers |
| `scripts/vendor/` | Local Three.js 0.179.1 ES modules and license |

To preview locally, run `python3 -m http.server 8765` from the project root and open `http://127.0.0.1:8765/`.

This is one static page assembled with JavaScript modules; it does not need a router or build step.
