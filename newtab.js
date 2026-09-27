/**
 * Bwoah! - Your F1 Homepage
 * Application Entry Point
 */

import { setupUI } from "./js/ui.js";
import { displayRandomImage } from "./js/images.js";
import { initScheduleAndCountdown } from "./js/schedule.js";
import { loadLeaderboard } from "./js/leaderboards.js";

async function initApp() {
  setupUI();
  await Promise.all([
    displayRandomImage().catch(e => console.error('[Bwoah] Wallpaper error:', e)),
    initScheduleAndCountdown().catch(e => console.error('[Bwoah] Countdown error:', e)),
    loadLeaderboard().catch(e => console.error('[Bwoah] Leaderboard error:', e))
  ]);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}