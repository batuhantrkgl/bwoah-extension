# Changelog

## [0.0.9] - 2026-01-29

### 🎨 UI Modernization & Glassmorphism
- **Complete Visual Overhaul**: Adopted a sleek "Glassmorphism" design language with blurred backdrops, semi-transparent panels, and refined spacing.
- **Refined Controls Bar**: 
  - Swapped the "Others" menu behavior: it now seamlessly replaces the main controls bar instead of floating above it.
  - Lifted the controls bar significantly ("up, very") for a more balanced aesthetic.
  - Added new **Launch Animations** and smoother transitions.
- **Dynamic Layout**: Improved responsiveness and padding (32px margins) to ensure content breathes on all screen sizes.

### ⚡ New Features
- **Toggleable Race Countdown**: Added a "visibility" eye button in the "Others" menu to hide/show the central Next Race Countdown card.
- **Improved Leaderboards**: 
  - Full-height leaderboards for Drivers and Constructors (no more pagination needed for desktop).
  - Consistent vertical alignment and single-line typography.

### 🐛 Bug Fixes & Technical Improvements
- **API Fix**: Switched default track query from `pre-season-testing` to `bahrain` to resolve API 500 errors.
- **Code Cleanup**: Removed massive chunks of legacy code, duplicate listeners, and redundant HTML injection logic.
- **Performance**: Optimized event listeners and reduced layout thrashing during menu toggles.

## [0.0.7] - 2025-11-08

### 🎉 New Features
- **Reddit Integration**: Added r/F1Porn subreddit as an image source for stunning high-quality F1 photography
  - Fetches top 100 posts from the past month
  - Supports direct image links from Reddit (i.redd.it) and Imgur
  - Automatic intelligent filtering for image posts only

### 🔧 Improvements
- **Enhanced Caching System**: 
  - Implemented smart GitHub image caching (24-hour retention)
  - Added Reddit image caching (1-hour retention)
  - Graceful fallback to cached images when API rate limits are exceeded
  - No more error notifications when GitHub API rate limit is hit
  
- **Better Error Handling**:
  - Silent rate limit handling - uses cached data instead of showing errors
  - Retry mechanism with exponential backoff for service worker connections
  - Improved stability when fetching images from multiple sources

- **Background Service Worker**:
  - Added background script to bypass CORS restrictions for Reddit API
  - Better service worker lifecycle management
  - Enhanced logging for easier debugging

### 🐛 Bug Fixes
- Fixed CORS policy errors when fetching Reddit images
- Resolved "Could not establish connection" errors on extension startup
- Fixed GitHub API rate limit causing extension errors and notifications
- Improved cache persistence across browser sessions

### 🔐 Permissions
- Added `storage` permission for better cache management
- Added `host_permissions` for Reddit API access (https://www.reddit.com/*)

### 📝 Technical Changes
- Updated manifest to v3 compliance standards
- Improved background script message handling
- Enhanced localStorage usage for image caching
- Better separation of GitHub and Reddit image sources

---

## [0.0.6] - Previous Release
- Base functionality with GitHub image integration
- Race schedules and leaderboards
- Driver and team standings

---

## Marketplace Description Update

### What's New in v0.0.7

**More F1 Images Than Ever!** 🏎️

We've integrated Reddit's r/F1Porn community (the premier subreddit for high-quality F1 photography) as an additional image source. Now you'll see a beautiful rotation of:
- Professional race photography from Reddit's F1 community
- Historical F1 moments and legendary drivers
- Current season action shots and team photos
- Your existing GitHub image collection

**Smarter & More Reliable:**
- No more annoying error messages when API limits are reached
- Images are now cached intelligently, so you'll always have content
- Improved startup reliability and faster loading times
- Better handling of network conditions

**Technical Improvements:**
- Enhanced caching system keeps images available offline
- Background service worker ensures smooth API requests
- Automatic fallback to cached content during rate limits

Enjoy your enhanced F1 new tab experience! 🏁
