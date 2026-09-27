# Bwoah! - Your F1 Homepage 🏎️

[![Version](https://img.shields.io/badge/version-0.0.12-white.svg)](manifest.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Bwoah!** is a modern, privacy-focused browser extension that transforms your new tab into an interactive Formula 1 dashboard.

![Bwoah Preview](icons/Bwoah_Extension_Red-128.png)

## ✨ Features

- **Live Grand Prix Countdown**: Real-time countdown timer ticking down to upcoming practice sessions, qualifying, sprints, and races with local timezone conversion.
- **2026/Current Championship Standings**: Live Drivers and Constructors championship standings powered by Ergast / Jolpi F1 APIs with year-by-year historical lookup.
- **Dynamic Track & Circuit Maps**: High-definition circuit layout maps, lap statistics, and round data for every Grand Prix.
- **F1 Photography Wallpapers**: High-resolution race wallpapers rotating on every tab load.
- **Glassmorphic UI Controls**:
  - Background blur toggle
  - Darkness overlay toggle
  - Standings toggle
  - Search bar toggle (Google Search)
- **Accessible & Fast**: Full keyboard navigation, semantic HTML, ARIA compliance, and zero bloated libraries.
- **Cross-Browser**: Built for Chrome, Edge, Brave, and Firefox (Manifest V3).

## 🚀 Installation & Local Development

### Requirements
- [Bun](https://bun.sh/) (v1.0+) for tests and development tooling.
- Google Chrome, Chromium, Brave, Edge, or Mozilla Firefox.

### Load in Chrome / Chromium / Brave / Edge:
1. Clone the repository:
   ```bash
   git clone https://github.com/batuhantrkgl/bwoah-extension.git
   cd bwoah-extension
   ```
2. Open your browser and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `bwoah-extension` directory.

### Load in Mozilla Firefox:
1. Copy `manifest.firefox.json` over `manifest.json` (or use Firefox Developer Edition / Nightly).
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on...** and select `manifest.json`.

## 🧪 Testing

Run automated tests using Bun:
```bash
bun test
```

## 📦 Building Extension Zip Packages

To generate zip distributions for Chrome Web Store and Firefox Add-ons:
```bash
bun run build:zip
```

## 📄 License

This project is licensed under the [MIT License](LICENSE).
