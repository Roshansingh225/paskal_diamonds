import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { AuthPromptProvider } from './context/AuthPromptContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AuthPromptProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthPromptProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
