// Extracts the text content of the page
function extractText() {
  return document.body.innerText;
}

// Listen for messages from the popup
//@ts-ignore
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "extractText") {
    sendResponse({ text: extractText() });
  }
});

//@ts-ignore
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureScreenshot') {
    chrome.tabs.captureVisibleTab({ format: 'png' }, (screenshotUrl) => {
      if (screenshotUrl) {
        sendResponse({ screenshotUrl });
      } else {
        sendResponse({ error: 'Failed to capture screenshot.' });
      }
    });
    return true;  // Indicates asynchronous response
  }
});


chrome.action.onClicked.addListener((tab) => {

  chrome.sidePanel.setOptions({
    path: "sidepanel.html",
    tabId: tab.id
  }).then(() => {
    console.log("Side panel opened.");
  }).catch((error) => {
    console.error("Error opening side panel:", error);
  });
});
