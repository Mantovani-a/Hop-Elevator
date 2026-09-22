import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/tokens.css';
import './styles/global.css';
import './styles/components.css';
import './styles/map.css';
import './styles/operator.css';
import './styles/control.css';
import './styles/client.css';
import './styles/about.css';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
