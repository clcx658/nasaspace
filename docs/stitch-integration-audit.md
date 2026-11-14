# Stitch Integration Audit: "A Day on the Moon" (Team AstroPath)

Status: AUDIT ONLY. No game files were changed. Waiting for approval before any integration work.
Source: `stitch_moonbase_mission_game_ui/` (27 `code.html` + 27 `screen.png` + 2 `DESIGN.md`), compared with the live game on `main`.

How this was checked: all 27 HTML files were parsed (structure, scripts, links, images, handlers), both DESIGN.md files were read, and several screenshots were viewed. Scripts were read, **not executed**: Tailwind and fonts load from the internet, which this environment cannot reach. "Functional vs prototype" below is therefore from code reading and should be confirmed in a browser (Phase 0).

---

## 1. Headline findings

1. **The 27 exports are 27 separate web pages, not one app.** Every cross-screen link is `href="#"` or an in-page anchor. Nothing navigates, nothing is saved (no `localStorage`), and no state moves between screens.
2. **Roughly half the screens have real local interactions (by code reading); the rest are visual.** Most "completion" buttons end in `alert("...")` placeholders (14 `alert/confirm` calls across 8 files).
3. **Hard-coded numbers everywhere:** `Sol 04`, `10:30`, `O2 98%`, `Power 85%`, endings `49/50`, `43/50`, `36/50`, `28/50`, and a pre-set "ENDING S UNLOCKED" button on the evaluation screen. None of this is calculated.
4. **XP scoring conflicts with the 50-point rule.** Screens show `+90 XP`, `+300 Science XP`, `+100 Energy Points`, `100 XP REWARD`, `+10 Resource Management XP`. This must be removed or separated from the mission score.
5. **The Science Quest Hub screen does not exist.** All five quest screens say "Return to Science Quest Hub" and the main menu shows "NASA QUESTS 5", but no hub was exported.
6. **Four designs differ from the story document / current game** (details in section 6): Suit Up, Return & Rest, Solar Particle Event choices, and the "Normal conditions" screen.
7. **Every external dependency is a live CDN.** Tailwind (runtime), Google Fonts (Outfit, Material Symbols) and 48 images hot-linked from `lh3.googleusercontent.com`. Not reliable for a hackathon demo without self-hosting.
8. **The visual identity is very consistent and reusable.** 47 colour tokens with identical values on every screen, one font (Outfit), shared button, panel and HUD styles.
9. **Screenshots are desktop only** (about 925 to 1600 px wide). Mobile layouts are unverified, although the HTML uses Tailwind responsive classes (`sm:` 253, `md:` 168, `lg:` 155).
10. **Commander Nova appears on 19 of 27 screens and Rover-01 on 9.** Continuity is incomplete (8 screens have no Nova, 18 have no Rover-01).

---

## 2. All 27 screen mappings

Legend: **F** = working local interaction (self-contained, not connected to anything), **P** = partial (some controls work, rest static or `alert`), **V** = visual only.

