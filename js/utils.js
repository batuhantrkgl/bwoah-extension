/**
 * General Utilities & Formatting Functions
 */

import { TEAM_URL_SLUGS, CIRCUIT_SLUGS } from "./constants.js";

export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function sanitizeUrl(url) {
  if (!url) return '#';
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return url;
    }
  } catch (e) {}
  return '#';
}

export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function formatDate(date) {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'TBD';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  } catch (e) {
    return 'TBD';
  }
}

export function formatTime(date) {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
}

export const pad = (n) => String(Math.max(0, Math.floor(n))).padStart(2, '0');

export function getTeamUrlSlug(teamName) {
  if (!teamName) return "teams";
  return TEAM_URL_SLUGS[teamName] || teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function getDriverUrlSlug(driver) {
  if (!driver) return "drivers";
  const first = (driver.givenName || "").toLowerCase().trim();
  const last = (driver.familyName || "").toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Formula1.com URL slug overrides
  if (first === "alexander" && last === "albon") return "alex-albon";
  if (first === "guanyu" && last === "zhou") return "zhou-guanyu";
  if (first === "andrea kimi" || first === "kimi") return "kimi-antonelli";
  if (first === "oliver" && last === "bearman") return "ollie-bearman";
  if (last === "sainz") return "carlos-sainz";

  return `${first}-${last}`.replace(/[^a-z0-9]+/g, '-');
}

export function getCircuitImageUrl(raceName) {
  if (!raceName) return '';
  const lower = raceName.toLowerCase();
  for (const [key, slug] of Object.entries(CIRCUIT_SLUGS)) {
    if (lower.includes(key)) {
      return `https://media.formula1.com/image/upload/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/${slug}_Circuit.png`;
    }
  }
  return `https://media.formula1.com/image/upload/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/${raceName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_Circuit.png`;
}

export function parseResolutionFromTitle(title = "") {
  if (!title) return null;
  const match = title.match(/(?:[\[({]|\b)(\d{3,5})\s*[\u00d7xX*]\s*(\d{3,5})(?:[\])}]|\b)/);
  if (match) {
    const w = parseInt(match[1], 10);
    const h = parseInt(match[2], 10);
    if (!isNaN(w) && !isNaN(h)) {
      return { width: w, height: h };
    }
  }
  return null;
}

export function isHighResolution(width, height) {
  // Desktop wallpaper standard: Minimum Full HD (1920 width) & Landscape
  return typeof width === 'number' && typeof height === 'number' && width >= 1920 && width >= height;
}
