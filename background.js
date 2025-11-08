console.log('Background script starting...');

// Cross-browser compatibility: Firefox uses 'browser', Chrome uses 'chrome'
// Both browsers support chrome.* API, so this works for both
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

chrome.runtime.onInstalled.addListener(() => {
  console.log('Bwoah extension installed/updated');
});

// Ensure service worker stays alive during critical operations
chrome.runtime.onStartup.addListener(() => {
  console.log('Browser started - service worker initialized');
});

// Handle messages from content/newtab scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchReddit') {
    console.log('Background: Fetching Reddit data...');
    
    // Fetch Reddit data from background script to bypass CORS
    fetch('https://www.reddit.com/r/F1Porn/top.json?limit=100&t=month', {
      headers: {
        'User-Agent': 'bwoah-extension/1.0'
      }
    })
      .then(response => {
        console.log('Background: Reddit API response status:', response.status);
        if (!response.ok) {
          throw new Error(`Reddit API returned ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Background: Successfully fetched Reddit data, posts:', data.data.children.length);
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        console.error('Background: Fetch error:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate async response
    return true;
  }
  
  // Unknown action
  return false;
});

console.log('Background service worker ready');