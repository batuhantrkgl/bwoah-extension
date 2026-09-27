/**
 * Storage Abstraction with Chrome/Firefox and In-Memory Fallbacks
 */

const _memoryStorage = new Map();

export const storage = {
  async get(key, defaultValue = null) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get(key);
        return result[key] !== undefined ? result[key] : defaultValue;
      }
    } catch (e) {}
    try {
      if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(key);
        return val !== null ? JSON.parse(val) : defaultValue;
      }
    } catch (e) {}
    return _memoryStorage.has(key) ? _memoryStorage.get(key) : defaultValue;
  },

  async set(key, value) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ [key]: value });
      }
    } catch (e) {}
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.warn('[Bwoah] Storage write error:', e);
    }
    _memoryStorage.set(key, value);
  },

  async remove(key) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.remove(key);
      }
    } catch (e) {}
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (e) {}
    _memoryStorage.delete(key);
  }
};