| # | Stitch screen | Game scene it maps to | Current game (live) | Stitch status | Gap |
|---|---|---|---|---|---|
| 1 | Main Menu | Welcome | `#welcome` in `index.html` | V (fake music toggle) | Menu items (Training Hub, Quests, How to play, Lore, Resume) have no destinations |
| 2 | The Invitation | Invitation | `invitation()` in `story.js` | P (decline shows a toast, accept = `#training`) | Decline must loop back, as in the story document |
| 3 | Astronaut Training Hub | Training level select | **none** (we go straight into level 1) | V (no script) | New screen: 5 stations + progress |
| 4 | Astronaut Training: 5 Interactive Challenges | Training levels 1-5 | `training.js` (5 levels) | **F** (largest script, 15 KB; stations, badges, suit equip, reset) | Content differs from ours; no exit navigation |
| 5 | Rocket Launch Sequence | Journey / launch | `journey()` (emoji rocket) | P (throttle slider, boost button, stage alert) | Needs stage logic to finish and continue |
| 6 | Moon Landing / Welcome to Artemis Base Alpha | Landing | end of `journey()` | V | "Base Facility Radar" has no data |
| 7 | Artemis Base Alpha Main Hub | Base hub (between tasks) | `tour()` (one-off, before day 1) | P (select a building to see stats) | **New concept:** a persistent hub the player returns to between tasks |
| 8 | 08:00 Morning Health Check | Task 1 | `task1()` + `M.healthCheck` | P (diagnostic console, recalibrate, `alert`) | Different mechanic from ours |
| 9 | 09:00 Breakfast Time | Task 2 | `task2()` + `M.breakfast` | V + one `alert` ("+100 Energy Points") | Tray selection only; no floating-food play |
| 10 | 10:00 Suit Up | Task 3 | `task3()` + `M.dressUp` | V (vibration only; 5-point checklist) | **Not a dress-up game.** Mismatch with the requested "Astronaut Dress-up" |
| 11 | 11:00 Lunar Exploration | Task 4 (4 destinations) | `task4()` + `M.rocks` | P (pick a site, panel updates, `alert`) | No sample collection; costs are shown as % |
| 12 | 13:00 Power Inspection | Task 5 | `task5()` + `M.power` | **F** (wipe panels, auto-wipe, 3 inputs) | Different from our dust + cable puzzle |
| 13 | 15:00 Report to Earth | Task 6 (3 communication choices) | `task6()` + `M.dish` | P (choose report, transmit) | XP rewards in text; no antenna aiming |
| 14 | 17:00 Return and Rest | Task 7 | `task7()` + `M.sequence` | P (checklist toggles) | Seven different steps than the story document |
| 15 | 15. Normal Conditions | Weather scenario A | nothing happens (no screen) | P (choose next action) | Adds a decision not in the story document |
| 16 | 16. Power Shortage | Weather scenario B | `task5()` power-sharing step | P (choose plan A/B, `alert`) | Different from ours (toggle systems within budget) |
| 17 | 17. Solar Particle Event | Weather scenario C | `radiationEvent()` | P (protocol choice) | **Choices differ from the story document** |
| 18 | Mission Evaluation | Score breakdown | top of `ending()` | V (hard-coded 48/50) | Must be calculated; ending button must not be fixed to S |
| 19 | Ending S | Ending S | `ENDINGS.S` in `ending()` | V + audio | Certificate, print, PNG, QR are buttons only |
| 20 | Ending A | Ending A | `ENDINGS.A` | V (hard-coded 43/50) | Same |
| 21 | Ending B | Ending B | `ENDINGS.B` | V (hard-coded 36/50) | Same |
| 22 | Ending C | Ending C | `ENDINGS.C` | V (hard-coded 28/50) | Same |
| 23 | Quest 1: Breathe Easy (ECLSS) | Science Quest | **none** | **F** (matcher + quiz) | Hub missing; long page |
| 24 | Quest 2: Solar Storm Alert | Science Quest | **none** | P (quiz + state) | Same |
| 25 | Quest 3: Power Up (Fission Surface Power) | Science Quest | **none** | **F** (energy-grid routing + quiz) | Same |
| 26 | Quest 4: Greenhouse Heroes | Science Quest | **none** | **F** (plant steps + quiz) | Same |
| 27 | Quest 5: Moon Resource Explorer (ISRU) | Science Quest | **none** | **F** (sample analysis + quiz) | Same |

Screens by group: Front of game 1-7 (7), Seven tasks 8-14 (7), Weather 15-17 (3), Evaluation and endings 18-22 (5), Science Quests 23-27 (5). That is 27.

**Required-gameplay check against the exports**
| Requirement | In Stitch | Notes |
|---|---|---|
| 5 training challenges | Yes (screen 4, five stations) | One tabbed screen, plus hub screen 3 |
| Rocket launch + landing | Yes (5, 6) | |
| 7 daily activities | Yes (8-14) | |
| 4 exploration destinations | Yes (11) | Rim, Ridge, Shadowed Crater, Flat Survey |
| 3 communication choices | Yes (13) | Full, Safety, Science |
| 3 weather scenarios | Yes (15, 16, 17) | |
| Resource management and branching | Partly | Shown as text/percentages; not connected |
| Score capped at 50 | Shown (35+10+5) | But XP numbers conflict; values hard-coded |
| 4 dynamic endings | Four screens exist | Static, not calculated |
| 5 NASA Science Quests (no score effect) | Yes (23-27) | Screens use "XP"/badges: must stay isolated |

---

## 3. Existing project architecture (live `main`)

