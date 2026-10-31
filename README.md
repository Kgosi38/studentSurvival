# 🎓 Student Survival

A free, installable web app that helps students manage money, deadlines and study time in one place. It works on any phone, saves your data on your device, and keeps working offline.

**Live app:** https://student-survival-sa.netlify.app

## Features

### 💰 Budget Tracker
- Add income and expenses with categories (Food, Transport, Data & Airtime, Rent, Study, Fun, Other)
- Live balance
- Daily average spend
- **Days until broke** countdown based on your spending habits
- "Where your money goes" chart, sorted from biggest to smallest

### 📅 Deadline Tracker
- Add assignments, tests and due dates
- Automatically sorted with the most urgent first
- Colour-coded countdowns: red (due within a day, or overdue), orange (within a week), green (more than a week away)

### 📚 Study Planner
- Plan study sessions by subject, day and duration
- Tick sessions off and track weekly progress with a progress bar
- Start a new week with one tap
- **Focus timer** with presets (15, 25, 45, 60 minutes) and a custom time that is remembered on your device

### Extras
- Dark mode and light mode, remembered between visits
- Mobile-first, responsive design
- Installable as an app (PWA) on Android and iPhone
- Works offline after the first visit

## Tech stack
- HTML, CSS and vanilla JavaScript (no frameworks)
- `localStorage` for saving data on the user's device
- Service worker and web app manifest for offline use and installation
- Hosted on Netlify

## Project structure
```
studentSurvival/
├── index.html        # Page structure
├── style.css         # Styling and themes
├── app.js            # App logic for all tools
├── sw.js             # Service worker (offline caching)
├── manifest.json     # PWA settings
└── android-chrome-*  # App icons
```

## Run it locally
1. Clone the repository:
   ```
   git clone https://github.com/Kgosi38/studentSurvival.git
   ```
2. Open the folder in [Visual Studio Code](https://code.visualstudio.com/).
3. Install the **Live Server** extension.
4. Right-click `index.html` and choose **Open with Live Server**.

## Install on your phone
- **Android (Chrome):** open the live link, then tap **⋮ → Install app**
- **iPhone (Safari):** open the live link, then tap **Share → Add to Home Screen**

## Updating the live site
1. Make your changes and test locally.
2. Increase the cache version in `sw.js` (for example `student-survival-v3` to `student-survival-v4`) so users receive the update.
3. Re-deploy the folder on Netlify.

## Privacy
All your data is stored only in your own browser using `localStorage`. Nothing is sent to a server. Clearing your browser data will erase it.

## Roadmap
- [ ] Onboarding screen for new users
- [ ] Export and backup of data
- [ ] Optional accounts and cloud sync
- [ ] Notifications for upcoming deadlines
- [ ] Monthly budget goals

## Author
Built by **Kgosi** as a learning project, with feedback from fellow students.

Feedback and ideas are welcome. Open an issue on GitHub.
