# A Day on the Moon: interactive learning experience (Stitch UI)

An interactive learning experience built on the **Google Stitch designs** (`../stitch_moonbase_mission_game_ui` (the original Stitch export, kept for reference)). Explore it by opening
`experience/index.html` (or `https://<user>.github.io/<repo>/experience/` on GitHub Pages). No build is needed.
The original, simpler version is still at the repository root and is untouched.

This is **not a game to win**: it is a guided, hands-on way to learn about life on the Moon. Every task is built around the
Stitch screen's own interactions, ends with a short "what you learned" note, and gently hints instead of failing you.
Hands-on activities (mini-activities) are optional and give bonus points toward the 50-point mission evaluation.

## How it works
Each of the 27 Stitch screens is mounted **as exported** (same markup, same colours, same Outfit font, same icons) and a
learning layer adds the missing interactivity on top: saved progress, resources, a mission evaluation (35 + 10 + 5 = 50),
the weather branches, calculated endings, a certificate, and optional hands-on activities in Stitch-styled panels.

| File | Purpose |
|---|---|
| `index.html` | Shell only (`#app`, modal and toast roots) |
| `js/screens-data.js` | **Generated** from the Stitch export (markup, CSS and scripts of the 27 screens) |
| `js/engine.js` | Router, saved progress, screen mounting, live header (Oxygen/Power/Water/Food/time), modals, toasts |
| `js/flow.js` | Screens 1-22: wiring, tasks, scoring, weather, evaluation, endings |
| `js/quests.js` | Quest hub + the 5 NASA Science Quests. Separate storage; never touches the mission or score |
| `js/minis.js` | The optional hands-on activities (rocks, power puzzle, shelter, antenna, breakfast, dress-up ...) |
| `css/tailwind.css` | **Generated** static Tailwind build (no CDN needed) |
| `css/fonts.css`, `assets/fonts/` | Self-hosted Outfit + Material Symbols |
| `css/experience.css`, `css/minis.css` | Modal/toast/button styles and scoped activity styles |

## Useful URLs
- `?demo=1` skips straight to the Moon base (for judges and testing)
- `?scenario=A|B|C` forces the space weather (A normal, B power shortage, C solar particle event)

## Rebuilding (only if the Stitch export changes)
```bash
cd experience
npm install
npm run build            # regenerates js/screens-data.js, tailwind.config.js and css/tailwind.css
node tools/fetch-fonts.js        # re-download the fonts (optional)
node tools/localize-images.js    # download the Stitch images so the experience no longer hot-links Google (run once, then commit assets/img/)
```

## Real NASA data (DONKI)
The Solar Particle Event screen and the Solar Storm quest show a "Real NASA data" card (recent solar flares from NASA's DONKI database).
It is context only and never changes the mission or the evaluation.

- `functions/api/donki.js` (a Cloudflare Pages Function) fetches the data and keeps the NASA key on the server.
- Set the key once in Cloudflare: **Pages project -> Settings -> Variables and Secrets -> Add**, name `NASA_API_KEY`, type **Secret**, for Production and Preview.
- Without the key (or on GitHub Pages, or offline) the card shows a clearly labelled example, so nothing breaks.
- Testing locally: copy `.dev.vars.example` to `.dev.vars`, add the key, then run `npx wrangler pages dev experience`.