- Plain HTML + CSS + JavaScript, no build step, no libraries, system fonts, works from `file://` and GitHub Pages.
- `index.html`: shell with three sections (`#welcome`, `#game`, `#results`), a shared SVG astronaut symbol, a HUD bar (`#hud`), and a `#stage` that scenes redraw.
- `js/core.js`: shared helpers on `window.JAM` (state, sound, meters, `J.stage`, `J.cta`, `J.choose`, `J.result`, HUD).
- `js/training.js`: five training levels (not scored).
- `js/minis.js`: ten mini-games returning Promises.
- `js/story.js`: the whole flow as an `async` function chain (invitation, training, journey, tour, seven tasks, ending); owns state `S` (resources o/p/f/w, mini, safety, research, scenario) and scoring (35/10/5, endings S/A/B/C).
- `css/style.css`: ~330 lines, hand-written.
- Test hooks: `#day` (skip to Moon day), `?scenario=A|B|C`. A browser bot (outside the repo) plays every path and currently passes.
- Repo also now contains `stitch_moonbase_mission_game_ui/` (about 21 MB, mostly PNGs). It is served by Pages unless excluded.

Key design property: **the game flow is a single linear promise chain**. The Stitch design assumes a **hub with free navigation** (bottom dock, base map, "Return to Base HQ" buttons on nearly every screen). That is the largest architectural gap.

---

## 4. Reusable exported code and assets

**Reusable as-is**
- **Design tokens:** 47 colour tokens, identical on all 27 screens (primary `#00e5ff`, secondary `#feb300`, tertiary `#22ef7e`, error `#ffb4ab`, background `#101221`, plus the surface ladder). Easy to turn into CSS variables.
- **Typography:** Outfit only; scale defined in both DESIGN.md files.
- **Component patterns:** 3D arcade buttons (cyan/gold/coral with a bottom lip), pill badges, HUD gauge bars, rivet-corner panels, dialogue cards with mascot medallion, quest cards.
- **Layout pieces:** top mission HUD (Sol, O2, Power, Water, "SIMULATED MISSION"), simulated-values disclaimer strip, five-tab bottom dock (Explore, Base HQ, Rover, Research, Comms), isometric base map with hotspots.
- **Logic worth lifting:** training station and badge handlers (screen 4), base building data (7), exploration site data (11), solar wipe (12), ECLSS matcher (23), quest quiz handlers (23-27).
- **Copy:** "Simulated gameplay values, not real NASA measurements" strip is already designed in.

**Reference only (do not ship)**
- The 27 PNGs (21 MB total). Keep in a `design/` folder or leave out of the deployed site.

**Needs work before reuse**
- Custom CSS classes differ per screen (82 distinct names, e.g. `.arcade-cyan` vs `.arcade-shadow-gold`): needs consolidating.
- 16 slightly different Tailwind config blocks (colours match; other keys vary).
- Inline `onclick` handlers (about 120) and many duplicate element IDs, which will collide if screens share one page.

---

## 5. External dependencies

| Dependency | Where | Risk | Recommendation |
|---|---|---|---|
| Tailwind Play CDN (`cdn.tailwindcss.com?plugins=forms,container-queries`) | all 27 | Runtime compiler, needs internet, flash of unstyled content, not for production | Pre-build one static CSS file once; commit it |
| Google Fonts: Outfit | all 27 | Needs internet; privacy/latency | Self-host (woff2) |
| Google Fonts: Material Symbols Outlined (loaded twice per file) | all 27 | If it fails, icon names show as plain text (e.g. "rocket_launch") | Self-host a subset of the icons actually used |
| Images from `lh3.googleusercontent.com` (48 `<img>`, about 46 unique) | 20 screens | Hot-linked Stitch assets; may expire or be blocked; **could not be tested from this environment** | Download once, store in `assets/img/`, rewrite paths |
| NASA links (5) | 23-27 | Need verifying they still resolve | Check on the live web; keep the two required NASA links too |
| Web Audio / vibration | 1, 4, 5, 10, 13, 19 | Mostly mock toggles | Keep our real sound engine |

No other third-party scripts were found.

---

## 6. Missing or incomplete functionality

**Screens not in the export (needed to make the game complete)**
- Science Quest Hub (5 quest cards, locked/complete state)
- How to Play; Lore (menu items)
- Settings / Pause overlay (Pause button exists on every screen with no target)
- Certificate view / print / download / QR (buttons exist, no screen)
- Consequence/result card after each task (resources change + one fact)
- Hint / retry state for failed mini-games
- Mini-game screens for: launch Control Panel, Power Cable Puzzle, Moon Rock Collector, Safe Shelter Builder, Antenna aiming (the five requested mini-games are not designed in Stitch)
- Mobile layouts (no mobile screenshots)

