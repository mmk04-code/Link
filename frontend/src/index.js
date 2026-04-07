import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const API_ORIGIN = (process.env.REACT_APP_API_ORIGIN || 'http://127.0.0.1:8000').replace(/\/+$/, '');

axios.interceptors.request.use((config) => {
  if (typeof config.url === 'string') {
    config.url = config.url.replace(/^http:\/\/127\.0\.0\.1:8000/i, API_ORIGIN);
  }
  return config;
});

window.__API_ORIGIN__ = API_ORIGIN;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
