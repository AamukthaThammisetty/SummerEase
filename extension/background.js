// background.js
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureSelected") {
    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
      try {
        // Inject content script if not already injected
        await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['content.js']
        });

        // Send message to content script
        chrome.tabs.sendMessage(tabs[0].id, { action: "startSelection" }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Failed to send message:', chrome.runtime.lastError);
          }
        });
      } catch (error) {
        console.error('Failed to inject content script:', error);
      }
    });
  }
});
