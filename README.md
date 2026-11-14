# A Day on the Moon: Junior Astronaut Mission Trainer

NASA Space Apps Challenge project: an interactive learning experience about life on the Moon for ages 7-12 (and curious grown-ups).

**Story:** accept an invitation, pass 5 astronaut training levels, fly to the Moon, then live one day at a lunar base
(7 timed tasks, 3 story branches, 4 endings). All resource numbers are simulated, not real NASA measurements.

## Run it
- Live: open the site's front page. It opens the experience at `/experience/`.
- Locally: from this folder run `python3 -m http.server` and open `http://localhost:8000/`.

Handy URLs: `/experience/?demo=1` skips straight to the Moon base, and `?scenario=A|B|C` forces the space weather
(A normal, B power shortage, C solar particle event).

## Where things are
- **`experience/`**: the interactive learning experience (start here). The site's front page (`index.html`) sends visitors to it.
- **`legacy/`**: the first, simpler version with its own mini-games. Kept for reference at `/legacy/`.
- **`functions/`**: Cloudflare Pages Function that supplies the real space-weather data card.
- **`stitch_moonbase_mission_game_ui/`**: the original Google Stitch export (design reference).
- **`docs/`**: the Stitch integration audit.

See `experience/README.md` for how the experience is built, and `legacy/` for the first version (`legacy/js/` and `legacy/css/`).
