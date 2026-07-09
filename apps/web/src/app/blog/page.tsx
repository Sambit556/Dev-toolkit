'use client';

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Search, 
  RefreshCw, 
  Coins, 
  LineChart, 
  Rss, 
  ArrowRight, 
  MapPin, 
  Wind, 
  Droplets,
  ExternalLink,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ShieldCheck,
  AlertCircle,
  Gamepad2,
  RotateCcw,
  Play,
  Check
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
  thumbnail?: string;
  videoUrl?: string;
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
  updatedAt: string;
}

interface GameCard {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const MEMORY_SYMBOLS = ['JWT', 'JSON', 'UUID', 'CRON', 'PDF', 'API', 'SSL', 'PWA'];

const getCardSymbolStyle = (symbol: string) => {
  switch (symbol) {
    case 'JWT': return 'bg-purple-500/10 dark:bg-purple-500/15 border-purple-500/30 dark:border-purple-500/40 text-purple-700 dark:text-purple-400 shadow-[0_4px_12px_rgba(168,85,247,0.12)] dark:shadow-[0_0_15px_rgba(168,85,247,0.25)]';
    case 'JSON': return 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30 dark:border-amber-500/40 text-amber-700 dark:text-amber-400 shadow-[0_4px_12px_rgba(245,158,11,0.12)] dark:shadow-[0_0_15px_rgba(245,158,11,0.25)]';
    case 'UUID': return 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500/30 dark:border-blue-500/40 text-blue-700 dark:text-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.12)] dark:shadow-[0_0_15px_rgba(59,130,246,0.25)]';
    case 'CRON': return 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 shadow-[0_4px_12px_rgba(16,185,129,0.12)] dark:shadow-[0_0_15px_rgba(16,185,129,0.25)]';
    case 'PDF': return 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/30 dark:border-rose-500/40 text-rose-700 dark:text-rose-400 shadow-[0_4px_12px_rgba(244,63,94,0.12)] dark:shadow-[0_0_15px_rgba(244,63,94,0.25)]';
    case 'API': return 'bg-cyan-500/10 dark:bg-cyan-500/15 border-cyan-500/30 dark:border-cyan-500/40 text-cyan-700 dark:text-cyan-400 shadow-[0_4px_12px_rgba(6,182,212,0.12)] dark:shadow-[0_0_15px_rgba(6,182,212,0.25)]';
    case 'SSL': return 'bg-teal-500/10 dark:bg-teal-500/15 border-teal-500/30 dark:border-teal-500/40 text-teal-700 dark:text-teal-400 shadow-[0_4px_12px_rgba(20,184,166,0.12)] dark:shadow-[0_0_15px_rgba(20,184,166,0.25)]';
    case 'PWA': return 'bg-pink-500/10 dark:bg-pink-500/15 border-pink-500/30 dark:border-pink-500/40 text-pink-700 dark:text-pink-400 shadow-[0_4px_12px_rgba(236,72,153,0.12)] dark:shadow-[0_0_15px_rgba(236,72,153,0.25)]';
    default: return 'bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/45 text-primary shadow-[0_4px_12px_rgba(59,130,246,0.12)] dark:shadow-[0_0_15px_rgba(59,130,246,0.25)]';
  }
};

