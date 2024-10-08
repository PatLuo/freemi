chrome.storage.sync.get(
  ["blockedUrls", "blocking"],
  ({ blockedUrls, blocking }) => {
    let oldCurrentUrl = window.location.href;

    const urlObject = new URL(oldCurrentUrl)
    let currentUrl = urlObject.hostname

    if (blocking) {
      if (blockedUrls && blockedUrls.some((url) => currentUrl.includes(url))) {
        // Get existing block counts or initialize it as an empty object
        chrome.storage.sync.get("blockCounts", (result) => {
          const blockCounts = result.blockCounts || {};

          // Increment the count for the normalized URL
          blockCounts[currentUrl] = (blockCounts[currentUrl] || 0) + 1;

          // Log the count to ensure it's being incremented.
          console.log(
            `Blocked ${currentUrl} ${blockCounts[currentUrl]} time(s).`
          );

          // Save the updated block count back to chrome.storage.sync
          chrome.storage.sync.set({ blockCounts });

          // Send a message to background.js to handle the redirection
          chrome.runtime.sendMessage({ action: "redirect" });
        });
      }
    }
  }
);
