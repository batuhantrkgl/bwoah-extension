# Privacy Policy for Bwoah! - Your F1 Homepage

**Last updated:** September 27, 2026

**Bwoah! - Your F1 Homepage** ("Bwoah!", "the extension", "we", "us") is an open-source browser extension developed for Formula 1 fans. We believe in complete transparency and strict user privacy.

This Privacy Policy explains how Bwoah! handles your data. **In short: Bwoah! does not collect, track, sell, or transmit any of your personal data.**

---

## 1. Information We Do NOT Collect

- We do **not** collect personal information (such as your name, email address, IP address, location, or device identifiers).
- We do **not** monitor, record, collect, or transmit your browsing history, keystrokes, bookmarks, or web activity.
- We do **not** use cookies, analytics packages, telemetry SDKs, advertising networks, or third-party tracking scripts.
- We do **not** require account registration or login.

---

## 2. Information Stored Locally on Your Device

Bwoah! uses the `chrome.storage.local` API exclusively to store your UI preferences and temporary cache files **locally on your device**. This data never leaves your computer and is not synced to external servers:

- **UI Preferences**:
  - Wallpaper blur toggle (`isBlurred`)
  - Dark vignette overlay toggle (`isDark`)
  - Race countdown visibility (`isCountdownVisible`)
  - Championship standings visibility (`showLeaderboards`)
  - Selected season year for standings lookup (`cachedSeasonYear`)
- **Cached Public API Data** (used to minimize network traffic and rate limits):
  - F1 race schedules and championship standings fetched from public APIs (cached locally for up to 24 hours)
  - List of high-resolution wallpaper image URLs fetched from Reddit r/F1Porn (cached locally for up to 1 hour)
  - Current wallpaper URL

You can clear this data at any time by clearing your browser's extension data or uninstalling the extension.

---

## 3. Network Requests and Third-Party Services

To provide up-to-date race schedules, championship points, and photography wallpapers, Bwoah! communicates directly from your browser with the following public endpoints:

1. **Jolpi / Ergast F1 API (`api.jolpi.ca`)**:
   - Purpose: Retrieve public Formula 1 calendar data, session times, driver standings, and constructor standings.
   - Privacy Policy: [Jolpi API Documentation](https://api.jolpi.ca/)

2. **Reddit API (`www.reddit.com`)**:
   - Purpose: Retrieve public post metadata and direct image links from the public `r/F1Porn` community.
   - Privacy Policy: [Reddit Privacy Policy](https://www.reddit.com/policies/privacy-policy)

3. **Image Content Delivery (e.g., `i.redd.it`, `preview.redd.it`, `i.imgur.com`)**:
   - Purpose: Load wallpaper images referenced in public Reddit posts directly into your new tab background.

No personal data, user tokens, or identifiers are attached to these network requests.

---

## 4. Permissions Disclosure

In accordance with the Chrome Web Store and Firefox Add-ons Developer Policies, Bwoah! requests the minimum necessary permissions:

- **`storage`**: Used solely to save your local UI preferences (blur, darkness, widget toggles) and cache public F1/wallpaper data locally on your computer.
- **`host_permissions` (`https://www.reddit.com/*`, `https://api.jolpi.ca/*`)**: Used solely to fetch public F1 championship schedules, standings, and wallpaper links.

---

## 5. Children's Privacy

Bwoah! does not collect any personal data from anyone, including children under the age of 13.

---

## 6. Open Source

Bwoah! is open-source software distributed under the MIT License. You can review the complete source code and verify our privacy practices on GitHub:
[https://github.com/batuhantrkgl/bwoah-extension](https://github.com/batuhantrkgl/bwoah-extension)

---

## 7. Changes to This Privacy Policy

If we make any changes to this Privacy Policy, we will update the "Last updated" date at the top of this document and note the changes in our repository's [CHANGELOG.md](CHANGELOG.md).

---

## 8. Contact

If you have questions, feedback, or concerns regarding this Privacy Policy, please open an issue on GitHub or reach out to:

- **GitHub Repository**: [https://github.com/batuhantrkgl/bwoah-extension/issues](https://github.com/batuhantrkgl/bwoah-extension/issues)
- **Email**: `batuhanturkoglu37@gmail.com`
