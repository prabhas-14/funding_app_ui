import React from 'react';
import { Routes, Route } from 'react-router-dom'; // BrowserRouter is in main.jsx
import Navbar from './navbar'; 
import MainPage from './pages/MainPage';
import HyperliquidPage from './pages/HyperliquidPage';
// BinancePage and BybitPage imports are removed
import styles from './App.module.css'; 

function App() {
  return (
    <>
      <Navbar />
      <div className={styles.pageContainer}> {/* Optional: for global page padding below navbar */}
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/hyperliquid" element={<HyperliquidPage />} />
          {/* Binance and Bybit routes removed */}
          {/* You can add a 404 Not Found page later if needed */}
          {/* <Route path="*" element={<div>Page Not Found</div>} /> */}
        </Routes>
      </div>
    </>
  );
}

export default App;
