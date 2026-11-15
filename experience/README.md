# A Day on the Moon: how the experience is built

Open `experience/index.html` (or `/experience/` on the site). No build is needed to play.
For the story, scoring and how to run it, see the main `README.md`.

## How it works

The original screens come from **Google Stitch** (`../stitch_moonbase_mission_game_ui`). They are mounted as exported
(same markup, colours and fonts) and a layer of scripts adds interaction, then simplifies and rebuilds the busy screens
so a 7 to 12 year old can see what to do at a glance.

Order the scripts load in `index.html` (later scripts can wrap earlier screens):

| File | Purpose |
|---|---|
| `js/lib.js` | Small helpers, sounds |
| `js/screens-data.js` | **Generated** from the Stitch export (markup, CSS and scripts of the 27 screens) |
| `js/minis.js` | Optional hands-on activities (rocks, power puzzle, shelter, antenna, breakfast, dress-up with drawn gear pictures ...) |
| `js/simple-text.js` | **Generated** plain-language text map (see below) |
| `js/engine.js` | Router (`#/screen`), saved progress, screen mounting, header meters, modals, toasts, the "What to do now" helper, plain-language pass |
| `js/donki.js` | Real space-weather card |
| `js/media.js` | The learner's name, the downloadable ticket and the certificate (drawn in the browser, nothing uploaded) |
| `js/flow.js` | Screens 1 to 22: wiring, the 7 tasks, scoring, weather events, evaluation, endings |
| `js/quests.js` | Quest hub and the 5 NASA Science Quests. Separate storage, never touches the mission or score |
| `js/nasa.js` | "Real NASA photo" button on each task |
| `js/focus.js` | "More to explore" row: extra reading is tucked behind small buttons |
| `js/extras.js` | Pop-ups for things that looked clickable but did nothing (food, buildings, health check) |
| `js/coachgo.js` | The helper box carries the screen's main button and a read-aloud button |
| `js/quiz.js` | The 5-question ticket quiz (4 of 5 to pass) |
| `js/scenes.js` | Picture-first scenes: menu, gear check, animated rocket launch, landing, base map, read-aloud |
| `js/redesign.js`, `js/redesign2.js` | Hands-on rebuilds of the task screens (health gauges, breakfast tray, exploration cards, rub-the-dust panels, report cards, day-done screen) and hiding the bottom bar during tasks |
| `js/boot.js` | Starts the app |
| `css/tailwind.css` | **Generated** static Tailwind build (no CDN) |
| `css/fonts.css`, `assets/fonts/` | Self-hosted Outfit and Material Symbols |
| `css/experience.css`, `css/minis.css` | Shared styles and scoped activity styles |

## Plain language (ages 7 to 12)

All on-screen text is rewritten at runtime to simple words. The source of truth is `data/simple-text.json`
(original sentence → simple sentence). After editing it run `python3 tools/build-simple-text.py` to regenerate
`js/simple-text.js`. Single-word rules (British spelling, "Lunar" → "Moon") live in the same script.

## Design rules we follow

- One clear thing to do per screen, with a glowing button and a short helper line. Read-aloud buttons instead of paragraphs.
- Extra facts go behind "More to explore" or a tap, never in the way.
- Every button does something visible. Nothing is chosen for the child in advance.
- The Science Quests and real NASA data never change the score or the ending.

## Real NASA data and pictures

- `functions/api/donki.js` returns recent solar flares. Sources, in order: `api.nasa.gov` (uses the key), NASA's DONKI web service, then NOAA. The card says which source it used, or shows a labelled example. Check it at `/api/donki?type=FLR&days=30&debug=1`.
- `functions/api/nasa.js` returns NASA photos (`?kind=photo&topic=crater`) and the daily picture (`?kind=apod`). If the daily-picture service sends a logo or fails it falls back to a real Image Library picture. Only a fixed list of topics can be searched. Add `&debug=1` to see what NASA answered.
- The key is read from the Cloudflare secret `NASA_API_KEY` and is never sent to the browser. It is optional.
- Local testing: copy `.dev.vars.example` to `.dev.vars`, add the key, then run `npx wrangler pages dev experience`.

## Testing tips

- `?demo=1` jumps to the Moon base. `?scenario=A|B|C` forces the weather.
- The certificate and ticket are canvas pictures; the name never leaves the device.
- Stitch pictures are still loaded from Google. To host them yourself run `node tools/localize-images.js` once and commit `assets/img/`.

## Rebuilding (only if the Stitch export changes)

```bash
cd experience
npm install
npm run build                    # regenerates js/screens-data.js, tailwind.config.js and css/tailwind.css
node tools/fetch-fonts.js        # re-download the fonts (optional)
node tools/localize-images.js    # download the Stitch images (run once, then commit assets/img/)
```
