# A Day on the Moon: Junior Astronaut Mission Trainer

**NASA Space Apps Challenge 2026 · Team AstroPath**

An interactive learning experience about life on the Moon, made for children aged 7 to 12 (and curious grown-ups).
It is not a game to win. It is a short, hands-on adventure where every step teaches something, with pictures, animation
and read-aloud buttons instead of long text.

> All mission numbers (oxygen, power, water, food) are **simulated**. They are not real NASA measurements.
> The certificate is a pretend certificate, not an official NASA award.

## The adventure

1. **Start** – Commander Nova welcomes you. One big button: START ADVENTURE.
2. **Ticket quiz** – 5 questions. Get **4 right (80%)** to earn your ticket to the Moon, or try again. You type your name and get a ticket picture to download.
3. **Gear check** – dress the astronaut with the right helmet, gloves, backpack and boots.
4. **Blast off** – hold the big button, then watch the countdown, engines and lift-off.
5. **Moon landing and base** – tap the pictures to learn about the base.
6. **One Moon day, 7 tasks** – health check, breakfast, suit up, exploration, solar panels, report to Earth, bedtime. Each one is a small hands-on activity (read a gauge, pick safe space food, choose where to explore, rub dust off solar panels, choose a report ...).
7. **Space weather** – one of three random events: all clear, a power shortage, or a solar storm.
8. **Ending and certificate** – your points (out of 50) decide one of four endings, and you get a certificate with your name to download.
9. **NASA Science Quests** – 5 optional quests. They never change the score or the ending.

**Score (50 points):** up to 35 for tasks and activities, up to 10 for how well you looked after oxygen, power, food and water, and up to 5 for safety.
Endings: 46 or more is S, 40 or more is A, 32 or more is B, and below that is C.

## Real NASA data and pictures

- **Space weather card** (solar storm event and the Solar Storm quest): recent solar flares from NASA's DONKI database. If NASA's service is down it falls back to NOAA, then to a clearly labelled example.
- **Real NASA photos**: each task has a "Real NASA photo" button (NASA Image and Video Library). A daily-picture function (`kind=apod`) is also available.
- The NASA API key stays on the server and is optional. Real data is for learning only and never changes the score.

## Run it

- **Live:** the site's front page sends visitors to `/experience/`.
- **Locally:** from this folder run `python3 -m http.server 8000` and open `http://localhost:8000/experience/`. No build step is needed to play.
- **Handy URLs:** `?demo=1` jumps to the Moon base. `?scenario=A|B|C` forces the weather (A normal, B power shortage, C solar storm).
- **Hosting:** Cloudflare Pages. The `main` branch is production. Every other branch gets a preview link.
- **NASA key (optional):** in Cloudflare, Pages project → Settings → Variables and Secrets, add a secret named `NASA_API_KEY`.

## Where things are

| Folder | What it is |
|---|---|
| `experience/` | The experience (start here). See `experience/README.md` for how it is built. |
| `functions/api/` | Cloudflare Pages Functions: `donki.js` (space weather) and `nasa.js` (NASA photos). |
| `legacy/` | The first, simpler version. Kept for reference at `/legacy/`. |
| `stitch_moonbase_mission_game_ui/` | The original Google Stitch design export (reference). |
| `docs/` | The Stitch integration audit. |

## Credits

Made by Team AstroPath for the NASA Space Apps Challenge. Designs started in Google Stitch. Space data and pictures come from NASA (DONKI, NASA Image and Video Library) and NOAA.
