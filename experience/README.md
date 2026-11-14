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
| `js/media.js` | The learner's name, the downloadable boarding-pass ticket and the certificate (drawn in the browser, nothing uploaded) |
| `js/donki.js` | Real space-weather card |
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
- The key is optional: if it is missing or NASA's keyed gateway answers with an error, the function falls back to NASA's direct DONKI web service (no key needed).
- For solar flares there is a third backup: NOAA's Space Weather Prediction Center (real GOES-satellite records, last 7 days). The card says which source it used (NASA DONKI or NOAA).
- If no live source answers (GitHub Pages, offline, NASA outage), the card shows a clearly labelled example, so nothing breaks. Failures are remembered for 5 minutes so visitors don't wait through timeouts.
- To see what NASA answered, open `/api/donki?type=FLR&days=30&debug=1` (the key is hidden in the output).
- Testing locally: copy `.dev.vars.example` to `.dev.vars`, add the key, then run `npx wrangler pages dev experience`.

## Guidance for testers
- **"What to do now" box:** every screen shows one short instruction, the button to press glows, and the box updates as you go (for example "2 of 5 parts inspected"). **SHOW ME** scrolls to the glowing control.
- **Fewer things to click:** the bottom bar has three items (Mission, Base HQ, Quests). Decorations that did nothing (fake radio player, map zoom buttons, counselor audio) are hidden.
- **Ticket:** on the invitation the learner types their name and gets a personalised boarding-pass picture to download (PNG).
- **Certificate:** at the end a certificate with their name, title and score opens automatically, with PNG download and print. The name never leaves the device.

## Plain language (ages 7–12)

All on-screen text is rewritten at runtime to simple words. The source of truth is `data/simple-text.json` (original → simple sentence pairs). After editing it, run `python3 tools/build-simple-text.py` to regenerate `js/simple-text.js`. Single-word rules (British spelling, "Lunar" → "Moon") live in the same script.

## Real NASA pictures

A small "Real NASA photo" strip sits at the bottom of the menu (NASA's Astronomy Picture of the Day) and of each Moon-day task (a real photo for that topic from the NASA Image and Video Library). Tapping it opens a bigger picture with a link to NASA, and "Another photo" shows more.

- `functions/api/nasa.js` fetches them. Photos need no key; the picture of the day uses `NASA_API_KEY` (or NASA's shared `DEMO_KEY`). Only a fixed list of topics can be searched.
- `js/nasa.js` draws the strip. If NASA cannot be reached the strip does not appear. It never changes the score.
- Check the live answer at `/api/nasa?kind=apod&debug=1` and `/api/nasa?kind=photo&topic=crater&debug=1` (the key is hidden).
