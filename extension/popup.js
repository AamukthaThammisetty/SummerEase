document.getElementById('capture-btn').addEventListener('click', async () => {
  // Capture the visible tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
    displayScreenshot(dataUrl);
  });
});

function displayScreenshot(dataUrl) {
  const screenshotContainer = document.getElementById('screenshot-container');
  screenshotContainer.innerHTML = ''; // Clear previous screenshot if any

  const img = document.createElement('img');
  img.src = dataUrl;
  img.alt = 'Screenshot Preview';
  img.style.maxWidth = '100%';
  img.style.border = '2px solid #000';

  // Add download button
  const downloadButton = document.createElement('button');
  downloadButton.innerText = 'Download Screenshot';
  downloadButton.style.marginTop = '10px';
  downloadButton.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'screenshot.png';
    link.click();
  });

  screenshotContainer.appendChild(img);
  screenshotContainer.appendChild(downloadButton);
}
