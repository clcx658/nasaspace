# A Day on the Moon: Junior Astronaut Mission Trainer

NASA Space Apps Challenge project: an interactive learning experience about life on the Moon for ages 7-12 (and curious grown-ups).

**Story:** accept an invitation, pass 5 astronaut training levels, fly to the Moon, then live one day at a lunar base
(7 timed tasks, 3 story branches, 4 endings). All resource numbers are simulated, not real NASA measurements.

## Run it
Open `index.html` in a browser. No build step, no dependencies.

Handy URLs for testing and demos:
- `index.html#day` skips straight to the Moon day
- `index.html?scenario=A|B|C` forces the space weather (A normal, B power shortage, C solar particle event)

## Files
- `js/core.js` shared state, sound, dashboard meters
- `js/training.js` the 5 training levels
- `js/minis.js` the hands-on activities
- `js/story.js` story flow, branches, scoring and endings
- `css/style.css` styles

## Two versions
- **Original version** (this folder, `index.html`): the first interactive build, with its own simple design.
- **Stitch design version** (`experience/`): the same story built on the 27 Google Stitch screens, with a learning layer, optional hands-on activities, and the NASA Science Quests. See `experience/README.md`.
