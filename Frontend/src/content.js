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
