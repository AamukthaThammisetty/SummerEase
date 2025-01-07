// content.js
(function () {
  // Wait for html2canvas to be available
  function waitForHtml2Canvas() {
    return new Promise((resolve) => {
      if (window.html2canvas) {
        resolve();
      } else {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('html2canvas.min.js');
        script.onload = resolve;
        document.head.appendChild(script);
      }
    });
  }

  // Prevent multiple injections
  if (window.screenshotContentScriptInjected) {
    return;
  }
  window.screenshotContentScriptInjected = true;

  let isSelecting = false;
  let startX, startY, endX, endY;
  let selectionBox = null;

  function createSelectionBox() {
    selectionBox = document.createElement('div');
    selectionBox.style.position = 'fixed';
    selectionBox.style.border = '2px solid #4CAF50';
    selectionBox.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
    selectionBox.style.pointerEvents = 'none';
    selectionBox.style.zIndex = '10000';
    document.body.appendChild(selectionBox);
  }

  function updateSelectionBox() {
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);

    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
  }

  async function captureScreenshot() {
    await waitForHtml2Canvas();

    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);

    try {
      const canvas = await html2canvas(document.body, {
        x: left,
        y: top,
        width: width,
        height: height,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight
      });

      const dataUrl = canvas.toDataURL('image/png');
      chrome.runtime.sendMessage({
        action: "screenshotCaptured",
        dataUrl: dataUrl
      });
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      chrome.runtime.sendMessage({
        action: "error",
        message: "Failed to capture screenshot"
      });
    }
  }

  document.addEventListener('mousedown', (e) => {
    if (isSelecting) {
      startX = e.clientX;
      startY = e.clientY;
      createSelectionBox();
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (isSelecting && selectionBox) {
      endX = e.clientX;
      endY = e.clientY;
      updateSelectionBox();
    }
  });

  document.addEventListener('mouseup', () => {
    if (isSelecting && selectionBox) {
      isSelecting = false;
      captureScreenshot();
      document.body.removeChild(selectionBox);
      selectionBox = null;
    }
  });

  // Listen for messages and respond to confirm content script is active
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startSelection") {
      isSelecting = true;
      sendResponse({ status: "success" });
    }
    return true; // Keep the message channel open for async response
  });
})();
