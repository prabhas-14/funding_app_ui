import React, { useState, useMemo, useCallback, useEffect } from 'react';
// Ensure this path is correct based on your file structure
import appStyles from '../App.module.css'; 

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
const SearchIconSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" 
       className={appStyles.searchIcon}> 
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
const StarIconSVG = ({ isFavorite, onClick, className = "" }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill={isFavorite ? "currentColor" : "none"} 
        stroke="currentColor" 
        strokeWidth="1.5" 
        className={className} 
        onClick={onClick}
        style={{ width: '1.25em', height: '1.25em', cursor: 'pointer' }}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.82.61l-4.725-2.885a.562.562 0 0 0-.652 0l-4.725 2.885a.562.562 0 0 1-.82-.61l1.285-5.385a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
);


// --- Sparkline Component ---
const Sparkline = ({ data, width = 100, height = 30, strokeColorPositive = "#34d399", strokeColorNegative = "#f87171" }) => {
  if (!data || data.length < 2) {
    return <div style={{ width, height, border: '1px solid #374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#6b7280' }}>No data</div>;
  }
  const yMin = Math.min(...data);
  const yMax = Math.max(...data);
  const yRange = yMax - yMin === 0 ? 1 : yMax - yMin; 
  const xStep = width / (data.length - 1);
  const points = data.map((point, i) => {
      const x = i * xStep;
      const y = height - ((point - yMin) / yRange) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`; 
    }).join(' ');
  let dynamicStrokeColor = strokeColorPositive; 
  if (data[data.length - 1] < data[0]) {
    dynamicStrokeColor = strokeColorNegative; 
  }
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <polyline fill="none" stroke={dynamicStrokeColor} strokeWidth="1.5" points={points}/>
    </svg>
  );
};

//const MARKET_OVERVIEW_API_URL = 'http://127.0.0.1:5001/api/market-overview';
//const MARKET_OVERVIEW_API_URL = 'https://funding-app-api.onrender.com/api/market-overview'
const MARKET_OVERVIEW_API_URL = 'https://funding-app-api-1vio.onrender.com/api/market-overview'

function MainPage() {
  const [allCoinsData, setAllCoinsData] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [filterTerm, setFilterTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'rank', direction: 'ascending' }); 
  const [favorites, setFavorites] = useState(new Set()); 

  const fetchMarketData = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    console.log("MainPage: Fetching market overview data from API...");
    try {
      const response = await fetch(MARKET_OVERVIEW_API_URL);
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      }
      const data = await response.json();
      setAllCoinsData(Array.isArray(data.all_coins) ? data.all_coins : []);
      if (data.last_updated_timestamp) {
        setLastUpdated(new Date(data.last_updated_timestamp * 1000));
      } else {
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("MainPage: Failed to fetch market overview data:", error);
      setApiError(error.message);
      setAllCoinsData([]); 
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData(); 
    const intervalId = setInterval(fetchMarketData, 60000); 
    return () => clearInterval(intervalId); 
  }, [fetchMarketData]);

  const toggleFavorite = useCallback((coinSymbol) => {
    setFavorites(prevFavorites => {
      const newFavorites = new Set(prevFavorites);
      if (newFavorites.has(coinSymbol)) {
        newFavorites.delete(coinSymbol);
      } else {
        newFavorites.add(coinSymbol);
      }
      return newFavorites;
    });
  }, []);

   useEffect(() => {
     try {
        const storedFavorites = localStorage.getItem('cryptoFavoritesMainPage');
        if (storedFavorites) {
            setFavorites(new Set(JSON.parse(storedFavorites)));
        }
     } catch (e) {
        console.error("Failed to parse favorites from localStorage", e);
        setFavorites(new Set()); 
     }
   }, []);

   useEffect(() => {
       try {
           localStorage.setItem('cryptoFavoritesMainPage', JSON.stringify(Array.from(favorites)));
       } catch (e) {
           console.error("Failed to save favorites to localStorage", e);
       }
   }, [favorites]);

  const handleClearFilter = () => {
    setFilterTerm('');
  };

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

  const sortedAndFilteredCoins = useMemo(() => {
    let processedCoins = [...allCoinsData]; 
    if (filterTerm) {
      processedCoins = processedCoins.filter(coin =>
        (coin.name && coin.name.toLowerCase().includes(filterTerm.toLowerCase())) ||
        (coin.symbol && coin.symbol.toLowerCase().includes(filterTerm.toLowerCase()))
      );
    }
    if (sortConfig.key) {
      processedCoins.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        const numericSortKeys = ['rank', 'price', 'price_change_percentage_1h', 'price_change_percentage_24h', 'price_change_percentage_7d', 'marketCapNum', 'circulatingSupplyNum', 'fdvNum', 'volume_24h'];
        if (numericSortKeys.includes(sortConfig.key)) {
            valA = parseFloat(a[sortConfig.key]); 
            valB = parseFloat(b[sortConfig.key]);
        } else if (typeof valA === 'string') { 
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return processedCoins;
  }, [allCoinsData, filterTerm, sortConfig]);

  const favoritedCoinsList = useMemo(() => {
    return allCoinsData.filter(coin => favorites.has(coin.symbol))
                       .sort((a,b) => a.rank - b.rank); 
  }, [allCoinsData, favorites]);

  const mainTableHeaders = [
    { key: 'favorite', label: '★', style: { width: '3%', paddingRight: '0.25rem', paddingLeft: '0.25rem' }, sortable: false, className: appStyles.textCenter },
    { key: 'rank', label: '#', style: { width: '5%', paddingRight: '0.25rem' } , className: appStyles.textLeft},
    { key: 'name', label: 'Name', style: { minWidth: '130px', maxWidth: '200px', whiteSpace: 'normal', wordBreak: 'break-word', paddingRight: '0.25rem' } , className: appStyles.textLeft},
    { key: 'price', label: 'Price', className: appStyles.textRight },
    { key: 'price_change_percentage_1h', label: '1h %', className: appStyles.textRight },
    { key: 'price_change_percentage_24h', label: '24h %', className: appStyles.textRight },
    { key: 'price_change_percentage_7d', label: '7d %', className: appStyles.textRight },
    { key: 'marketCapNum', label: 'Market Cap', className: appStyles.textRight }, 
    { key: 'circulatingSupplyNum', label: 'Circ. Supply', className: appStyles.textRight },
    { key: 'fdvNum', label: 'FDV', className: appStyles.textRight }, // Re-added FDV
    { key: 'volume_24h', label: 'Volume (24h)', className: appStyles.textRight },
    { key: 'sparkline_in_7d', label: 'Last 7 Days', className: appStyles.textCenter, style: { width: '100px' }, sortable: false }
  ];
  
  const favoriteTableHeaders = [ 
    { key: 'favorite', label: '★', style: { width: '3%' }, sortable: false, className: appStyles.textCenter },
    { key: 'rank', label: '#', style: { width: '5%' } , className: appStyles.textLeft},
    { key: 'name', label: 'Name', style: { minWidth: '130px'} , className: appStyles.textLeft},
    { key: 'price', label: 'Price', className: appStyles.textRight },
    { key: 'price_change_percentage_1h', label: '1h %', className: appStyles.textRight },
    { key: 'price_change_percentage_24h', label: '24h %', className: appStyles.textRight },
    { key: 'price_change_percentage_7d', label: '7d %', className: appStyles.textRight },
    { key: 'sparkline_in_7d', label: 'Last 7 Days', className: appStyles.textCenter, style: { width: '100px' }, sortable: false }
  ];


  return (
    <div className={appStyles.dashboardContainer} style={{paddingTop: '1rem'}}>
      <header className={appStyles.header}>
        <h1 className={appStyles.title}>Market Overview</h1>
        <p className={appStyles.subtitle}>Cryptocurrency prices, market cap, and more.</p>
      </header>

      {apiError && (
        <div className={appStyles.errorMessage}>
          <p className={appStyles.errorMessageStrong}>Error fetching market data:</p>
          <p className={appStyles.errorMessageSmall}>{apiError}</p>
        </div>
      )}

      {/* Favorites Section */}
      {favoritedCoinsList.length > 0 && !isLoading && (
        <div className={appStyles.card} style={{marginBottom: '1.5rem'}}>
          <div className={`${appStyles.cardHeader}`} style={{borderBottom: 'none', marginBottom: '1rem'}}>
            <h2 className={`${appStyles.cardTitle} ${appStyles.allMarketsTitle}`}>Favorites</h2>
          </div>
          <div className={appStyles.tableContainer}>
            <table className={appStyles.table}>
              <thead>
                <tr>
                  {favoriteTableHeaders.map(header => (
                    <th 
                      key={header.key + "-fav"} 
                      style={header.style} 
                      className={`${header.className || ''}`}
                    >
                      {header.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {favoritedCoinsList.map(coin => (
                  <tr key={coin.symbol + '-fav-row'}>
                    <td className={appStyles.textCenter}>
                      <StarIconSVG 
                        isFavorite={favorites.has(coin.symbol)} 
                        onClick={() => toggleFavorite(coin.symbol)}
                        className={favorites.has(coin.symbol) ? appStyles.favoritedStar : appStyles.favoriteIcon}
                      />
                    </td>
                    <td>{coin.rank}</td>
                    <td className={appStyles.marketName}>
                       {coin.image && <img src={coin.image} alt={coin.symbol} style={{width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'middle', borderRadius: '50%'}} />}
                      {coin.name} ({coin.symbol})
                    </td>
                    <td className={`${appStyles.textRight} ${appStyles.monoFont}`}>
                      ${coin.price != null ? coin.price.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits: (coin.price < 1 ? 4 : 2)}) : 'N/A'}
                    </td>
                    <td className={`${appStyles.textRight} ${coin.price_change_percentage_1h >= 0 ? appStyles.positiveRate : appStyles.negativeRate}`}>
                      {coin.price_change_percentage_1h != null ? coin.price_change_percentage_1h.toFixed(2) : 'N/A'}%
                    </td>
                    <td className={`${appStyles.textRight} ${coin.price_change_percentage_24h >= 0 ? appStyles.positiveRate : appStyles.negativeRate}`}>
                      {coin.price_change_percentage_24h != null ? coin.price_change_percentage_24h.toFixed(2) : 'N/A'}%
                    </td>
                     <td className={`${appStyles.textRight} ${coin.price_change_percentage_7d >= 0 ? appStyles.positiveRate : appStyles.negativeRate}`}>
                      {coin.price_change_percentage_7d != null ? coin.price_change_percentage_7d.toFixed(2) : 'N/A'}%
                    </td>
                    <td className={`${appStyles.textCenter} ${appStyles.sparklineCell}`}>
                      <div className={appStyles.sparklineSvgContainer}>
                        <Sparkline data={coin.sparkline_in_7d && coin.sparkline_in_7d.price ? coin.sparkline_in_7d.price : []} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* All Cryptocurrencies Market Section */}
      <div className={appStyles.card} style={{marginBottom: '1.5rem'}}>
        <div className={`${appStyles.cardHeader} ${appStyles.allMarketsHeader}`} style={{borderBottom: 'none', marginBottom: '1rem'}}>
          <h2 className={`${appStyles.cardTitle} ${appStyles.allMarketsTitle}`}>Cryptocurrency Market</h2> 
          <div className={appStyles.filterInputContainer}>
            <SearchIconSVG />
            <input
              type="text"
              placeholder="Filter coins..."
              className={appStyles.filterInput}
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
            />
            {filterTerm && (
              <ClearIconSVG 
                onClick={handleClearFilter} 
                className={appStyles.clearButtonIcon}
              />
            )}
          </div>
        </div>
        {isLoading && allCoinsData.length === 0 && <p style={{textAlign: 'center', padding: '1rem'}}>Loading market data...</p>}
        {!isLoading && allCoinsData.length === 0 && !apiError && <p style={{textAlign: 'center', padding: '1rem'}}>No market data available from API.</p>}
        
        {allCoinsData.length > 0 && (
            <div className={appStyles.tableContainer}>
            <table className={appStyles.table}>
                <thead>
                <tr>
                    {mainTableHeaders.map(header => (
                    <th 
                        key={header.key} 
                        style={header.style} 
                        className={`${header.className || ''} ${header.sortable !== false ? appStyles.sortableHeader : ''}`}
                        onClick={() => header.sortable !== false && requestSort(header.key)}
                    >
                        {header.label}
                        {header.sortable !== false && <span className={appStyles.sortIconContainer}>{getSortIcon(header.key)}</span>}
                    </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {sortedAndFilteredCoins.map(coin => (
                    <tr key={coin.id || coin.symbol}> 
                    <td className={appStyles.textCenter}>
                        <StarIconSVG 
                            isFavorite={favorites.has(coin.symbol)} 
                            onClick={() => toggleFavorite(coin.symbol)}
                            className={favorites.has(coin.symbol) ? appStyles.favoritedStar : appStyles.favoriteIcon}
                        />
                    </td>
                    <td>{coin.rank}</td>
                    <td className={appStyles.marketName}>
                        {coin.image && <img src={coin.image} alt={coin.symbol} style={{width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'middle', borderRadius: '50%'}} />}
                        {coin.name} ({coin.symbol})
                    </td>
                    <td className={`${appStyles.textRight} ${appStyles.monoFont}`}>
                        ${coin.price != null ? coin.price.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits: (coin.price < 1 ? 4 : 2)}) : 'N/A'}
                    </td>
                    <td className={`${appStyles.textRight} ${coin.price_change_percentage_1h >= 0 ? appStyles.positiveRate : appStyles.negativeRate}`}>
                        {coin.price_change_percentage_1h != null ? coin.price_change_percentage_1h.toFixed(2) : 'N/A'}%
                    </td>
                    <td className={`${appStyles.textRight} ${coin.price_change_percentage_24h >= 0 ? appStyles.positiveRate : appStyles.negativeRate}`}>
                        {coin.price_change_percentage_24h != null ? coin.price_change_percentage_24h.toFixed(2) : 'N/A'}%
                    </td>
                    <td className={`${appStyles.textRight} ${coin.price_change_percentage_7d >= 0 ? appStyles.positiveRate : appStyles.negativeRate}`}>
                        {coin.price_change_percentage_7d != null ? coin.price_change_percentage_7d.toFixed(2) : 'N/A'}%
                    </td>
                    <td className={`${appStyles.textRight} ${appStyles.monoFont}`}>{coin.marketCap}</td>
                    <td className={`${appStyles.textRight} ${appStyles.monoFont}`}>{coin.circulatingSupply}</td>
                    <td className={`${appStyles.textRight} ${appStyles.monoFont}`}>{coin.fdv}</td> 
                    <td className={`${appStyles.textRight} ${appStyles.monoFont}`}> 
                        ${coin.volume_24h != null ? coin.volume_24h.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:0}) : 'N/A'}
                    </td>
                    <td className={`${appStyles.textCenter} ${appStyles.sparklineCell}`}>
                        <div className={appStyles.sparklineSvgContainer}>
                        <Sparkline data={coin.sparkline_in_7d && coin.sparkline_in_7d.price ? coin.sparkline_in_7d.price : []} />
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            {sortedAndFilteredCoins.length === 0 && filterTerm && !apiError &&
                <p style={{padding: '1rem', textAlign: 'center', color: '#9ca3af'}}>No coins match your filter "{filterTerm}".</p>
            }
            </div>
        )}
      </div>

      {lastUpdated && (
        <p className={appStyles.footerText}>
            Market data last updated: {lastUpdated.toLocaleTimeString()} (Auto-refreshes every 60s)
        </p>
      )}
      <p className={appStyles.disclaimerText}>
        Disclaimer: Market data is provided by CoinGecko. Prices are volatile. Not financial advice.
      </p>
    </div>
  );
}

export default MainPage;