**Incomplete interactions in the exports**
- No navigation between any screens; "Return to Base HQ" and dock links go nowhere.
- No shared state: resources, time, score, choices and weather do not carry over.
- No scoring, retry or attempts logic (our 5/3/2/1/0 attempt scoring is not represented).
- `alert()`/`confirm()` used as feedback in 8 files (14 calls).
- Evaluation and endings are static copies.

**Differences from the story document / current game (need your decision)**
1. **Suit Up (10):** Stitch is a 5-point inspection checklist; the story document and the requested mini-game are dress-up with a damage check.
2. **Return and Rest (14):** Stitch lists 7 different steps (Airlock Dust Vacuum, Suit Storage, Integrity Check, ECLSS Loop, Thermal Comfort, Power Shedding, Radiation Blast Shield) than the document's 7 (Enter airlock, Store equipment, Inspect suit, Check oxygen/temperature, Check electricity, Night protection, Sleeping quarters).
3. **Solar Particle Event (17):** Stitch offers 3 protocol choices (shelter / stay outdoors / ignore alert). The document's three choices are about supplies (move food/water, share evenly, turn off non-essentials) and says the player cannot keep exploring. Stitch's unsafe options also conflict with the safety rule.
4. **Normal Conditions (15):** Stitch adds "Choose Next Action". The document says nothing happens in this scenario.
5. **Resources:** Stitch HUD shows Oxygen, Power, Water (+ Rad Shield, + Health in DESIGN.md). The document and live game use Oxygen, Electricity, Food, Water. Food is missing from the HUD.
6. **Training content:** Stitch's five challenge questions differ from ours (e.g. "Why so many craters?"). Either is fine, but one set must be chosen.
7. **Scoring language:** XP everywhere vs the 50-point scale.
8. **Two DESIGN.md files** ("AstroPath Mission OS" and "A Day on the Moon Design System") are nearly identical in colours but differ in typography weights and component detail; one should be named the source of truth.
9. **Reading load:** Quest screens (23-27) are long scrolling pages with a lot of text. This is at odds with the earlier brief ("don't make it messy, too many words"). Consider collapsing the "Core Science Modules" text behind taps.

---

## 7. Navigation requirements

Proposed screen flow (hash routes, single page):

```
Menu → Invitation ─(decline)→ Standby ─→ Invitation
        │accept
        ▼
Training Hub → Level 1 … Level 5 → Training Passed
        ▼
Rocket Launch → Moon Landing → Base Hub  ◄──────────────┐
        │ "Begin routine"                                │
        ▼                                                │
   Task 1 → Task 2 → Task 3 → Task 4 → (Weather B at Task 5) → Task 5 →
   (Weather C before Task 6) → Task 6 → Task 7                (back to Hub between tasks)
        ▼
Mission Evaluation → Ending S/A/B/C → Certificate
        ├─ Replay mission
        ├─ Main menu
        └─ Science Quest Hub ↔ Quest 1…5 (optional, separate)
```

Rules to enforce:
- Tasks run in order 08:00 → 17:00; the Hub shows locked/current/done.
- Weather is randomised per play; A shows its screen only if we keep it (decision 4 above).
- Quest screens are reachable from the Menu and from every Ending, and **never change mission state**.
- Pause/Settings overlay available on every screen.
- Back buttons must not skip scoring or allow replaying a task for extra points.
- Browser Back/forward should behave sensibly (hash routing).

---

## 8. Recommended integration architecture

Keep the **existing vanilla JS architecture** (no framework, no change to game logic), and add a presentation layer:

1. **Design tokens** in one `css/tokens.css` (the 47 colours, fonts, radii, shadows).
2. **One static stylesheet** built once from the Stitch HTML with the Tailwind CLI (committed to the repo, no CDN at runtime). Optional: keep Tailwind class names from Stitch markup so the original designs port with minimal edits.
3. **Screen components**: each Stitch screen becomes an HTML template (or JS render function) in `js/screens/`, with ids made unique and inline `onclick` replaced by data attributes and event delegation. Keeps the Stitch markup intact.
4. **Router + state store**: a small hash router plus the existing state object `S`, saved to `localStorage` for "Resume". Screens read values from `S` instead of hard-coding.
5. **Reuse existing logic** (`training.js`, `minis.js`, scoring in `story.js`) and call it from the new screens. Mini-games not designed in Stitch get a Stitch-styled frame.
6. **Separate quests module**: `js/quests.js` with its own state; it must not import or modify the mission score.
7. **Self-hosted assets**: `assets/fonts/`, `assets/img/`, icon subset.
8. **Safe rollout**: add the new UI behind a switch (`?ui=stitch`) while the current UI stays default; no existing files overwritten until approved.

