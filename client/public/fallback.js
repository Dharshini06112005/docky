// Fallback script for when main app fails to load
(function() {
  console.log('Fallback script loaded');
  
  // Check if main app loaded
  setTimeout(function() {
    const root = document.getElementById('root');
    const hasReactApp = window.React && root.children.length > 0 && 
                       root.children[0].id !== 'fallback';
    
    if (!hasReactApp) {
      console.log('Main app failed to load, showing fallback');
      showFallback();
    }
  }, 8000); // Increased timeout to 8 seconds
  
  function showFallback() {
    const root = document.getElementById('root');
    root.innerHTML = `
      <div style="
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        margin: 0;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          background: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          text-align: center;
          max-width: 500px;
        ">
          <h1 style="
            color: #805ad5;
            font-size: 2.5rem;
            margin-bottom: 1rem;
            letter-spacing: 2px;
          ">Docky</h1>
          <h2>Application Loading Issue</h2>
          <p>The application failed to load properly. This might be due to a temporary server issue.</p>
          <div style="margin-top: 20px;">
            <button onclick="window.location.reload()" style="
              background: #805ad5;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
              margin: 5px;
            ">Refresh Page</button>
            <button onclick="window.location.href='/'" style="
              background: #6b46c1;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
              margin: 5px;
            ">Go Home</button>
          </div>
        </div>
      </div>
    `;
  }
})(); 