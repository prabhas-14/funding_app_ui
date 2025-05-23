import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Navbar.module.css'; // Assuming Navbar.module.css exists

function Navbar() {
  return (
    <nav className={styles.navbar}>
      <ul className={styles.navList}>
        <li className={styles.navItem}>
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}
            end 
          >
            Market Overview
          </NavLink>
        </li>
        <li className={styles.navItem}>
          <NavLink 
            to="/hyperliquid"
            className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}
          >
            Hyperliquid Funding
          </NavLink>
        </li>
        {/* Binance and Bybit links removed */}
      </ul>
    </nav>
  );
}

export default Navbar;
