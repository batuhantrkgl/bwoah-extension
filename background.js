const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

browserAPI.runtime.onInstalled?.addListener(() => {
  console.log('[Bwoah] Extension installed or updated');
});

browserAPI.runtime.onStartup?.addListener(() => {
  console.log('[Bwoah] Service worker initialized on startup');
});

// Open newtab when clicking the extension icon
if (browserAPI.action?.onClicked) {
  browserAPI.action.onClicked.addListener(() => {
    const newTabUrl = browserAPI.runtime.getURL('newtab.html');
    browserAPI.tabs.create({ url: newTabUrl });
  });
}

// Dedicated proxy for r/F1Porn requests with fallback to pullpush archive
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request && request.action === 'fetchReddit') {
    (async () => {
      // 1. Try Reddit direct endpoint
      try {
        const res = await fetch('https://www.reddit.com/r/F1Porn/top.json?limit=100&t=month');
        if (res.ok) {
          const data = await res.json();
          const children = (data?.data?.children || []).filter(c => {
            const d = c?.data;
            return d && !d.removed_by_category && d.author !== '[deleted]' && d.selftext !== '[removed]' && d.selftext !== '[deleted]' && d.url;
          });
          if (children.length > 0) {
            sendResponse({ success: true, data: { data: { children } } });
            return;
          }
        }
      } catch (e) {
        // Direct reddit blocked or network error
      }

      // 2. Try PullPush Reddit Archive API for r/F1Porn
      try {
        const pullpushRes = await fetch('https://api.pullpush.io/reddit/search/submission/?subreddit=F1Porn&size=100');
        if (pullpushRes.ok) {
          const json = await pullpushRes.json();
          if (Array.isArray(json?.data) && json.data.length > 0) {
            const children = json.data
              .filter(item => 
                item &&
                !item.removed_by_category &&
                item.author !== '[deleted]' &&
                item.selftext !== '[removed]' &&
                item.selftext !== '[deleted]' &&
                item.is_robot_indexable !== false &&
                item.url
              )
              .map(item => ({
                data: {
                  title: item.title,
                  url: item.url,
                  is_gallery: false,
                  removed_by_category: item.removed_by_category,
                  author: item.author,
                  selftext: item.selftext
                }
              }));

            if (children.length > 0) {
              sendResponse({ success: true, data: { data: { children } } });
              return;
            }
          }
        }
      } catch (err) {
        console.warn('[Bwoah] r/F1Porn pullpush fallback error:', err.message);
      }

      sendResponse({ success: false, error: 'Could not fetch r/F1Porn images' });
    })();

    return true; // Keep message channel open for async response
  }
  return false;
});