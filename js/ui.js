import { storage } from "./storage.js";
import { showGrandPrixHub, renderGrandPrixHub } from "./schedule.js";
import { loadLeaderboard } from "./leaderboards.js";
import { refreshWallpaper } from "./images.js";

export function setupUI() {
  const overlay = document.getElementById('overlay');
  const countdownCard = document.getElementById('next-race-countdown');
  const driversLeaderboard = document.getElementById('drivers-leaderboard');
  const teamsLeaderboard = document.getElementById('teams-leaderboard');

  // Modal elements
  const settingsModal = document.getElementById('settings-modal');
  const settingsBtn = document.getElementById('settings-button');
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  const tabButtons = document.querySelectorAll('.settings-tab-btn');
  const tabContents = document.querySelectorAll('.settings-tab-content');

  // Toggle switch inputs
  const blurToggle = document.getElementById('setting-blur-toggle');
  const darknessToggle = document.getElementById('setting-darkness-toggle');
  const countdownToggle = document.getElementById('setting-countdown-toggle');
  const standingsToggle = document.getElementById('setting-standings-toggle');

  // 1. Initialize Appearance from Storage
  storage.get('isBlurred', false).then(isBlurred => {
    if (overlay) {
      overlay.style.backdropFilter = isBlurred ? 'blur(2px)' : 'none';
      overlay.style.webkitBackdropFilter = isBlurred ? 'blur(2px)' : 'none';
    }
    if (blurToggle) blurToggle.checked = Boolean(isBlurred);
  });

  blurToggle?.addEventListener('change', async (e) => {
    const isBlurred = e.target.checked;
    if (overlay) {
      overlay.style.backdropFilter = isBlurred ? 'blur(2px)' : 'none';
      overlay.style.webkitBackdropFilter = isBlurred ? 'blur(2px)' : 'none';
    }
    await storage.set('isBlurred', isBlurred);
  });

  storage.get('isDark', false).then(isDark => {
    if (overlay) overlay.style.background = isDark ? 'rgba(0, 0, 0, 0.65)' : 'none';
    if (darknessToggle) darknessToggle.checked = Boolean(isDark);
  });

  darknessToggle?.addEventListener('change', async (e) => {
    const isDark = e.target.checked;
    if (overlay) overlay.style.background = isDark ? 'rgba(0, 0, 0, 0.65)' : 'none';
    await storage.set('isDark', isDark);
  });

  // 2. Initialize Widgets from Storage
  storage.get('isCountdownVisible', true).then(visible => {
    if (countdownCard) countdownCard.style.display = visible ? 'inline-flex' : 'none';
    if (countdownToggle) countdownToggle.checked = Boolean(visible);
  });

  countdownToggle?.addEventListener('change', async (e) => {
    const visible = e.target.checked;
    if (countdownCard) countdownCard.style.display = visible ? 'inline-flex' : 'none';
    await storage.set('isCountdownVisible', visible);
  });

  storage.get('showLeaderboards', true).then(visible => {
    if (driversLeaderboard) driversLeaderboard.style.display = visible ? 'flex' : 'none';
    if (teamsLeaderboard) teamsLeaderboard.style.display = visible ? 'flex' : 'none';
    if (standingsToggle) standingsToggle.checked = Boolean(visible);
  });

  standingsToggle?.addEventListener('change', async (e) => {
    const visible = e.target.checked;
    if (driversLeaderboard) driversLeaderboard.style.display = visible ? 'flex' : 'none';
    if (teamsLeaderboard) teamsLeaderboard.style.display = visible ? 'flex' : 'none';
    await storage.set('showLeaderboards', visible);
  });

  // 3. Settings Modal Open/Close & Tabs
  function openSettings(tabName = null) {
    if (!settingsModal) return;
    settingsModal.style.display = 'flex';
    settingsBtn?.classList.add('active');
    settingsBtn?.setAttribute('aria-expanded', 'true');

    // Close race schedule if open
    const schedule = document.getElementById('race-schedule');
    if (schedule) schedule.style.display = 'none';

    if (tabName) switchSettingsTab(tabName);
  }

  function closeSettings() {
    if (!settingsModal) return;
    settingsModal.style.display = 'none';
    settingsBtn?.classList.remove('active');
    settingsBtn?.setAttribute('aria-expanded', 'false');
  }

  function switchSettingsTab(tabName) {
    tabButtons.forEach(btn => {
      const match = btn.getAttribute('data-tab') === tabName;
      btn.classList.toggle('active', match);
      btn.setAttribute('aria-selected', String(match));
    });

    tabContents.forEach(content => {
      const match = content.id === `tab-${tabName}`;
      content.style.display = match ? 'flex' : 'none';
      content.classList.toggle('active', match);
    });
  }

  settingsBtn?.addEventListener('click', () => openSettings());
  closeSettingsBtn?.addEventListener('click', () => closeSettings());

  settingsModal?.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      closeSettings();
    }
  });

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (tab) switchSettingsTab(tab);
    });
  });

  // 4. Grand Prix Hub Interaction & Tab Delegation
  document.getElementById('schedule-button')?.addEventListener('click', () => {
    closeSettings();
    showGrandPrixHub('sessions');
  });

  document.getElementById('race-schedule')?.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.hub-tab-btn');
    if (!tabBtn) return;
    const targetTab = tabBtn.getAttribute('data-hub-tab');
    if (targetTab) {
      renderGrandPrixHub(targetTab);
    }
  });

  document.getElementById('track-button')?.addEventListener('click', () => {
    closeSettings();
    showGrandPrixHub('circuit');
  });

  // 5. Search Mode
  const searchQuickBtn = document.getElementById('search-quick-button');
  const disableSearchBtn = document.getElementById('disable-search-button');
  const controlsBar = document.getElementById('controls-bar');
  const searchContainer = document.getElementById('search-mode-container');
  const mainSearchInput = document.getElementById('main-search-input');

  function setSearchMode(enable) {
    if (enable) {
      closeSettings();
      if (controlsBar) controlsBar.style.display = 'none';
      if (searchContainer) searchContainer.style.display = 'flex';
      setTimeout(() => mainSearchInput?.focus(), 50);
    } else {
      if (searchContainer) searchContainer.style.display = 'none';
      if (controlsBar) controlsBar.style.display = 'flex';
    }
  }

  searchQuickBtn?.addEventListener('click', () => setSearchMode(true));
  disableSearchBtn?.addEventListener('click', () => setSearchMode(false));

  // 6. Next Wallpaper Button
  const refreshWallpaperBtn = document.getElementById('refresh-wallpaper-button');
  refreshWallpaperBtn?.addEventListener('click', () => {
    refreshWallpaper();
  });

  // 7. Year Button Event Delegation
  document.getElementById('year-selector-container')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.year-button');
    if (!btn) return;
    const year = Number(btn.getAttribute('data-year'));
    if (year) {
      loadLeaderboard(year);
    }
  });

  // 8. Global Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    const isInputActive = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);

    if (!isInputActive) {
      // '/' or Cmd+K / Ctrl+K opens search
      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setSearchMode(true);
        return;
      }
      // 'r' shuffles wallpaper
      if (e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey) {
        refreshWallpaper();
        return;
      }
      // 's' opens settings
      if (e.key.toLowerCase() === 's' && !e.metaKey && !e.ctrlKey) {
        openSettings();
        return;
      }
    }

    if (e.key === 'Escape') {
      const schedule = document.getElementById('race-schedule');
      if (schedule && schedule.style.display !== 'none') {
        schedule.style.display = 'none';
        document.getElementById('schedule-button')?.setAttribute('aria-expanded', 'false');
        document.getElementById('schedule-button')?.classList.remove('active');
      }
      if (settingsModal && settingsModal.style.display === 'flex') {
        closeSettings();
      }
      if (searchContainer && searchContainer.style.display === 'flex') {
        setSearchMode(false);
      }
    }
  });
}
