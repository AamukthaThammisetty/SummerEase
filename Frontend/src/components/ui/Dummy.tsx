import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { Button } from './button';

const Dummy = () => {
  const [screenshotUrl, setScreenshotUrl] = useState(null);

  const handleScreenshot = () => {
    html2canvas(document.body).then(function (canvas) {
      const dataUrl = canvas.toDataURL('image/png'); // Convert canvas to image URL
      // @ts-ignore
      setScreenshotUrl(dataUrl); // Store image URL to state for preview
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dummy Component</h1>
      <Button onClick={handleScreenshot}>Take Screenshot</Button>

      {screenshotUrl && (
        <div style={{ marginTop: '20px' }}>
          <h2>Screenshot Preview:</h2>
          <img
            src={screenshotUrl}
            alt="Screenshot Preview"
            style={{ maxWidth: '100%', border: '2px solid #000' }}
          />
        </div>
      )}
    </div>
  );
};

export default Dummy;
