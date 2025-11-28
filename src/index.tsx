import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Try to find the embedded container first (for website integration)
// Look for containers with IDs: 'quote-and-book-now', 'wizard-container', or 'root'
const embeddedContainer = document.getElementById('quote-and-book-now') || 
                          document.getElementById('wizard-container') ||
                          document.getElementById('booking-wizard');
const rootContainer = document.getElementById('root');

if (embeddedContainer) {
  // Mount in the embedded container (for website integration)
  console.log('Mounting React app in embedded container:', embeddedContainer.id);
  const root = ReactDOM.createRoot(embeddedContainer);
  root.render(
    <React.StrictMode>
      <App embedded={true} />
    </React.StrictMode>
  );
} else if (rootContainer) {
  // Mount in root (default behavior for standalone app)
  console.log('Mounting React app in root container');
  const root = ReactDOM.createRoot(rootContainer);
root.render(
  <React.StrictMode>
      <App embedded={false} />
  </React.StrictMode>
);
} else {
  console.error('No container found for React app. Looking for #quote-and-book-now, #wizard-container, #booking-wizard, or #root');
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