Why not "just drop the 27 HTML files in": they would be 27 disconnected pages with duplicate IDs, 27 copies of Tailwind config and no shared state.

---

## 9. Potential technical problems

- **Runtime CDN dependence** (Tailwind, fonts, images): demo breaks offline or if a URL expires. Biggest risk.
- **Icon font fallback:** failed font load shows raw ligature words.
- **Duplicate IDs and global functions** when merging screens (`toggleAudio`, `switchChallenge`, etc.).
- **Inline `onclick` (about 120)** limits clean event handling and testing.
- **`alert()` / `confirm()`** block the game and break on some embedded browsers; replace with in-game modals.
- **`window.location.reload()`** in the training screen's reset would wipe saved state.
- **Score integrity:** XP values and the Evaluation screen's fixed "Ending S" must be removed so the 50-point score and 4 endings stay calculated; add a test that quest play leaves the score unchanged.
- **Page weight:** about 1.0 MB of HTML overall (up to 80 KB per screen), plus 21 MB of PNGs in the repo; deploy only what the game needs.
- **Mobile:** only desktop screenshots exist; hub map and wide HUD must be re-checked at 360 to 390 px.
- **Accessibility and readability for ages 7-12:** small text sizes (60 uses of 8 to 11 px text classes), long science copy; confirm contrast and touch targets (48 px per design system).
- **Test suite:** the current bot relies on existing DOM ids and will need updating per phase.
- **Licensing/attribution:** Stitch-generated images and NASA content use: confirm acceptable for the hackathon and keep the "fictional/simulated" labelling.

---

## 10. Phased implementation plan (nothing started)

**Phase 0: Decisions and verification (no code changes)**
- Approve/answer the open decisions in section 6 (suit up, return steps, SPE choices, normal-conditions screen, resources, training questions, XP, which DESIGN.md).
- Open the 27 HTML files in a browser to confirm which interactions actually work (confirms section 2 statuses).
- Download the hot-linked images and fonts; confirm NASA links.

**Phase 1: Foundation**
- Tokens, built static CSS, self-hosted fonts/icons/images, base shell, HUD, hash router, state store + save. New UI behind `?ui=stitch`; classic UI unchanged.

**Phase 2: Front of game (screens 1-7)**
- Menu, Invitation (with decline loop), Training Hub, Training 1-5 (wired to existing training logic), Rocket Launch, Landing, Base Hub with free navigation.

**Phase 3: Seven tasks (screens 8-14)**
- Each task framed in Stitch style and wired to the existing mini-games; add result cards and retry/hint states; apply agreed design decisions (dress-up vs checklist, etc.).

**Phase 4: Weather, evaluation, endings (screens 15-22)**
- Scenarios A/B/C, dynamic evaluation (35/10/5), four calculated endings, certificate (print/save).

**Phase 5: NASA Science Quests (screens 23-27 + new hub)**
- Quest Hub, five quests, separate state, links to the NASA pages, automated test proving no effect on score or ending. Trim text for kids.

**Phase 6: QA and release**
- Desktop and mobile pass, accessibility, offline test, regression bot for all paths and scenarios, GitHub Pages deploy; then the DONKI real-data step once the API key is available.

Each phase ends with something playable, a test run, and a pause for your approval.

---

## 11. Questions that need your answer before Phase 1

1. Source of truth: use the "AstroPath Mission OS" or the "A Day on the Moon Design System" DESIGN.md?
2. Suit Up: Stitch checklist or dress-up game (your earlier requested mini-game)?
3. Return & Rest: Stitch's 7 steps or the document's 7 steps?
4. Solar Particle Event: keep the document's supply choices (and drop "stay outdoors/ignore"), or use Stitch's three protocol choices?
5. Normal Conditions: keep Stitch's extra "next action" screen, or leave scenario A uneventful as in the document?
6. Resources: show Oxygen, Power, Food, Water (document) and add a Radiation Shield only during the solar event?
7. XP: remove from the mission entirely and use badges only for Quests?
8. Ship the 27 PNGs in the deployed site, or move them to a reference-only folder?
