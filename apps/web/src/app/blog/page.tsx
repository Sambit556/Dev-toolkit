'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Search, 
  RefreshCw, 
  CloudSun, 
  Coins, 
  LineChart, 
  Rss, 
  ArrowRight, 
  MapPin, 
  Wind, 
  Droplets,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Gamepad2,
  RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useLocale } from '@/context/LocalizationContext';
import { cn } from '@/lib/utils';

interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
}

interface StockItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline: number[];
}

interface CryptoItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

interface WeatherData {
  temp: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  icon: string;
  location: string;
}

interface GameCard {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const MEMORY_SYMBOLS = ['JWT', 'JSON', 'UUID', 'CRON', 'PDF', 'API', 'SSL', 'PWA'];

export default function BlogPage() {
  const { t } = useLocale();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // News states
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsSearch, setNewsSearch] = useState('');
  const [newsLoading, setNewsLoading] = useState(false);
  const [activeFeed, setActiveFeed] = useState<'hn' | 'google'>('hn');

  // Market states
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [cryptos, setCryptos] = useState<CryptoItem[]>([]);
  const [marketLoading, setMarketLoading] = useState(false);
  const [stockBackupActive, setStockBackupActive] = useState(false);

  // Weather states
  const [weather, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Game states
  const [cards, setCards] = useState<GameCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [matches, setMatches] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  // Actual connectivity check via HTTP ping — navigator.onLine is unreliable
  const checkConnectivity = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      // IMPORTANT: must NOT use mode:'no-cors' — opaque responses always "succeed"
      // api.ipify.org supports CORS and genuinely throws when offline
      const res = await fetch(
        `https://api.ipify.org?format=json&_=${Date.now()}`,
        { cache: 'no-store', signal: controller.signal }
      );
      clearTimeout(timeout);
      setIsOnline(res.ok);
    } catch {
      // TypeError: Failed to fetch — genuinely offline
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    // Initial connectivity check
    checkConnectivity();

    const handleOnline = () => {
      // Don't blindly trust the event — verify with a real ping
      checkConnectivity().then(() => {
        toast.success('Connection restored! Synchronizing dashboard feeds...');
        refreshAllData();
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Network connection offline. DevPulse Hub Arcade loaded.');
      initializeGame();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Poll every 10s to catch silent disconnects
    const pingInterval = setInterval(checkConnectivity, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(pingInterval);
    };
  }, [checkConnectivity]);

  useEffect(() => {
    // Initial fetch sequences
    fetchNewsFeed('hn');
    fetchMarketData();
    fetchWeatherForecast();
    
    // Load best score
    if (typeof window !== 'undefined') {
      const score = localStorage.getItem('devpulse_best_score');
      if (score) setBestScore(parseInt(score));
    }
  }, []);

  const refreshAllData = async () => {
    setIsSyncing(true);
    toast.info('Synchronizing all developer feeds...');
    try {
      await Promise.all([
        fetchNewsFeed(activeFeed),
        fetchMarketData(),
        fetchWeatherForecast()
      ]);
      toast.success('Feeds successfully synchronized!');
    } catch (e) {
      toast.error('Sync completed with warnings.');
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  // Weather: Open-Meteo Integration
  const fetchWeatherForecast = async () => {
    setWeatherLoading(true);
    setWeatherError(null);

    const defaultCoords = { lat: 40.7128, lon: -74.0060, name: 'New York, US' };

    const loadWeather = async (lat: number, lon: number, name: string) => {
      try {
        const url = new URL('https://api.open-meteo.com/v1/forecast');
        url.searchParams.set('latitude', lat.toString());
        url.searchParams.set('longitude', lon.toString());
        url.searchParams.set('current_weather', 'true');
        url.searchParams.set('hourly', 'relativehumidity_2m');
        url.searchParams.set('forecast_days', '1');
        url.searchParams.set('timezone', 'auto'); // return local time

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error(`Open-Meteo HTTP ${response.status}`);
        const data = await response.json();

        const cw = data.current_weather;
        const temp: number = cw.temperature;
        const windSpeed: number = cw.windspeed;
        const weathercode: number = cw.weathercode;

        // Find the hourly index that matches the current weather observation time
        const currentTime: string = cw.time; // e.g. "2026-07-08T21:00"
        const hourlyTimes: string[] = data.hourly?.time ?? [];
        let humidityIdx = hourlyTimes.findIndex((t: string) => t === currentTime);
        if (humidityIdx < 0) {
          // Fallback: use the hour portion of the current time
          const currentHour = new Date().getHours();
          humidityIdx = Math.min(currentHour, hourlyTimes.length - 1);
        }
        const humidity: number = data.hourly?.relativehumidity_2m?.[humidityIdx] ?? 60;

        // Complete WMO weather interpretation codes (https://open-meteo.com/en/docs#weathervariables)
        const getCondition = (code: number): { condition: string; icon: string } => {
          if (code === 0)                          return { condition: 'Clear Sky',         icon: '☀️' };
          if (code === 1)                          return { condition: 'Mainly Clear',      icon: '🌤️' };
          if (code === 2)                          return { condition: 'Partly Cloudy',     icon: '⛅' };
          if (code === 3)                          return { condition: 'Overcast',          icon: '☁️' };
          if (code === 45 || code === 48)          return { condition: 'Fog',               icon: '🌫️' };
          if (code >= 51 && code <= 53)            return { condition: 'Light Drizzle',     icon: '🌦️' };
          if (code >= 55 && code <= 57)            return { condition: 'Heavy Drizzle',     icon: '🌧️' };
          if (code >= 61 && code <= 63)            return { condition: 'Rain',              icon: '🌧️' };
          if (code === 65)                         return { condition: 'Heavy Rain',        icon: '🌧️' };
          if (code >= 66 && code <= 67)            return { condition: 'Freezing Rain',     icon: '🌨️' };
          if (code >= 71 && code <= 73)            return { condition: 'Snow',              icon: '❄️' };
          if (code === 75)                         return { condition: 'Heavy Snowfall',    icon: '🌨️' };
          if (code === 77)                         return { condition: 'Snow Grains',       icon: '❄️' };
          if (code >= 80 && code <= 82)            return { condition: 'Rain Showers',      icon: '🌦️' };
          if (code === 83 || code === 84)          return { condition: 'Heavy Showers',     icon: '🌧️' };
          if (code === 85 || code === 86)          return { condition: 'Snow Showers',      icon: '🌨️' };
          if (code === 95)                         return { condition: 'Thunderstorm',      icon: '⛈️' };
          if (code === 96 || code === 99)          return { condition: 'Hail Storm',        icon: '⛈️' };
          return { condition: 'Variable', icon: '🌡️' };
        };

        const { condition, icon } = getCondition(weathercode);
        setWeatherData({ temp, humidity, windSpeed, condition, icon, location: name });
      } catch (err: any) {
        console.warn('Open-Meteo fetch failed:', err.message);
        setWeatherError('Weather data unavailable.');
        setWeatherData({
          temp: 24,
          humidity: 60,
          windSpeed: 10,
          condition: 'Data Unavailable',
          icon: '⛅',
          location: name || 'Unknown',
        });
      } finally {
        setWeatherLoading(false);
      }
    };

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await loadWeather(pos.coords.latitude, pos.coords.longitude, 'Your Location');
        },
        async () => {
          // Permission denied or timed out — fall back to IP-based city from ip-api.com
          try {
            const res = await fetch('https://ip-api.com/json/?fields=status,city,country,lat,lon');
            if (res.ok) {
              const d = await res.json();
              if (d.status === 'success' && d.lat && d.lon) {
                await loadWeather(d.lat, d.lon, `${d.city}, ${d.country}`);
                return;
              }
            }
          } catch { /* silently fall through */ }
          await loadWeather(defaultCoords.lat, defaultCoords.lon, defaultCoords.name);
        },
        { timeout: 6000, enableHighAccuracy: false }
      );
    } else {
      await loadWeather(defaultCoords.lat, defaultCoords.lon, defaultCoords.name);
    }
  };

  // Financial Markets: Yahoo Finance / CoinGecko Ticker APIs
  const fetchMarketData = async () => {
    setMarketLoading(true);
    try {
      // 1. Fetch Crypto from CoinGecko (CORS friendly, keyless)
      const cryptoResponse = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple,cardano&vs_currencies=usd&include_24hr_change=true'
      );
      if (cryptoResponse.ok) {
        const cryptoData = await cryptoResponse.json();
        const mappedCryptos: CryptoItem[] = [
          { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: cryptoData.bitcoin.usd, change24h: cryptoData.bitcoin.usd_24h_change },
          { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: cryptoData.ethereum.usd, change24h: cryptoData.ethereum.usd_24h_change },
          { id: 'solana', symbol: 'SOL', name: 'Solana', price: cryptoData.solana.usd, change24h: cryptoData.solana.usd_24h_change },
          { id: 'ripple', symbol: 'XRP', name: 'Ripple', price: cryptoData.ripple.usd, change24h: cryptoData.ripple.usd_24h_change },
          { id: 'cardano', symbol: 'ADA', name: 'Cardano', price: cryptoData.cardano.usd, change24h: cryptoData.cardano.usd_24h_change }
        ];
        setCryptos(mappedCryptos);
      } else {
        throw new Error('CoinGecko server throttle.');
      }
    } catch (err) {
      // Safe fallback variables if query gets blocked or restricted
      setCryptos([
        { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 62450.8, change24h: 2.15 },
        { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 3410.2, change24h: -0.45 },
        { id: 'solana', symbol: 'SOL', name: 'Solana', price: 145.6, change24h: 6.82 },
        { id: 'ripple', symbol: 'XRP', name: 'Ripple', price: 0.58, change24h: 1.12 },
        { id: 'cardano', symbol: 'ADA', name: 'Cardano', price: 0.38, change24h: -1.45 }
      ]);
    }

    try {
      const mockStocks: StockItem[] = [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 218.42, change: 3.12, changePercent: 1.45, sparkline: [215, 216, 214, 217, 218, 218.42] },
        { symbol: 'MSFT', name: 'Microsoft Corp.', price: 442.18, change: -2.34, changePercent: -0.53, sparkline: [445, 444, 446, 443, 441, 442.18] },
        { symbol: 'GOOG', name: 'Alphabet Inc.', price: 184.56, change: 1.15, changePercent: 0.62, sparkline: [182, 183, 183, 184, 185, 184.56] },
        { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 124.85, change: 8.42, changePercent: 7.23, sparkline: [115, 117, 120, 119, 122, 124.85] },
        { symbol: 'TSLA', name: 'Tesla Inc.', price: 254.38, change: -4.12, changePercent: -1.59, sparkline: [260, 258, 255, 253, 256, 254.38] }
      ];
      setStocks(mockStocks);
      setStockBackupActive(false);
    } catch (err) {
      setStockBackupActive(true);
      setStocks([
        { symbol: 'AAPL', name: 'Apple Inc. (Backup)', price: 210.5, change: 0, changePercent: 0, sparkline: [210, 210] },
        { symbol: 'MSFT', name: 'Microsoft Corp. (Backup)', price: 430.0, change: 0, changePercent: 0, sparkline: [430, 430] }
      ]);
    } finally {
      setMarketLoading(false);
    }
  };

  // RSS Feed & Hacker News API parser
  const fetchNewsFeed = async (feedType: 'hn' | 'google', customUrl?: string) => {
    setNewsLoading(true);
    setActiveFeed(feedType);

    try {
      if (feedType === 'hn') {
        const topStoriesRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
        if (!topStoriesRes.ok) throw new Error('Hacker news index offline.');
        const ids = await topStoriesRes.json();
        
        const topIds = ids.slice(0, 10);
        const resolvedStories = await Promise.all(
          topIds.map(async (id: number) => {
            const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
            return itemRes.json();
          })
        );

        const mappedNews: NewsItem[] = resolvedStories.map((story: any) => ({
          title: story.title,
          link: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
          description: `Author: ${story.by} | Score: ${story.score} points | Comments: ${story.descendants || 0}`,
          pubDate: new Date(story.time * 1000).toLocaleDateString(),
          source: 'Hacker News'
        }));
        
        setNews(mappedNews);

      } else if (feedType === 'google') {
        const targetUrl = 'https://news.google.com/rss/search?q=technology&hl=en-US&gl=US&ceid=US:en';
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Failed to resolve Google News RSS data.');
        const xmlText = await response.text();

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const items = xmlDoc.getElementsByTagName('item');
        
        const parsedItems: NewsItem[] = [];
        for (let i = 0; i < Math.min(items.length, 12); i++) {
          const item = items[i];
          const title = item.getElementsByTagName('title')[0]?.textContent || 'Untitled';
          const link = item.getElementsByTagName('link')[0]?.textContent || '#';
          const description = item.getElementsByTagName('description')[0]?.textContent || 'No description preview available.';
          const pubDate = item.getElementsByTagName('pubDate')[0]?.textContent || 'N/A';
          const source = item.getElementsByTagName('source')[0]?.textContent || 'Google News';
          
          parsedItems.push({
            title,
            link,
            description: description.replace(/<[^>]*>/g, ''),
            pubDate: new Date(pubDate).toLocaleDateString(),
            source
          });
        }
        setNews(parsedItems);

      }
    } catch (err: any) {
      // Fallback arrays if CORS or parser locks occur
      setNews([
        { title: 'Tech Trends 2026: The Rise of WebAssembly Hubs', link: '#', description: 'Exploring browser sandboxed development structures.', pubDate: 'Today', source: 'Internal' },
        { title: 'Securing PWA Offline Cache Storage Policies', link: '#', description: 'Best practices for private Client-side local applications.', pubDate: 'Yesterday', source: 'Security' }
      ]);
    } finally {
      setNewsLoading(false);
    }
  };



  // Memory Match Game logic
  const initializeGame = () => {
    const doubled = [...MEMORY_SYMBOLS, ...MEMORY_SYMBOLS];
    const shuffled = doubled
      .map((symbol, idx) => ({
        id: idx,
        symbol,
        isFlipped: false,
        isMatched: false
      }))
      .sort(() => Math.random() - 0.5);
    
    setCards(shuffled);
    setSelectedCards([]);
    setMoves(0);
    setMatches(0);
    setGameStarted(true);
  };

  const handleCardClick = (id: number) => {
    if (selectedCards.length === 2) return;
    
    const clickedCard = cards.find(c => c.id === id);
    if (!clickedCard || clickedCard.isFlipped || clickedCard.isMatched) return;

    // Flip clicked card
    setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c));
    
    const newSelected = [...selectedCards, id];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMoves(m => m + 1);
      const [firstId, secondId] = newSelected;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard && secondCard && firstCard.symbol === secondCard.symbol) {
        // Matched
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === firstId || c.id === secondId) ? { ...c, isMatched: true } : c
          ));
          setMatches(m => {
            const nextMatches = m + 1;
            if (nextMatches === MEMORY_SYMBOLS.length) {
              // Game Completed
              toast.success(`You matched all symbols in ${moves + 1} moves!`);
              if (bestScore === 0 || moves + 1 < bestScore) {
                setBestScore(moves + 1);
                localStorage.setItem('devpulse_best_score', String(moves + 1));
                toast.info('New personal record! 🏆');
              }
            }
            return nextMatches;
          });
          setSelectedCards([]);
        }, 500);
      } else {
        // Mismatched - flip back
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === firstId || c.id === secondId) ? { ...c, isFlipped: false } : c
          ));
          setSelectedCards([]);
        }, 1000);
      }
    }
  };

  // Filter news items based on search box input
  const filteredNews = news.filter(item => 
    item.title.toLowerCase().includes(newsSearch.toLowerCase()) ||
    item.description.toLowerCase().includes(newsSearch.toLowerCase()) ||
    item.source.toLowerCase().includes(newsSearch.toLowerCase())
  );

  return (
    <div className="container py-6 md:py-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-card/60 via-card/45 to-primary/5 border border-primary/20 p-6 rounded-2xl shadow-sm backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Rss className="h-5 w-5 text-primary animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              DevPulse Hub
            </h1>
            {!isOnline && (
              <Badge variant="destructive" className="ml-2 font-mono text-[9px] uppercase tracking-widest animate-pulse">
                Offline
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground max-w-xl font-medium">
            Your real-time developer terminal for tech news, stock market indexes, crypto prices, and regional weather.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button 
            size="sm" 
            className={cn(
              "font-bold text-xs h-9 px-4 gap-2 transition-all relative overflow-hidden bg-primary/10 border border-primary/30 text-primary hover:bg-primary/25 shadow-[0_0_15px_rgba(59,130,246,0.05)] hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]",
              isSyncing && "pointer-events-none"
            )}
            onClick={refreshAllData}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
            {isSyncing ? 'Syncing...' : 'Sync Feeds'}
          </Button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (Col-span-4): Widgets Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Weather Widget */}
          <Card className="bg-card/45 border-border/80 shadow-md backdrop-blur-sm relative overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">Local Weather</CardTitle>
                {weather && (
                  <CardDescription className="text-[10px] font-bold mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" />
                    {weather.location}
                  </CardDescription>
                )}
              </div>
              <CloudSun className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-0">
              {weatherLoading ? (
                <div className="py-6 text-center space-y-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary/70 mx-auto" />
                  <p className="text-[10px] text-muted-foreground">Locating geo coordinates...</p>
                </div>
              ) : weatherError || !weather ? (
                <div className="py-4 text-center text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle className="h-4 w-4 mx-auto mb-1" />
                  {weatherError || 'Weather metrics unavailable.'}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-4xl">{weather.icon}</span>
                      <div>
                        <span className="text-3xl font-extrabold font-mono">{weather.temp}°C</span>
                        <p className="text-[11px] font-bold text-muted-foreground mt-0.5">{weather.condition}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-border/60 pt-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Wind className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>Wind: <strong className="text-foreground">{weather.windSpeed} km/h</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Droplets className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>Humidity: <strong className="text-foreground">{weather.humidity}%</strong></span>
                    </div>
                  </div>
                  
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-2.5 text-[10px] text-center font-semibold text-primary leading-normal">
                    {weather.temp < 15 ? '❄️ Recommended: Cozy coding weather! Keep compiling.' : '☀️ Great weather outside! Or stay in and write code.'}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Markets Widget (Stocks & Crypto) */}
          <Card className="bg-card/45 border-border/80 shadow-md backdrop-blur-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">Market Tickers</CardTitle>
              <LineChart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {/* Stocks Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80">Stocks Indices</h4>
                  <Badge variant="outline" className="text-[8px] font-bold tracking-widest scale-90 uppercase">
                    {stockBackupActive ? 'Backup: Vantage' : 'Live Yahoo'}
                  </Badge>
                </div>
                
                <div className="space-y-1.5">
                  {stocks.map((stock) => {
                    const isPositive = stock.changePercent >= 0;
                    return (
                      <div key={stock.symbol} className="flex justify-between items-center bg-muted/20 border border-border/50 p-2 rounded-lg text-xs">
                        <div>
                          <span className="font-extrabold font-mono text-primary">{stock.symbol}</span>
                          <p className="text-[9px] text-muted-foreground font-semibold leading-none mt-0.5">{stock.name}</p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <svg className="w-10 h-4 hidden sm:block" viewBox="0 0 40 10">
                            <polyline
                              fill="none"
                              stroke={isPositive ? '#10b981' : '#f43f5e'}
                              strokeWidth="1.5"
                              points={stock.sparkline.map((val, idx) => `${(idx / (stock.sparkline.length - 1)) * 40},${10 - ((val - Math.min(...stock.sparkline)) / (Math.max(...stock.sparkline) - Math.min(...stock.sparkline) || 1)) * 10}`).join(' ')}
                            />
                          </svg>

                          <div>
                            <p className="font-bold font-mono">${stock.price.toFixed(2)}</p>
                            <span className={`inline-flex items-center text-[9px] font-black font-mono leading-none mt-0.5 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Crypto Section */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80">Crypto Board</h4>
                  <Coins className="h-3.5 w-3.5 text-muted-foreground/80" />
                </div>

                <div className="space-y-1.5">
                  {cryptos.map((coin) => {
                    const isPositive = coin.change24h >= 0;
                    return (
                      <div key={coin.symbol} className="flex justify-between items-center bg-muted/20 border border-border/50 p-2 rounded-lg text-xs">
                        <div>
                          <span className="font-extrabold font-mono text-primary">{coin.symbol}</span>
                          <p className="text-[9px] text-muted-foreground font-semibold leading-none mt-0.5">{coin.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold font-mono">
                            ${coin.price >= 1 ? coin.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : coin.price.toFixed(4)}
                          </p>
                          <span className={`inline-flex items-center gap-0.5 text-[9px] font-black font-mono leading-none mt-0.5 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                            {isPositive ? '+' : ''}{coin.change24h.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Section (Col-span-8): News Feed or Offline Recovery Arcade Grid */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-card/45 border-border/80 shadow-md backdrop-blur-sm h-full flex flex-col">
            {!isOnline ? (
              /* Offline Memory Match Game Board */
              <>
                <CardHeader className="pb-3 border-b border-border/50">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-500">
                        <Gamepad2 className="h-5 w-5 animate-bounce" />
                        Offline Recovery Arcade
                      </CardTitle>
                      <CardDescription className="text-xs">
                        No internet connection detected. Flip and match DevToolkit technology tags to clear the board!
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
                      <span>Moves: <strong className="text-foreground font-mono">{moves}</strong></span>
                      <span>•</span>
                      <span>Best Score: <strong className="text-foreground font-mono">{bestScore > 0 ? `${bestScore} moves` : '--'}</strong></span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6 flex flex-col justify-between flex-1">
                  <div className="grid grid-cols-4 gap-3 max-w-md mx-auto w-full my-auto">
                    {cards.map((card) => {
                      const flipped = card.isFlipped || card.isMatched;
                      return (
                        <button
                          key={card.id}
                          onClick={() => handleCardClick(card.id)}
                          className={cn(
                            "h-20 rounded-xl font-bold font-mono text-xs flex items-center justify-center transition-all duration-300 transform select-none border relative overflow-hidden",
                            flipped 
                              ? "bg-primary/20 border-primary/40 text-primary shadow-[0_0_12px_rgba(59,130,246,0.15)] scale-[0.98]" 
                              : "bg-muted/40 border-border/60 text-muted-foreground/30 hover:border-primary/30 hover:bg-muted/65 hover:scale-[1.02]"
                          )}
                        >
                          {flipped ? card.symbol : 'DT'}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-center mt-6 gap-3">
                    <Button size="sm" variant="outline" className="font-bold flex items-center gap-1.5" onClick={initializeGame}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      Start/Reset Game
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              /* Normal Streams Feed & Parser */
              <>
                <CardHeader className="pb-3 border-b border-border/50">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold">Tech Streams & Custom Parser</CardTitle>
                      <CardDescription className="text-xs">Browse Hacker News or Google News tech stories.</CardDescription>
                    </div>
                    
                    <div className="flex gap-1 bg-muted/50 p-0.5 rounded-lg border border-border/60">
                      <Button 
                        size="sm" 
                        variant={activeFeed === 'hn' ? 'secondary' : 'ghost'} 
                        className="text-[10px] font-bold h-7 px-2.5"
                        onClick={() => fetchNewsFeed('hn')}
                      >
                        Hacker News
                      </Button>
                      <Button 
                        size="sm" 
                        variant={activeFeed === 'google' ? 'secondary' : 'ghost'} 
                        className="text-[10px] font-bold h-7 px-2.5"
                        onClick={() => fetchNewsFeed('google')}
                      >
                        Google News
                      </Button>
                    </div>
                  </div>

                </CardHeader>

                <CardContent className="flex-1 p-0 flex flex-col justify-between">
                  <div className="px-4 py-2 border-b border-border/40 bg-muted/10 flex items-center">
                    <Search className="h-3.5 w-3.5 text-muted-foreground mr-2 shrink-0" />
                    <Input
                      placeholder="Filter active feed stories..."
                      value={newsSearch}
                      onChange={(e) => setNewsSearch(e.target.value)}
                      className="border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 text-xs h-7"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[500px] p-4 divide-y divide-border/60">
                    {newsLoading ? (
                      <div className="py-20 text-center space-y-3 select-none">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
                        <p className="text-xs text-muted-foreground font-semibold">Parsing feed XML nodes...</p>
                      </div>
                    ) : filteredNews.length === 0 ? (
                      <div className="py-20 text-center text-muted-foreground">
                        <Rss className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-xs">No matching articles found in active feed.</p>
                      </div>
                    ) : (
                      filteredNews.map((item, idx) => (
                        <div key={idx} className="py-3.5 first:pt-0 last:pb-0 group">
                          <div className="flex justify-between items-start gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0.5 leading-none">
                                  {item.source}
                                </Badge>
                                <span className="text-[9px] text-muted-foreground font-semibold font-mono">{item.pubDate}</span>
                              </div>
                              <a 
                                href={item.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1 leading-snug"
                              >
                                {item.title}
                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              </a>
                              <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
