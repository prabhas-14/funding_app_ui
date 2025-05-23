import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from '../App.module.css'; // Import the CSS Module

// --- Icons ---
const ArrowUpIcon = ({ className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" 
       className={className} style={{width: '1em', height: '1em', display: 'inline-block'}}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
  </svg>
);
const ArrowDownIcon = ({ className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" 
       className={className} style={{width: '1em', height: '1em', display: 'inline-block'}}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
  </svg>
);
const SortIcon = ({ className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" 
       className={className} style={{width: '1em', height: '1em', opacity: 0.5, display: 'inline-block'}}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
  </svg>
);
const ClockIconSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" 
       style={{width: '1.25em', height: '1.25em', display:'inline-block', marginRight: '0.25rem'}}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
const SearchIconSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" 
       className={styles.searchIcon}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);
const ClearIconSVG = ({ onClick, className = "" }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth={1.5} 
        stroke="currentColor" 
        className={className} 
        onClick={onClick}
        style={{ width: '1.25em', height: '1.25em', cursor: 'pointer' }}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

// API URL for Hyperliquid data (assuming this component is for Hyperliquid)
//const API_URL = 'http://127.0.0.1:5001/api/funding-data'; 
// If deployed, use your deployed API URL:
const API_URL = 'https://funding-app-api.onrender.com/api/funding-data'


function App() { // Assuming this App.jsx is effectively HyperliquidPage.jsx
  const [allMarketData, setAllMarketData] = useState([]);
  const [topFundingData, setTopFundingData] = useState([]); // Re-added topFundingData state
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [timeToNextReset, setTimeToNextReset] = useState({ minutes: 0, seconds: 0 });
  const [isLoading, setIsLoading] = useState(true); 
  const [apiError, setApiError] = useState(null);
  
  const [filterTerm, setFilterTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'market', direction: 'ascending' });

  const fetchData = useCallback(async () => { 
    setIsLoading(true);
    setApiError(null);
    console.log("Fetching Hyperliquid funding data from API...");
    
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      }
      const data = await response.json();
      
      const investmentAmount = 100; 

      const processMarketData = (marketArray) => {
        if (!Array.isArray(marketArray)) return [];
        return marketArray.map(item => {
          const aprPercentage = (typeof item.apr === 'number') ? item.apr : 0; 
          
          const yearlyEarning = investmentAmount * (aprPercentage / 100);
          const monthlyEarning = yearlyEarning / 12;
          const dailyEarning = yearlyEarning / 365;
          const hourlyEarning = dailyEarning / 24; 

          return {
            ...item,
            earnings_1h: hourlyEarning,
            earnings_1d: dailyEarning,
            earnings_1mo: monthlyEarning,
            earnings_1y: yearlyEarning,
          };
        });
      };
      
      const allMarkets = processMarketData(data.all_markets);
      const topOpportunities = processMarketData(data.top_funding_opportunities); // Process top opportunities as well
      
      setAllMarketData(allMarkets);
      setTopFundingData(topOpportunities); // Set topFundingData
      
      if (data.last_updated_timestamp) {
        setLastUpdated(new Date(data.last_updated_timestamp * 1000));
      } else {
        setLastUpdated(new Date());
      }

    } catch (error) {
      console.error("Failed to fetch Hyperliquid funding data:", error);
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchData(); 
    const intervalId = setInterval(fetchData, 10000); 
    return () => clearInterval(intervalId); 
  }, [fetchData]);

  useEffect(() => {
    const calculateTimeToReset = () => {
      const now = new Date();
      const currentUTCHours = now.getUTCHours();
      const nextUTCHourTimestamp = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), currentUTCHours + 1, 0, 0, 0);
      let diff = nextUTCHourTimestamp - now.getTime();

      if (diff <= 0) {
        const followingUTCHourTimestamp = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), currentUTCHours + 2, 0, 0, 0);
        diff = followingUTCHourTimestamp - now.getTime();
      }
      if (diff <=0) { 
         setTimeToNextReset({ minutes: 0, seconds: 0 });
         return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      setTimeToNextReset({ minutes: Math.floor((totalSeconds / 60) % 60), seconds: Math.floor(totalSeconds % 60) });
    };
    calculateTimeToReset();
    const timerId = setInterval(calculateTimeToReset, 1000);
    return () => clearInterval(timerId);
  }, []);

  const sortedAndFilteredData = useMemo(() => {
    let sortableItems = [...allMarketData];
    if (filterTerm) {
      sortableItems = sortableItems.filter(item =>
        item.market && item.market.toLowerCase().includes(filterTerm.toLowerCase())
      );
    }
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        const numericSortKeys = ['hourly_percentage', 'apr', 'volume_24h', 'open_interest', 'earnings_1h', 'earnings_1d', 'earnings_1mo', 'earnings_1y'];
        if (numericSortKeys.includes(sortConfig.key)) {
            valA = parseFloat(a[sortConfig.key]);
            valB = parseFloat(b[sortConfig.key]);
        } else if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }
        
        if (valA == null && valB == null) return 0;
        if (valA == null) return sortConfig.direction === 'ascending' ? -1 : 1; 
        if (valB == null) return sortConfig.direction === 'ascending' ? 1 : -1;
        
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [allMarketData, filterTerm, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <SortIcon />;
    return sortConfig.direction === 'ascending' ? <ArrowUpIcon /> : <ArrowDownIcon />;
  };
  
  const handleClearFilter = () => {
    setFilterTerm('');
  };

  const mainTableHeaders = [
    { key: 'market', label: 'Market', sortable: true },
    { key: 'hourly_percentage', label: 'Hourly %', className: styles.textRight, sortable: true },
    { key: 'apr', label: 'APR %', className: styles.textRight, sortable: true },
    { key: 'earnings_1h', label: '$100/1h', className: styles.textRight, sortable: true },
    { key: 'earnings_1d', label: '$100/1d', className: styles.textRight, sortable: true },
    { key: 'earnings_1mo', label: '$100/30d', className: styles.textRight, sortable: true },
    { key: 'earnings_1y', label: '$100/1y', className: styles.textRight, sortable: true },
    { key: 'volume_24h', label: 'Volume (24h)', className: styles.textRight, sortable: true },
    { key: 'open_interest', label: 'Open Interest', className: styles.textRight, sortable: true }
  ];
  
  const top5TableHeaders = [ // Re-added headers for Top 5 section
    { key: 'market', label: 'Market', sortable: false }, 
    { key: 'hourly_percentage', label: 'Hourly %', className: styles.textRight, sortable: false },
    { key: 'apr', label: 'APR %', className: styles.textRight, sortable: false },
    { key: 'earnings_1h', label: '$100/1h', className: styles.textRight, sortable: false },
  ];


  return (
    <div className={styles.dashboardContainer} style={{paddingTop: '0'}}> 
      <header className={styles.header}>
        <h1 className={styles.title} style={{fontSize: '1.8rem', marginBottom: '0.5rem'}}>Hyperliquid Funding Rates</h1>
      </header>

      {apiError && (
        <div className={styles.errorMessage}>
          <p className={styles.errorMessageStrong}>Error fetching data:</p>
          <p className={styles.errorMessageSmall}>{apiError}</p>
        </div>
      )}

      {/* Main content area - will now stack cards vertically */}
      <div className={styles.contentArea}> {/* New wrapper for all content cards */}
        
        <div className={`${styles.card} ${styles.timerCard} ${styles.contentCard}`}> {/* Added contentCard class */}
          <h2 className={styles.cardTitle}><ClockIconSVG /> Next Funding Reset:</h2>
          <p className={styles.timerText}>
            {String(timeToNextReset.minutes).padStart(2, '0')}:
            {String(timeToNextReset.seconds).padStart(2, '0')}
          </p>
        </div>

        {/* Top 5 Opportunities Card RE-ADDED */}
        <div className={`${styles.card} ${styles.contentCard}`}> {/* Added contentCard class */}
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Top 5 Opportunities</h2>
            {isLoading && !topFundingData.length && <div className={styles.loadingText}>Updating...</div>}
          </div>
          {topFundingData.length === 0 && !isLoading && !apiError ? (
            <p style={{padding: '1rem', textAlign: 'center'}}>No positive rates.</p>
          ) : topFundingData.length === 0 && isLoading ? (
            <p style={{padding: '1rem', textAlign: 'center'}}>Loading top rates...</p>
          ): (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {top5TableHeaders.map(header => (
                      <th key={header.key} className={header.className || ''}>{header.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topFundingData.map((item, index) => (
                    <tr key={item.market + index + '-top'}>
                      <td className={styles.marketName}>{item.market}</td>
                      <td className={`${styles.textRight} ${styles.monoFont} ${item.hourly_percentage > 0 ? styles.positiveRate : styles.negativeRate}`}>
                        {item.hourly_percentage != null ? item.hourly_percentage.toFixed(4) : 'N/A'}%
                      </td>
                      <td className={`${styles.textRight} ${styles.monoFont} ${styles.aprColor}`}>
                        {item.apr != null ? item.apr.toFixed(2) : 'N/A'}%
                      </td>
                      <td className={`${styles.textRight} ${styles.monoFont} ${item.earnings_1h >= 0 ? styles.positiveRate : styles.negativeRate}`}>
                        ${item.earnings_1h != null ? item.earnings_1h.toFixed(4) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* All Markets Card */}
        <div className={`${styles.card} ${styles.contentCard}`}> {/* Added contentCard class */}
          <div className={styles.cardHeader} style={{marginBottom: '0.75rem'}}>
             <div className={styles.allMarketsHeader}>
                <h2 className={`${styles.cardTitle} ${styles.allMarketsTitle}`}>All Markets</h2>
                <div className={styles.filterInputContainer}>
                    <SearchIconSVG />
                    <input
                    type="text"
                    placeholder="Filter markets..."
                    className={styles.filterInput}
                    value={filterTerm}
                    onChange={(e) => setFilterTerm(e.target.value)}
                    />
                    {filterTerm && (
                        <ClearIconSVG 
                            onClick={handleClearFilter} 
                            className={styles.clearButtonIcon}
                        />
                    )}
                </div>
            </div>
          </div>
           {isLoading && !allMarketData.length && <div style={{textAlign: 'center', padding: '1rem'}} className={styles.loadingText}>Loading market data...</div>}
          
          {allMarketData.length === 0 && !isLoading && !apiError ? (
             <p style={{padding: '1.5rem', textAlign: 'center'}}>No market data available.</p>
          ) : (
            <div className={styles.allMarketsTableContainer}>
              <table className={styles.table}>
                <thead >
                  <tr>
                    {mainTableHeaders.map(header => (
                      <th
                        key={header.key}
                        className={`${styles.sortableHeader} ${header.className || ''}`}
                        onClick={() => header.sortable && requestSort(header.key)}
                      >
                        {header.label}
                        {header.sortable && <span className={styles.sortIconContainer}>{getSortIcon(header.key)}</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedAndFilteredData.map((item, index) => (
                    <tr key={item.market + index + '-all'}>
                      <td className={styles.marketName}>{item.market}</td>
                      <td className={`${styles.textRight} ${styles.monoFont} ${item.hourly_percentage > 0 ? styles.positiveRate : (item.hourly_percentage < 0 ? styles.negativeRate : styles.neutralRate)}`}>
                        {item.hourly_percentage != null ? item.hourly_percentage.toFixed(4) : 'N/A'}%
                      </td>
                      <td className={`${styles.textRight} ${styles.monoFont} ${styles.aprColor}`}>
                        {item.apr != null ? item.apr.toFixed(2) : 'N/A'}%
                      </td>
                      <td className={`${styles.textRight} ${styles.monoFont} ${item.earnings_1h >= 0 ? styles.positiveRate : styles.negativeRate}`}>
                        ${item.earnings_1h != null ? item.earnings_1h.toFixed(4) : 'N/A'}
                      </td>
                      <td className={`${styles.textRight} ${styles.monoFont} ${item.earnings_1d >= 0 ? styles.positiveRate : styles.negativeRate}`}>
                        ${item.earnings_1d != null ? item.earnings_1d.toFixed(2) : 'N/A'}
                      </td>
                      <td className={`${styles.textRight} ${styles.monoFont} ${item.earnings_1mo >= 0 ? styles.positiveRate : styles.negativeRate}`}>
                        ${item.earnings_1mo != null ? item.earnings_1mo.toFixed(2) : 'N/A'}
                      </td>
                      <td className={`${styles.textRight} ${styles.monoFont} ${item.earnings_1y >= 0 ? styles.positiveRate : styles.negativeRate}`}>
                        ${item.earnings_1y != null ? item.earnings_1y.toFixed(2) : 'N/A'}
                      </td>
                       <td className={`${styles.textRight} ${styles.monoFont} ${styles.volumeColor}`}>
                        ${item.volume_24h != null ? item.volume_24h.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0}) : 'N/A'}
                      </td>
                      <td className={`${styles.textRight} ${styles.monoFont} ${styles.volumeColor}`}> 
                        ${item.open_interest != null ? item.open_interest.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0}) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sortedAndFilteredData.length === 0 && filterTerm && !apiError &&
                <p style={{padding: '1rem', textAlign: 'center'}}>No markets match your filter "{filterTerm}".</p>
              }
            </div>
          )}
        </div>
      </div> {/* End of .contentArea (or what was .layoutGrid) */}

      <p className={styles.footerText}>
        Last updated: {lastUpdated.toLocaleTimeString()} (Data auto-refreshes every 10s)
      </p>
      <p className={styles.disclaimerText}>
        Disclaimer: Funding rates are volatile. Data is for informational purposes only. Not financial advice.
      </p>
    </div>
  );
}

export default App;
