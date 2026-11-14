# A Day on the Moon: Stitch UI edition

The game rebuilt on the **Google Stitch designs** (`../stitch_moonbase_mission_game_ui`). Play it by opening
`game/index.html` (or `https://<user>.github.io/<repo>/game/` on GitHub Pages). No build is needed to play.
The original, simpler version is still at the repository root and is untouched.

## How it works
Each of the 27 Stitch screens is mounted **as exported** (same markup, same colours, same Outfit font, same icons) and a
game layer adds the missing gameplay on top: saved state, resources, attempts-based scoring (35 + 10 + 5 = 50),
the weather branches, calculated endings, a certificate, and mini-games inside Stitch-styled panels.

| File | Purpose |
|---|---|
| `index.html` | Shell only (`#app`, modal and toast roots) |
| `js/screens-data.js` | **Generated** from the Stitch export (markup, CSS and scripts of the 27 screens) |
| `js/engine.js` | Router, saved game, screen mounting, live header (Oxygen/Power/Water/Food/time), modals, toasts |
| `js/flow.js` | Screens 1-22: wiring, tasks, scoring, weather, evaluation, endings |
| `js/quests.js` | Quest hub + the 5 NASA Science Quests. Separate storage; never touches the mission or score |
| `js/minis.js` | The mini-games (rocks, power puzzle, shelter, antenna, breakfast, dress-up ...) |
| `css/tailwind.css` | **Generated** static Tailwind build (no CDN needed) |
| `css/fonts.css`, `assets/fonts/` | Self-hosted Outfit + Material Symbols |
| `css/game.css`, `css/minis.css` | Modal/toast/button styles and scoped mini-game styles |

## Useful URLs
- `?demo=1` skips straight to the Moon base (for judges and testing)
- `?scenario=A|B|C` forces the space weather (A normal, B power shortage, C solar particle event)

## Rebuilding (only if the Stitch export changes)
```bash
cd game
npm install
npm run build            # regenerates js/screens-data.js, tailwind.config.js and css/tailwind.css
node tools/fetch-fonts.js        # re-download the fonts (optional)
node tools/localize-images.js    # download the Stitch images so the game no longer hot-links Google (run once, then commit assets/img/)
```
