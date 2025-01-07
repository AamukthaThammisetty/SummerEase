document.getElementById('captureBtn').addEventListener('click', () => {
  const errorDiv = document.getElementById('error');
  errorDiv.style.display = 'none';

  chrome.runtime.sendMessage({ action: "captureSelected" }, (response) => {
    if (chrome.runtime.lastError) {
      errorDiv.textContent = 'Failed to initialize screenshot capture. Please refresh the page and try again.';
      errorDiv.style.display = 'block';
    }
  });
});

document.getElementById('downloadBtn').addEventListener('click', () => {
  const preview = document.getElementById('preview');
  if (preview.src) {
    const a = document.createElement('a');
    a.href = preview.src;
    a.download = 'screenshot.png';
    a.click();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "screenshotCaptured") {
    const preview = document.getElementById('preview');
    preview.src = request.dataUrl;
    preview.style.display = 'block';
    document.getElementById('downloadBtn').style.display = 'block';
  }
});
