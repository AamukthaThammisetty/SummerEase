// Extracts the text content of the page
function extractText() {
  return document.body.innerText;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "extractText") {
    sendResponse({ text: extractText() });
  }
});