export default function BlogPage() {
  const { t } = useLocale();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // News states
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsSearch, setNewsSearch] = useState('');
  const [newsLoading, setNewsLoading] = useState(false);
  const [activeFeed, setActiveFeed] = useState<'hn' | 'google'>('hn');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Market states
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [cryptos, setCryptos] = useState<CryptoItem[]>([]);
  const [marketLoading, setMarketLoading] = useState(false);
  const [stockBackupActive, setStockBackupActive] = useState(false);

  // Weather states
  const [weather, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherSearchQuery, setWeatherSearchQuery] = useState('');

  // Game states
  const [cards, setCards] = useState<GameCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [matches, setMatches] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [forceArcadeMode, setForceArcadeMode] = useState<boolean>(false);
  const [arcadeTab, setArcadeTab] = useState<'memory' | 'snake'>('memory');

  // Code Snake game states
  const [snake, setSnake] = useState<{ x: number; y: number }[]>([]);
  const [snakeDir, setSnakeDir] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('UP');
  const [snakeFood, setSnakeFood] = useState<{ x: number; y: number }>({ x: 5, y: 5 });
  const [snakeScore, setSnakeScore] = useState<number>(0);
  const [snakeHighScore, setSnakeHighScore] = useState<number>(0);
  const [snakeStatus, setSnakeStatus] = useState<'IDLE' | 'PLAYING' | 'GAME_OVER'>('IDLE');

  // Connectivity detection using native browser APIs
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored! Synchronizing dashboard feeds...');
      refreshAllData();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Network connection offline. Information Pulse Arcade loaded.');
      initializeGame();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Weather: OpenWeatherMap Integration
  const fetchWeatherForecast = async (searchCity?: string) => {
    setWeatherLoading(true);
    setWeatherError(null);

    const apiKey = '6f17dd2d66b202ab4c8c52e73210089c';

    const getOwmIconEmoji = (iconCode: string): string => {
      if (iconCode.startsWith('01')) return '☀️';
      if (iconCode.startsWith('02')) return '🌤️';
      if (iconCode.startsWith('03')) return '⛅';
      if (iconCode.startsWith('04')) return '☁️';
      if (iconCode.startsWith('09')) return '🌦️';
      if (iconCode.startsWith('10')) return '🌧️';
      if (iconCode.startsWith('11')) return '⛈️';
      if (iconCode.startsWith('13')) return '❄️';
      if (iconCode.startsWith('50')) return '🌫️';
      return '🌡️';
    };

    try {
      let url = '';
      if (searchCity && searchCity.trim() !== '') {
        url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(searchCity.trim())}&appid=${apiKey}&units=metric`;
      } else {
        // Resolve user location: Geolocation API → IP-based fallback → default coords
        let lat = 28.6139;
        let lon = 77.2090;
        
        if (typeof window !== 'undefined' && 'geolocation' in navigator) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
            });
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
          } catch {
            // Geolocation failed/denied, try IP fallback
            try {
              const res = await fetch('https://ipapi.co/json/');
              if (res.ok) {
                const d = await res.json();
                if (d.latitude && d.longitude) {
                  lat = d.latitude;
                  lon = d.longitude;
                }
              }
            } catch { /* ignore */ }
          }
        }
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Location not found. Try searching another city or state.');
        }
        throw new Error(`OpenWeatherMap HTTP error ${response.status}`);
      }
      const data = await response.json();

      const temp = Math.round(data.main.temp);
      const humidity = data.main.humidity;
      const windSpeed = Math.round(data.wind.speed * 3.6); // m/s to km/h
      const condition = data.weather[0]?.main || 'Variable';
      const iconEmoji = getOwmIconEmoji(data.weather[0]?.icon || '');
      const location = `${data.name}, ${data.sys.country}`;
      const now = new Date();
      const updatedAt = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setWeatherData({
        temp,
        humidity,
        windSpeed,
        condition,
        icon: iconEmoji,
        location,
        updatedAt
      });
    } catch (err: any) {
      console.warn('OpenWeatherMap fetch failed:', err.message);
      setWeatherError(err.message || 'Weather data unavailable.');
    } finally {
      setWeatherLoading(false);
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

    const getKeywordImage = (title: string): string => {
      const t = title.toLowerCase();
      if (t.includes('apple') || t.includes('iphone') || t.includes('mac') || t.includes('ipad') || t.includes('ios')) {
        return 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=300&q=80';
      }
      if (t.includes('google') || t.includes('android') || t.includes('alphabet') || t.includes('chrome')) {
        return 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&w=300&q=80';
      }
      if (t.includes('ai') || t.includes('artificial intelligence') || t.includes('gpt') || t.includes('llm') || t.includes('openai') || t.includes('intelligence') || t.includes('model')) {
        return 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=300&q=80';
      }
      if (t.includes('crypto') || t.includes('bitcoin') || t.includes('ethereum') || t.includes('btc') || t.includes('sol') || t.includes('blockchain') || t.includes('coin')) {
        return 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=300&q=80';
      }
      if (t.includes('security') || t.includes('hack') || t.includes('cyber') || t.includes('leak') || t.includes('breach') || t.includes('encrypt') || t.includes('password')) {
        return 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=300&q=80';
      }
      if (t.includes('code') || t.includes('dev') || t.includes('program') || t.includes('rust') || t.includes('react') || t.includes('javascript') || t.includes('python') || t.includes('wasm')) {
        return 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=300&q=80';
      }
      if (t.includes('game') || t.includes('arcade') || t.includes('play') || t.includes('nintendo') || t.includes('sony') || t.includes('xbox')) {
        return 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=300&q=80';
      }
      // General abstract premium blue/purple code texture
      return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80';
    };

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
          source: 'Hacker News',
          thumbnail: getKeywordImage(story.title || '')
        }));
        
        setNews(mappedNews);

      } else if (feedType === 'google') {
        const rssUrl = 'https://news.google.com/rss/search?q=technology&hl=en-US&gl=US&ceid=US:en';
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Failed to resolve Google News RSS data.');
        const data = await response.json();

        if (data.status !== 'ok' || !data.items) throw new Error('RSS2JSON returned error status.');

        const parsedItems: NewsItem[] = data.items.slice(0, 12).map((item: any) => {
          const thumbnail = getKeywordImage(item.title || '');

          let videoUrl = item.enclosure?.type?.startsWith('video/') ? item.enclosure.link : undefined;
          if (item.link?.includes('youtube.com') || item.link?.includes('youtu.be')) {
            videoUrl = item.link;
          }

          return {
            title: item.title || 'Untitled',
            link: item.link || '#',
            description: (item.description || 'No description preview available.').replace(/<[^>]*>/g, '').trim(),
            pubDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString() : 'N/A',
            source: item.author || 'Google News',
            thumbnail,
            videoUrl
          };
        });
        setNews(parsedItems);

      }
    } catch (err: any) {
      // Fallback arrays if CORS or parser locks occur
      setNews([
        { 
          title: 'Tech Trends 2026: The Rise of WebAssembly Hubs', 
          link: '#', 
          description: 'Exploring browser sandboxed development structures.', 
          pubDate: 'Today', 
          source: 'Internal',
          thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'
        },
        { 
          title: 'Securing PWA Offline Cache Storage Policies', 
          link: '#', 
          description: 'Best practices for private Client-side local applications.', 
          pubDate: 'Yesterday', 
          source: 'Security',
          thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=300&q=80'
        }
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

  // Code Snake Game Logic
  const initializeSnakeGame = () => {
    const initialSnake = [
      { x: 7, y: 7 },
      { x: 7, y: 8 },
      { x: 7, y: 9 }
    ];
    setSnake(initialSnake);
    setSnakeDir('UP');
    setSnakeScore(0);
    setSnakeStatus('IDLE');
    generateSnakeFood(initialSnake);
  };

  const generateSnakeFood = (currentSnake: { x: number; y: number }[]) => {
    const activeSnake = currentSnake.length > 0 ? currentSnake : snake;
    let newFood;
    let isOccupied = true;
    
    while (isOccupied) {
      const rx = Math.floor(Math.random() * 15);
      const ry = Math.floor(Math.random() * 15);
      newFood = { x: rx, y: ry };
      isOccupied = activeSnake.some(cell => cell.x === rx && cell.y === ry);
    }
    
    if (newFood) setSnakeFood(newFood);
  };

  // Keyboard controls listener for Code Snake
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (arcadeTab !== 'snake' || snakeStatus === 'GAME_OVER') return;
      
      let nextDir = snakeDir;
      let keyProcessed = false;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (snakeDir !== 'DOWN') {
            nextDir = 'UP';
            keyProcessed = true;
            e.preventDefault();
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (snakeDir !== 'UP') {
            nextDir = 'DOWN';
            keyProcessed = true;
            e.preventDefault();
          }
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (snakeDir !== 'RIGHT') {
            nextDir = 'LEFT';
            keyProcessed = true;
            e.preventDefault();
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (snakeDir !== 'LEFT') {
            nextDir = 'RIGHT';
            keyProcessed = true;
            e.preventDefault();
          }
          break;
      }
      
      if (keyProcessed) {
        setSnakeDir(nextDir);
        if (snakeStatus === 'IDLE') {
          setSnakeStatus('PLAYING');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [snakeDir, snakeStatus, arcadeTab]);

  const handleDpadClick = (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (snakeStatus === 'GAME_OVER' || arcadeTab !== 'snake') return;
    
    let nextDir = snakeDir;
    switch (dir) {
      case 'UP': if (snakeDir !== 'DOWN') nextDir = 'UP'; break;
      case 'DOWN': if (snakeDir !== 'UP') nextDir = 'DOWN'; break;
      case 'LEFT': if (snakeDir !== 'RIGHT') nextDir = 'LEFT'; break;
      case 'RIGHT': if (snakeDir !== 'LEFT') nextDir = 'RIGHT'; break;
    }
    
    setSnakeDir(nextDir);
    if (snakeStatus === 'IDLE') {
      setSnakeStatus('PLAYING');
    }
  };

  // Game loop interval ticker for Code Snake
  useEffect(() => {
    if (snakeStatus !== 'PLAYING' || arcadeTab !== 'snake') return;

    const gameTick = () => {
      setSnake(prevSnake => {
        if (prevSnake.length === 0) return prevSnake;
        
        const head = { ...prevSnake[0] };
        
        // Calculate new head position
        switch (snakeDir) {
          case 'UP': head.y -= 1; break;
          case 'DOWN': head.y += 1; break;
          case 'LEFT': head.x -= 1; break;
          case 'RIGHT': head.x += 1; break;
        }

        // Collision Check: wall boundaries
        if (head.x < 0 || head.x >= 15 || head.y < 0 || head.y >= 15) {
          setSnakeStatus('GAME_OVER');
          toast.error(`Game Over! Crash detected at cell coordinates.`);
          return prevSnake;
        }

        // Collision Check: self body segment
        const selfCollision = prevSnake.some((cell, idx) => idx > 0 && cell.x === head.x && cell.y === head.y);
        if (selfCollision) {
          setSnakeStatus('GAME_OVER');
          toast.error('Game Over! Self loop collision.');
          return prevSnake;
        }

        // Food eating check
        const eaten = head.x === snakeFood.x && head.y === snakeFood.y;
        const newSnake = [head, ...prevSnake];
        
        if (eaten) {
          setSnakeScore(s => {
            const nextScore = s + 1;
            if (nextScore > snakeHighScore) {
              setSnakeHighScore(nextScore);
              localStorage.setItem('devpulse_snake_highscore', String(nextScore));
            }
            return nextScore;
          });
          generateSnakeFood(newSnake);
        } else {
          newSnake.pop(); // Remove tail segment
        }

        return newSnake;
      });
    };

    const intervalId = setInterval(gameTick, 160);
    return () => clearInterval(intervalId);
  }, [snakeDir, snakeFood, snakeStatus, arcadeTab, snakeHighScore]);

  // Load high scores on mount
  useEffect(() => {
    const savedBestScore = localStorage.getItem('devpulse_best_score');
    if (savedBestScore) setBestScore(Number(savedBestScore));
    
    const savedSnakeHighScore = localStorage.getItem('devpulse_snake_highscore');
    if (savedSnakeHighScore) setSnakeHighScore(Number(savedSnakeHighScore));
  }, []);

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
              Information Pulse
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
        <div className="flex gap-2.5 items-center shrink-0">
          <div className="flex items-center gap-2 bg-muted/65 border border-border/80 rounded-xl p-1 shadow-sm">
            <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground pl-2 select-none">
              Arcade Mode
            </span>
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "text-[10px] font-bold h-7 px-3.5 transition-all rounded-lg flex items-center justify-center shadow-sm font-sans tracking-wide",
                forceArcadeMode 
                  ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/25 hover:border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.08)]" 
                  : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/25 hover:border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.08)]"
              )}
              onClick={() => {
                const next = !forceArcadeMode;
                setForceArcadeMode(next);
                if (next) initializeGame();
              }}
            >
              {forceArcadeMode ? "Deactivate" : "Activate"}
            </Button>
          </div>

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
                <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">Weather</CardTitle>
                {weather && (
                  <CardDescription className="text-[10px] font-bold mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" />
                    {weather.location}
                    {weather.updatedAt && (
                      <span className="text-muted-foreground/60 font-mono ml-1">• {weather.updatedAt}</span>
                    )}
                  </CardDescription>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 shrink-0"
                onClick={() => fetchWeatherForecast()}
                disabled={weatherLoading}
                aria-label="Refresh weather"
              >
                <RefreshCw className={cn("h-3.5 w-3.5 text-primary", weatherLoading && "animate-spin")} />
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-1.5 mb-3">
                <Input
                  placeholder="City, State (e.g. Mumbai, CA, NY)"
                  value={weatherSearchQuery}
                  onChange={(e) => setWeatherSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      fetchWeatherForecast(weatherSearchQuery);
                    }
                  }}
                  className="h-8 text-xs bg-background/30 border-border/80"
                />
                <Button 
                  size="sm" 
                  className="h-8 px-3 text-xs font-bold bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30"
                  onClick={() => fetchWeatherForecast(weatherSearchQuery)}
                  disabled={weatherLoading}
                >
                  Search
                </Button>
              </div>
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
          <Card className="bg-card/45 border-border/80 shadow-md backdrop-blur-sm h-full flex flex-col overflow-hidden">
            {!isOnline || forceArcadeMode ? (
              /* Offline Memory Match Game Board */
              <div key="arcade-board" className="animate-in fade-in zoom-in-95 duration-500 flex-1 flex flex-col">
                <CardHeader className="pb-3 border-b border-border/50 min-h-[80px]">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Gamepad2 className="h-5 w-5 text-amber-500 animate-bounce" />
                        <CardTitle className="text-base font-black tracking-wide text-amber-500">
                          Arcade Recovery Mode
                        </CardTitle>
                      </div>
                      {/* Fixed-height description so tab switch doesn't shift layout */}
                      <div className="h-4 overflow-hidden">
                        <CardDescription className="text-xs leading-4 truncate">
                          {arcadeTab === 'memory' 
                            ? 'Flip and match DevToolkit technology tags to clear the board!'
                            : 'Navigate the snake to squash developer bugs and commit lines of code!'}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Tabs with visible active indicator */}
                      <div className="flex gap-1 bg-muted/50 p-0.5 rounded-xl border border-border/70 shadow-inner">
                        <button
                          className={cn(
                            "flex items-center gap-1.5 text-[10px] font-black h-7 px-3 rounded-lg transition-all duration-200",
                            arcadeTab === 'memory'
                              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                          )}
                          onClick={() => setArcadeTab('memory')}
                        >
                          <Play className="h-3 w-3" />
                          Memory Match
                        </button>
                        <button
                          className={cn(
                            "flex items-center gap-1.5 text-[10px] font-black h-7 px-3 rounded-lg transition-all duration-200",
                            arcadeTab === 'snake'
                              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/25"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                          )}
                          onClick={() => {
                            setArcadeTab('snake');
                            if (snakeStatus === 'IDLE' && snake.length === 0) initializeSnakeGame();
                          }}
                        >
                          <Gamepad2 className="h-3 w-3" />
                          Code Snake
                        </button>
                      </div>

                      {/* Score metrics — fixed min-width so content changes don't resize */}
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground font-mono bg-muted/30 px-2 py-1 rounded-md border border-border/50 min-w-[160px] h-7 shrink-0">
                        {arcadeTab === 'memory' ? (
                          <>
                            <span>Moves: <strong className="text-foreground">{moves}</strong></span>
                            <span>•</span>
                            <span>Best: <strong className="text-foreground">{bestScore > 0 ? `${bestScore}m` : '--'}</strong></span>
                          </>
                        ) : (
                          <>
                            <span>LOC: <strong className="text-emerald-500 font-black">{snakeScore}</strong></span>
                            <span>•</span>
                            <span>Best: <strong className="text-foreground">{snakeHighScore}</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6 flex flex-col justify-between flex-1 relative overflow-hidden min-h-[420px]">

                  {arcadeTab === 'memory' ? (
                    matches === MEMORY_SYMBOLS.length ? (
                      /* High-Fidelity Cyber Match Victory Screen */
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-6 animate-in fade-in zoom-in-95 duration-500">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-emerald-500/20 dark:bg-emerald-500/10 blur-xl animate-pulse" />
                          <div className="relative h-16 w-16 rounded-full border-2 border-emerald-500 bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                            <Check className="h-8 w-8 stroke-[3]" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">System Restored</h3>
                          <p className="text-xs text-muted-foreground max-w-xs font-semibold leading-relaxed">
                            All technology indexes have been fully calibrated and mapped successfully.
                          </p>
                        </div>
                        <div className="bg-muted/40 border border-border/80 rounded-2xl p-4 w-full max-w-[280px] grid grid-cols-2 gap-2 text-center text-xs font-bold font-mono">
                          <div>
                            <p className="text-muted-foreground/60 text-[10px] uppercase font-black leading-none mb-1">Final Score</p>
                            <p className="text-foreground text-sm font-black">{moves} moves</p>
                          </div>
                          <div className="border-l border-border/70">
                            <p className="text-muted-foreground/60 text-[10px] uppercase font-black leading-none mb-1">Best Score</p>
                            <p className="text-foreground text-sm font-black">{bestScore > 0 ? `${bestScore} moves` : `${moves} moves`}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold flex items-center gap-1.5 px-5 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md shadow-emerald-500/15" 
                          onClick={initializeGame}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Run Diagnosis Again
                        </Button>
                      </div>
                    ) : (
                      /* Grid and controls */
                      <>
                        <div className="grid grid-cols-4 gap-3 max-w-md mx-auto w-full my-auto">
                          {cards.map((card) => {
                            const flipped = card.isFlipped || card.isMatched;
                            return (
                              <div
                                key={card.id}
                                className="h-20 w-full [perspective:1000px] group cursor-pointer"
                                onClick={() => handleCardClick(card.id)}
                              >
                                <div
                                  className={cn(
                                    "relative w-full h-full duration-500 [transform-style:preserve-3d] rounded-xl border border-transparent select-none transition-all",
                                    flipped ? "[transform:rotateY(180deg)]" : ""
                                  )}
                                >
                                  {/* Card Back Face (visible when NOT flipped) */}
                                  <div className="absolute inset-0 w-full h-full rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50/70 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950/65 border-border/80 dark:border-primary/25 flex flex-col items-center justify-center hover:border-cyan-500/50 hover:shadow-md dark:hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:scale-[1.03] transition-all [backface-visibility:hidden]">
                                    <div className="absolute inset-0 bg-grid-white/[0.04] opacity-40 pointer-events-none" />
                                    <span className="text-[13px] font-black tracking-widest bg-gradient-to-r from-cyan-500 via-primary to-purple-500 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(6,182,212,0.3)]">DT</span>
                                  </div>

                                  {/* Card Front Face (visible when flipped) */}
                                  <div className={cn(
                                    "absolute inset-0 w-full h-full rounded-xl flex items-center justify-center font-sans font-black tracking-wider text-sm [backface-visibility:hidden] [transform:rotateY(180deg)]",
                                    getCardSymbolStyle(card.symbol)
                                  )}>
                                    {card.symbol}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="flex justify-center mt-6 gap-3">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="bg-gradient-to-r from-cyan-500/10 via-primary/10 to-purple-500/10 hover:from-cyan-500/20 hover:to-purple-500/20 border-primary/30 dark:border-primary/40 hover:border-primary/50 text-foreground font-black flex items-center gap-1.5 px-5 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 duration-200 shadow-sm"
                            onClick={initializeGame}
                          >
                            <RotateCcw className="h-3.5 w-3.5 text-primary" />
                            Start / Reset Game
                          </Button>
                        </div>
                      </>
                    )
                  ) : (
                    /* Code Snake retro game layout */
                    snakeStatus === 'GAME_OVER' ? (
                      /* Snake Game Over Screen */
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-6 animate-in fade-in zoom-in-95 duration-500">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-rose-500/20 dark:bg-rose-500/10 blur-xl animate-pulse" />
                          <div className="relative h-16 w-16 rounded-full border-2 border-rose-500 bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                            <AlertCircle className="h-8 w-8 stroke-[3]" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">Compiler Fault</h3>
                          <p className="text-xs text-muted-foreground max-w-xs font-semibold leading-relaxed">
                            Code execution crashed. Snake collided with a system wall or self-loop pointer segment.
                          </p>
                        </div>
                        <div className="bg-muted/40 border border-border/80 rounded-2xl p-4 w-full max-w-[280px] grid grid-cols-2 gap-2 text-center text-xs font-bold font-mono">
                          <div>
                            <p className="text-muted-foreground/60 text-[10px] uppercase font-black leading-none mb-1">Score</p>
                            <p className="text-foreground text-sm font-black">{snakeScore} LOC</p>
                          </div>
                          <div className="border-l border-border/70">
                            <p className="text-muted-foreground/60 text-[10px] uppercase font-black leading-none mb-1">Record</p>
                            <p className="text-foreground text-sm font-black">{snakeHighScore} LOC</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-rose-500 via-rose-600 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold flex items-center gap-1.5 px-5 py-2 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md shadow-rose-500/15" 
                          onClick={initializeSnakeGame}
                        >
                          <RotateCcw className="h-3.5 w-3.5 animate-spin-slow" />
                          Recompile Program
                        </Button>
                      </div>
                    ) : (
                      /* Active Snake board grid & D-pad controllers */
                      <div className="flex-1 flex flex-col md:flex-row gap-6 items-center justify-center py-2 animate-in fade-in duration-300">
                        {/* Grid Board with IDLE overlay */}
                        <div className="relative border border-border/80 dark:border-primary/20 bg-muted/20 dark:bg-black/35 rounded-2xl p-1.5 shadow-inner">
                          {snakeStatus === 'IDLE' && (
                            <div className="absolute inset-0 z-10 rounded-2xl flex flex-col items-center justify-center bg-background/60 dark:bg-black/50 backdrop-blur-[2px]">
                              <Gamepad2 className="h-8 w-8 text-emerald-500 mb-2 animate-bounce" />
                              <p className="text-xs font-black text-foreground">Press ↑ ↓ ← → to Start</p>
                              <p className="text-[10px] text-muted-foreground mt-1">or use WASD keys</p>
                            </div>
                          )}
                          <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-[1px] w-[220px] h-[220px] bg-muted/45 dark:bg-muted/10 rounded-xl overflow-hidden p-[1.5px]">
                            {Array.from({ length: 15 * 15 }).map((_, idx) => {
                              const x = idx % 15;
                              const y = Math.floor(idx / 15);
                              const isSnake = snake.some(c => c.x === x && c.y === y);
                              const isHead = snake.length > 0 && snake[0].x === x && snake[0].y === y;
                              const isFood = snakeFood.x === x && snakeFood.y === y;
                              return (
                                <div
                                  key={idx}
                                  className={cn(
                                    "aspect-square w-full rounded-[2.5px] transition-all duration-100",
                                    isHead 
                                      ? "bg-emerald-600 dark:bg-emerald-500 border-[0.5px] border-emerald-400/50 shadow-[0_0_6px_#10b981]" 
                                      : isSnake 
                                        ? "bg-emerald-500/80 dark:bg-emerald-500/90 shadow-[0_0_3px_rgba(16,185,129,0.3)]" 
                                        : isFood 
                                          ? "bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e] rounded-full scale-90" 
                                          : "bg-background/40 dark:bg-slate-900/10"
                                  )}
                                />
                              );
                            })}
                          </div>
                        </div>

                        {/* On-screen tactile D-Pad controllers */}
                        <div className="flex flex-col items-center">
                          <div className="mb-2 text-center select-none">
                            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Directional Input</p>
                            <p className="text-[9px] text-muted-foreground/60 font-semibold font-mono leading-none mt-0.5">Click keys or use WASD/Arrows</p>
                          </div>
                          
                          <div className="flex flex-col items-center gap-1">
                            <Button 
                              size="icon-sm" 
                              variant="outline" 
                              className="h-8 w-8 rounded-lg shadow-sm border border-border/70 hover:bg-muted active:scale-90 transition-all" 
                              onClick={() => handleDpadClick('UP')}
                              disabled={false}
                            >
                              <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                            </Button>
                            <div className="flex gap-1.5">
                              <Button 
                                size="icon-sm" 
                                variant="outline" 
                                className="h-8 w-8 rounded-lg shadow-sm border border-border/70 hover:bg-muted active:scale-90 transition-all" 
                                onClick={() => handleDpadClick('LEFT')}
                                disabled={false}
                              >
                                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button 
                                size="icon-sm" 
                                variant="outline" 
                                className="h-8 w-8 rounded-lg shadow-sm border border-border/70 hover:bg-muted active:scale-90 transition-all" 
                                onClick={() => handleDpadClick('DOWN')}
                                disabled={false}
                              >
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button 
                                size="icon-sm" 
                                variant="outline" 
                                className="h-8 w-8 rounded-lg shadow-sm border border-border/70 hover:bg-muted active:scale-90 transition-all" 
                                onClick={() => handleDpadClick('RIGHT')}
                                disabled={false}
                              >
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-4 font-bold text-[10px] h-7 px-4 rounded-lg flex items-center gap-1.5 hover:bg-muted"
                            onClick={initializeSnakeGame}
                          >
                            <RotateCcw className="h-3 w-3" />
                            Restart Board
                          </Button>
                        </div>
                      </div>
                    )
                  )}
                </CardContent>
              </div>
            ) : (
              /* Normal Streams Feed & Parser */
              <div key="news-feed" className="animate-in fade-in zoom-in-95 duration-500 flex-1 flex flex-col">
                <CardHeader className="pb-3 border-b border-border/50">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold">Tech Streams</CardTitle>
                      <CardDescription className="text-xs">Browse News & Tech Stories</CardDescription>
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

                  <div className="flex-1 overflow-y-auto p-4 divide-y divide-border/60 h-0">
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
                        <div key={idx} className="py-4 first:pt-0 last:pb-0 group">
                          <div className="flex flex-col sm:flex-row gap-4 items-start">
                            {/* Thumbnail image if available */}
                            {item.thumbnail && !brokenImages[item.thumbnail] && (
                              <div className="relative w-full sm:w-24 h-24 sm:h-16 shrink-0 rounded-lg overflow-hidden border border-border/60 shadow-sm bg-muted/30">
                                <img 
                                  src={item.thumbnail} 
                                  alt="" 
                                  onError={() => {
                                    setBrokenImages((prev) => ({ ...prev, [item.thumbnail!]: true }));
                                  }}
                                  className="w-full h-full object-cover transition-transform duration-350 group-hover:scale-105"
                                />
                                {item.videoUrl && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                    <div className="bg-primary text-primary-foreground p-1 rounded-full shadow-md">
                                      <Play className="h-2.5 w-2.5 fill-current" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex-1 space-y-1 w-full">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0.5 leading-none">
                                  {item.source}
                                </Badge>
                                <span className="text-[9px] text-muted-foreground font-semibold font-mono">{item.pubDate}</span>
                                {item.videoUrl && (
                                  <Badge className="text-[8px] font-bold px-1.5 py-0.5 leading-none bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/25">
                                    🎥 Video Stream
                                  </Badge>
                                )}
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

                              {/* If a video is available, display play options */}
                              {item.videoUrl && (item.videoUrl.includes('youtube.com') || item.videoUrl.includes('youtu.be')) && (
                                <div className="mt-1 text-[9px] font-bold">
                                  <a 
                                    href={item.videoUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center gap-1 text-primary hover:underline"
                                  >
                                    🎬 Watch Video Stream
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
