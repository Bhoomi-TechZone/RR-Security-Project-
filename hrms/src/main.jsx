import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'
import { CompanyProvider } from './context/CompanyContext.jsx'

// Prevent mouse wheel from changing values in number inputs globally
document.addEventListener('wheel', () => {
  if (document.activeElement && document.activeElement.type === 'number') {
    document.activeElement.blur();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CompanyProvider>
        <App />
      </CompanyProvider>
    </BrowserRouter>
  </React.StrictMode>
)
