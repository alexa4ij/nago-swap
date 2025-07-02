// src/App.tsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
// import { HexString, BCS } from "supra-l1-sdk"; // Mungkin tidak perlu di sini jika hanya untuk interaksi langsung
import axios from "axios";
import './App.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ethers, Contract } from "ethers";

// --- Import Komponen Baru ---
import DcaPage from "./Components/DCA";
import BridgePage from "./Components/Bridge";
import LiquidityPage from "./Components/Liquidity";
import NagoTokenPage from "./Components/Nago";
import ConnectWalletModal from "./Components/ConnectWalletModal";
import ConnectedWalletDropdown from "./Components/ConnectedWalletDropdown";
// --------------------------------------------------

interface CoinGeckoPriceData {
  [token_id: string]: {
    usd?: number;
  };
}

type TokenSymbol = 'SUPRA' | 'USDC' | 'USDT' | 'WETH' | 'BTC' | 'ETH' | 'BNB' | 'SOL' | 'XRP' | 'ADA' | 'DOGE' | 'SHIB' | 'AVAX' | 'DOT' | 'LINK' | 'MATIC' | 'LTC' | 'BCH' | 'XLM' | 'UNI' | 'WBTC' | 'TRX' | 'ATOM' | 'NEAR' | 'ICP';

// Deklarasi global untuk window.ethereum dan window.starkey agar TypeScript tidak error
declare global {
  interface Window {
    ethereum?: any; // Untuk Metamask dan wallet EVM lainnya
    starkey?: { // Untuk StarKey Wallet
      supra?: any;
    };
    // BARU: Untuk Sui Wallet
    suiWallet?: {
      // Perbaikan di sini: Hapus string yang tidak valid
      // `has` biasanya adalah properti boolean yang menandakan keberadaan provider
      // Atau cukup cek keberadaan `suiWallet` itu sendiri
      isSuiWallet?: boolean; // Contoh: jika wallet memiliki properti `isSuiWallet: true`
      getAccounts?: () => Promise<{ address: string }[]>;
      connect?: () => Promise<{ accounts: { address: string }[] }>;
      disconnect?: () => Promise<void>;
      getNetwork?: () => Promise<string>;
      on?: (event: string, callback: (...args: any[]) => void) => void;
      off?: (event: string, callback: (...args: any[]) => void) => void;
      // Tambahkan properti lain yang relevan dari provider Sui Wallet
    };
  }
}

function App() {
  const supraProvider: any = typeof window !== "undefined" && (window as any)?.starkey?.supra;
  const [isStarkeyInstalled, setIsStarkeyInstalled] = useState<boolean>(false);
  const [starkeyAccounts, setStarkeyAccounts] = useState<string[]>([]);
  const [starkeyNetworkData, setStarkeyNetworkData] = useState<any>();

  const [isMetamaskInstalled, setIsMetamaskInstalled] = useState<boolean>(false);
  const [metamaskAccounts, setMetamaskAccounts] = useState<string[]>([]);
  const [metamaskProvider, setMetamaskProvider] = useState<ethers.BrowserProvider | null>(null);
  const [metamaskSigner, setMetamaskSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [metamaskNetwork, setMetamaskNetwork] = useState<string | null>(null);
  const [metamaskChainId, setMetamaskChainId] = useState<number | null>(null);

  // BARU: State untuk Sui Wallet
  // Cukup cek keberadaan `window.suiWallet` secara langsung, tidak perlu properti `has` yang spesifik di sini
  const suiWalletProvider: any = typeof window !== "undefined" && (window as any)?.suiWallet;
  const [isSuiWalletInstalled, setIsSuiWalletInstalled] = useState<boolean>(false);
  const [suiAccounts, setSuiAccounts] = useState<string[]>([]);
  const [suiNetwork, setSuiNetwork] = useState<string | null>(null);

  type ActiveWallet = 'starkey' | 'metamask' | 'sui' | null; // <--- BARU: Tambahkan 'sui'
  const [activeWallet, setActiveWallet] = useState<ActiveWallet>(null);

  type PageType = 'swap' | 'dca' | 'bridge' | 'liquidity' | 'token-nago';
  const [activePage, setActivePage] = useState<PageType>('swap');
  const [isNavOpen, setIsNavOpen] = useState(false);

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const resetStarkeyWalletData = useCallback(() => {
    setStarkeyAccounts([]);
    setStarkeyNetworkData(null);
  }, []);

  const resetMetamaskWalletData = useCallback(() => {
    setMetamaskAccounts([]);
    setMetamaskProvider(null);
    setMetamaskSigner(null);
    setMetamaskNetwork(null);
    setMetamaskChainId(null);
  }, []);

  // BARU: Reset data Sui Wallet
  const resetSuiWalletData = useCallback(() => {
    setSuiAccounts([]);
    setSuiNetwork(null);
  }, []);

  const getStarkeyNetworkData = useCallback(async () => {
    if (supraProvider) {
      try {
        const data = await supraProvider.getChainId();
        console.log("StarKey Network Data:", data);
        if (data) {
          setStarkeyNetworkData(data);
        }
      } catch (e) {
        console.error("Error getting StarKey network data:", e);
        setStarkeyNetworkData(null);
      }
    }
  }, [supraProvider]);

  const updateStarkeyAccounts = useCallback(async () => {
    if (supraProvider) {
      try {
        const response_acc = await supraProvider.account();
        if (response_acc && response_acc.length > 0) {
          setStarkeyAccounts(response_acc);
        } else {
          setStarkeyAccounts([]);
        }
      } catch (e) {
        console.error("Error updating StarKey accounts:", e);
        setStarkeyAccounts([]);
      }
      getStarkeyNetworkData();
    }
  }, [supraProvider, getStarkeyNetworkData]);

  useEffect(() => {
    const checkStarkeyInstallation = async () => {
      if (supraProvider) {
        setIsStarkeyInstalled(true);
        const response_acc = await supraProvider.account();
        if (response_acc && response_acc.length > 0) {
            setStarkeyAccounts(response_acc);
            setActiveWallet('starkey');
            getStarkeyNetworkData();
        }
      } else {
        setIsStarkeyInstalled(false);
      }
    };
    checkStarkeyInstallation();
  }, [supraProvider, getStarkeyNetworkData]);

  useEffect(() => {
    if (supraProvider && typeof supraProvider.on === 'function' && typeof supraProvider.off === 'function') {
      const handleAccountChange = (acc: string[]) => {
        setStarkeyAccounts(acc);
        toast.info("StarKey accounts changed.");
        getStarkeyNetworkData();
        if (acc.length === 0) {
          setActiveWallet(null);
          resetStarkeyWalletData();
        } else {
          setActiveWallet('starkey');
        }
      };
      const handleNetworkChange = (data: any) => {
        setStarkeyNetworkData(data);
        toast.info(`StarKey network changed to: ${data}`);
      };
      const handleDisconnect = () => {
        resetStarkeyWalletData();
        toast.warn("StarKey Wallet disconnected.");
        setActiveWallet(null);
      };

      try {
        supraProvider.on("accountChanged", handleAccountChange);
        supraProvider.on("networkChanged", handleNetworkChange);
        supraProvider.on("disconnect", handleDisconnect);
      } catch (e) {
        console.error("Error setting up StarKey listeners (on):", e);
      }

      return () => {
        try {
          supraProvider.off("accountChanged", handleAccountChange);
          supraProvider.off("networkChanged", handleNetworkChange);
          supraProvider.off("disconnect", handleDisconnect);
        } catch (e) {
          console.error("Error cleaning up StarKey listeners (off):", e);
        }
      };
    }
  }, [supraProvider, getStarkeyNetworkData, resetStarkeyWalletData]);

  useEffect(() => {
    const { ethereum } = window as any;
    if (typeof ethereum !== 'undefined') {
      setIsMetamaskInstalled(true);
      if (ethereum.isConnected && ethereum.selectedAddress) {
        ethereum.request({ method: 'eth_accounts' })
          .then((accounts: string[]) => {
            if (accounts.length > 0) {
              setMetamaskAccounts(accounts);
              const provider = new ethers.BrowserProvider(ethereum);
              setMetamaskProvider(provider);
              provider.getSigner().then(setMetamaskSigner);
              provider.getNetwork().then(network => {
                setMetamaskNetwork(network.name);
                setMetamaskChainId(Number(network.chainId));
              });
              setActiveWallet('metamask');
            }
          })
          .catch(console.error);
      }
    } else {
      setIsMetamaskInstalled(false);
    }
  }, []);

  useEffect(() => {
    const { ethereum } = window as any;

    if (typeof ethereum === 'undefined' || !ethereum.on || !ethereum.removeListener) {
      return;
    }

    const handleMetamaskAccountsChanged = async (accounts: string[]) => {
      console.log("MetaMask accounts changed:", accounts);
      if (accounts.length > 0) {
        setMetamaskAccounts(accounts);
        const provider = new ethers.BrowserProvider(ethereum);
        setMetamaskProvider(provider);
        const signer = await provider.getSigner();
        setMetamaskSigner(signer);
        toast.info("MetaMask account changed. Reconnecting signer...");
        setActiveWallet('metamask');
      } else {
        resetMetamaskWalletData();
        toast.warn("MetaMask Wallet disconnected or no accounts available.");
        setActiveWallet(null);
      }
    };

    const handleMetamaskChainChanged = async (chainId: string) => {
      console.log("MetaMask network changed to Chain ID:", chainId);
      toast.info(`MetaMask network changed. Please check your wallet.`);
      const provider = new ethers.BrowserProvider(ethereum);
      setMetamaskProvider(provider);
      const signer = await provider.getSigner();
      setMetamaskSigner(signer);
      const network = await provider.getNetwork();
      setMetamaskNetwork(network.name);
      setMetamaskChainId(Number(network.chainId));
      setActiveWallet('metamask');
    };

    const handleMetamaskDisconnect = (error: any) => {
      console.warn("MetaMask disconnected event:", error);
      resetMetamaskWalletData();
      toast.warn("MetaMask Wallet disconnected (event).");
      setActiveWallet(null);
    };

    try {
      ethereum.on('accountsChanged', handleMetamaskAccountsChanged);
      ethereum.on('chainChanged', handleMetamaskChainChanged);
      if (typeof (ethereum as any).disconnect === 'function') {
        ethereum.on('disconnect', handleMetamaskDisconnect);
      }
    } catch (e) {
      console.error("Error setting up MetaMask listeners (on):", e);
    }

    return () => {
      try {
        if (typeof ethereum.removeListener === 'function') {
          ethereum.removeListener('accountsChanged', handleMetamaskAccountsChanged);
          ethereum.removeListener('chainChanged', handleMetamaskChainChanged);
          if (typeof (ethereum as any).removeListener === 'function' && typeof (ethereum as any).disconnect === 'function') {
            ethereum.removeListener('disconnect', handleMetamaskDisconnect);
          }
        }
      } catch (e) {
        console.error("Error cleaning up MetaMask listeners (off):", e);
      }
    };
  }, [resetMetamaskWalletData]);

  // BARU: Efek untuk memeriksa dan mendeteksi instalasi Sui Wallet
  useEffect(() => {
    const checkSuiWalletInstallation = async () => {
      // Perbaikan di sini: Cukup cek keberadaan suiWalletProvider
      if (suiWalletProvider) {
        setIsSuiWalletInstalled(true);
        try {
          // Periksa apakah `getAccounts` ada sebelum memanggilnya
          if (suiWalletProvider.getAccounts) {
            const accounts = await suiWalletProvider.getAccounts();
            if (accounts && accounts.length > 0) {
              setSuiAccounts(accounts.map((acc: { address: string }) => acc.address));
              // Periksa apakah `getNetwork` ada sebelum memanggilnya
              if (suiWalletProvider.getNetwork) {
                const network = await suiWalletProvider.getNetwork();
                setSuiNetwork(network);
              }
              setActiveWallet('sui');
            }
          } else {
            console.warn("Sui Wallet provider found, but getAccounts method is missing.");
          }
        } catch (e) {
          console.error("Error checking Sui Wallet accounts on load:", e);
        }
      } else {
        setIsSuiWalletInstalled(false);
      }
    };
    checkSuiWalletInstallation();
  }, [suiWalletProvider, setIsSuiWalletInstalled]); // Tambahkan setIsSuiWalletInstalled ke dependencies

  // BARU: Efek untuk mendengarkan perubahan pada Sui Wallet
  useEffect(() => {
    if (suiWalletProvider && typeof suiWalletProvider.on === 'function' && typeof suiWalletProvider.off === 'function') {
      const handleSuiAccountsChanged = async (accounts: { address: string }[]) => {
        console.log("Sui Wallet accounts changed:", accounts);
        if (accounts.length > 0) {
          setSuiAccounts(accounts.map(acc => acc.address));
          toast.info("Sui Wallet account changed.");
          setActiveWallet('sui');
        } else {
          resetSuiWalletData();
          toast.warn("Sui Wallet disconnected or no accounts available.");
          setActiveWallet(null);
        }
      };

      const handleSuiNetworkChanged = async (network: string) => {
        console.log("Sui Wallet network changed to:", network);
        setSuiNetwork(network);
        toast.info(`Sui Wallet network changed to: ${network}`);
        setActiveWallet('sui');
      };

      const handleSuiDisconnect = () => {
        console.warn("Sui Wallet disconnected event.");
        resetSuiWalletData();
        toast.warn("Sui Wallet disconnected (event).");
        setActiveWallet(null);
      };

      try {
        suiWalletProvider.on('accountsChanged', handleSuiAccountsChanged);
        suiWalletProvider.on('networkChange', handleSuiNetworkChanged); // Perhatikan: event name bisa berbeda (networkChange/networkChanged)
        suiWalletProvider.on('disconnect', handleSuiDisconnect);
      } catch (e) {
        console.error("Error setting up Sui Wallet listeners (on):", e);
      }

      return () => {
        try {
          suiWalletProvider.off('accountsChanged', handleSuiAccountsChanged);
          suiWalletProvider.off('networkChange', handleSuiNetworkChanged);
          suiWalletProvider.off('disconnect', handleSuiDisconnect);
        } catch (e) {
          console.error("Error cleaning up Sui Wallet listeners (off):", e);
        }
      };
    }
  }, [suiWalletProvider, resetSuiWalletData, setActiveWallet, setSuiAccounts, setSuiNetwork]); // Tambahkan semua dependencies

  // Efek untuk memastikan hanya satu wallet yang aktif (opsional, tapi bagus untuk konsistensi UI)
  useEffect(() => {
    if (starkeyAccounts.length > 0) {
      setActiveWallet('starkey');
      resetMetamaskWalletData();
      resetSuiWalletData(); // <--- BARU: Reset Sui jika Starkey aktif
    } else if (metamaskAccounts.length > 0) {
      setActiveWallet('metamask');
      resetStarkeyWalletData();
      resetSuiWalletData(); // <--- BARU: Reset Sui jika Metamask aktif
    } else if (suiAccounts.length > 0) { // <--- BARU: Cek Sui Wallet
      setActiveWallet('sui');
      resetStarkeyWalletData();
      resetMetamaskWalletData();
    } else {
      setActiveWallet(null);
    }
  }, [starkeyAccounts, metamaskAccounts, suiAccounts, resetMetamaskWalletData, resetStarkeyWalletData, resetSuiWalletData]);


  // --- FUNGSI KONEKSI STARKEY WALLET ---
  const connectStarkeyWallet = useCallback(async () => {
    if (!isStarkeyInstalled || !supraProvider) {
      toast.error("StarKey Wallet is not installed or not detected. Please install the extension.");
      return;
    }
    try {
      await supraProvider.connect();
      await updateStarkeyAccounts();
      toast.success("StarKey Wallet connected!");
      setIsConnectModalOpen(false);
    } catch (e: any) {
      console.error("Error connecting StarKey Wallet:", e);
      toast.error(`Connection failed: ${e.message || "User rejected connection."}`);
      setStarkeyAccounts([]);
    }
  }, [isStarkeyInstalled, supraProvider, updateStarkeyAccounts]);

  const disconnectStarkeyWallet = useCallback(async () => {
    if (supraProvider) {
      try {
        await supraProvider.disconnect();
      } catch (e) {
        console.error("Error during Starkey disconnect:", e);
      }
    }
    resetStarkeyWalletData();
    toast.info("StarKey Wallet disconnected.");
    setActiveWallet(null);
  }, [supraProvider, resetStarkeyWalletData]);

  const switchToStarkeyNetwork = useCallback(async (chainId: string) => {
    if (supraProvider) {
      try {
        await supraProvider.changeNetwork({ chainId });
        await getStarkeyNetworkData();
        toast.success(`Switched to network: ${chainId}`);
      } catch (e: any) {
        console.error("Error switching network:", e);
        toast.error(`Failed to switch network: ${e.message || "Error"}`);
      }
    }
  }, [supraProvider, getStarkeyNetworkData]);


  // --- FUNGSI KONEKSI METAMASK WALLET ---
  const connectMetamaskWallet = useCallback(async () => {
    const { ethereum } = window as any;

    if (typeof ethereum === 'undefined') {
      setIsMetamaskInstalled(false);
      toast.error("MetaMask is not installed. Please install it to connect.");
      return;
    }
    setIsMetamaskInstalled(true);
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      setMetamaskAccounts(accounts as string[]);

      const provider = new ethers.BrowserProvider(ethereum);
      setMetamaskProvider(provider);

      const signer = await provider.getSigner();
      setMetamaskSigner(signer);

      const network = await provider.getNetwork();
      setMetamaskNetwork(network.name);
      setMetamaskChainId(Number(network.chainId));

      toast.success(`MetaMask Connected! Address: ${accounts[0]?.substring(0, 6)}...`);
      setActiveWallet('metamask');
      setIsConnectModalOpen(false);
    } catch (error: any) {
      console.error("Error connecting MetaMask:", error);
      if (error.code === 4001) {
        toast.warn("MetaMask connection rejected by user.");
      } else {
        toast.error(`MetaMask connection failed: ${error.message || "Unknown error"}`);
      }
      resetMetamaskWalletData();
    }
  }, [resetMetamaskWalletData]);

  const disconnectMetamaskWallet = useCallback(() => {
    resetMetamaskWalletData();
    toast.info("MetaMask disconnected.");
    setActiveWallet(null);
  }, [resetMetamaskWalletData]);

  // --- BARU: FUNGSI KONEKSI SUI WALLET ---
  const connectSuiWallet = useCallback(async () => {
    if (!isSuiWalletInstalled || !suiWalletProvider) {
      toast.error("Sui Wallet is not installed or not detected. Please install the extension.");
      return;
    }
    try {
      // Connect ke Sui Wallet
      // Periksa apakah `connect` ada sebelum memanggilnya
      if (suiWalletProvider.connect) {
        const connectResult = await suiWalletProvider.connect();
        const accounts = connectResult.accounts.map((acc: { address: string }) => acc.address);
        setSuiAccounts(accounts);
        // Periksa apakah `getNetwork` ada sebelum memanggilnya
        if (suiWalletProvider.getNetwork) {
          const network = await suiWalletProvider.getNetwork();
          setSuiNetwork(network);
        }

        toast.success(`Sui Wallet Connected! Address: ${accounts[0]?.substring(0, 6)}...`);
        setActiveWallet('sui');
        setIsConnectModalOpen(false); // Tutup modal setelah koneksi
      } else {
        toast.error("Sui Wallet connect method not found.");
      }
    } catch (e: any) {
      console.error("Error connecting Sui Wallet:", e);
      toast.error(`Connection failed: ${e.message || "User rejected connection."}`);
      setSuiAccounts([]);
    }
  }, [isSuiWalletInstalled, suiWalletProvider, setActiveWallet, setSuiAccounts, setSuiNetwork, setIsConnectModalOpen]); // Tambahkan semua dependencies

  // BARU: Fungsi disconnect Sui Wallet
  const disconnectSuiWallet = useCallback(async () => {
    if (suiWalletProvider) {
      try {
        // Periksa apakah `disconnect` ada sebelum memanggilnya
        if (suiWalletProvider.disconnect) {
          await suiWalletProvider.disconnect();
        } else {
          console.warn("Sui Wallet disconnect method not found.");
        }
      } catch (e) {
        console.error("Error during Sui Wallet disconnect:", e);
      }
    }
    resetSuiWalletData();
    toast.info("Sui Wallet disconnected.");
    setActiveWallet(null);
  }, [suiWalletProvider, resetSuiWalletData, setActiveWallet]);

  const handleDisconnectWallet = useCallback(async () => {
    if (activeWallet === 'starkey') {
      await disconnectStarkeyWallet();
    } else if (activeWallet === 'metamask') {
      disconnectMetamaskWallet();
    } else if (activeWallet === 'sui') { // <--- BARU: Handle disconnect Sui
      await disconnectSuiWallet();
    }
    setActiveWallet(null);
  }, [activeWallet, disconnectStarkeyWallet, disconnectMetamaskWallet, disconnectSuiWallet, setActiveWallet]);


  const handleChangeWallet = useCallback(() => {
    handleDisconnectWallet();
    setIsConnectModalOpen(true);
  }, [handleDisconnectWallet, setIsConnectModalOpen]);


  // Token and price state (tidak berubah)
  const [fromToken, setFromToken] = useState<TokenSymbol>('WETH');
  const [toToken, setToToken] = useState<TokenSymbol>('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [priceData, setPriceData] = useState<{ [key: string]: number }>({});
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [lastEditedField, setLastEditedField] = useState<string | null>(null);
  const [slippageTolerance, setSlippageTolerance] = useState<number>(0.5);

  const tokenList = useMemo<TokenSymbol[]>(() => [
    'ETH', 'USDC', 'USDT', 'WETH', 'BTC', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE',
    'SHIB', 'AVAX', 'DOT', 'LINK', 'MATIC', 'LTC', 'BCH', 'XLM', 'UNI', 'WBTC',
    'TRX', 'ATOM', 'NEAR', 'ICP', 'SUPRA'
  ], []);

  const coingeckoIdMap = useMemo<Record<TokenSymbol, string>>(() => ({
    'SUPRA': 'supra-token',
    'USDC': 'usd-coin',
    'USDT': 'tether',
    'WETH': 'ethereum',
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binancecoin',
    'SOL': 'solana',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'DOGE': 'dogecoin',
    'SHIB': 'shiba-inu',
    'AVAX': 'avalanche-2',
    'DOT': 'polkadot',
    'LINK': 'chainlink',
    'MATIC': 'polygon',
    'LTC': 'litecoin',
    'BCH': 'bitcoin-cash',
    'XLM': 'stellar',
    'UNI': 'uniswap',
    'WBTC': 'wrapped-bitcoin',
    'TRX': 'tron',
    'ATOM': 'cosmos',
    'NEAR': 'near',
    'ICP': 'internet-computer'
  }), []);

  const fetchLivePrice = useCallback(async () => {
    setLoadingPrice(true);

    const idsToFetch = tokenList.filter(token => token !== 'SUPRA').map(token => coingeckoIdMap[token]).join(',');
    const supraFallbackPrice = 0.0024;

    try {
      const newPriceData: { [key: string]: number } = {};
      newPriceData['SUPRA'] = supraFallbackPrice;

      if (idsToFetch) {
        const response = await axios.get<CoinGeckoPriceData>(
          `https://api.coingecko.com/api/v3/simple/price?ids=${idsToFetch}&vs_currencies=usd`,
          { headers: { 'Accept': 'application/json' } }
        );

        const fetchedData = response.data;

        for (const appTokenSymbol of tokenList) {
          if (appTokenSymbol === 'SUPRA') continue;

          const coingeckoId = coingeckoIdMap[appTokenSymbol];
          const price = fetchedData[coingeckoId]?.usd;

          newPriceData[appTokenSymbol] = price || 0;
        }
      }

      setPriceData(newPriceData);
      toast.success("Live prices updated! Using fallback for SUPRA.");

    } catch (error: any) {
      console.error("Error fetching live price from CoinGecko:", error.message);
      setPriceData({
        'SUPRA': supraFallbackPrice,
        'USDC': 1, 'USDT': 1, 'WETH': 2000, 'BTC': 60000, 'ETH': 3000,
        'BNB': 500, 'SOL': 150, 'XRP': 0.5, 'ADA': 0.4, 'DOGE': 0.15,
        'SHIB': 0.000008, 'AVAX': 30, 'DOT': 7, 'LINK': 15, 'MATIC': 0.7,
        'LTC': 70, 'BCH': 400, 'XLM': 0.1, 'UNI': 10, 'WBTC': 60000,
        'TRX': 0.1, 'ATOM': 8, 'NEAR': 5, 'ICP': 8
      });
      toast.error("Failed to fetch live prices from CoinGecko. Using fallback prices.");
    } finally {
      setLoadingPrice(false);
    }
  }, [coingeckoIdMap, tokenList]);

  useEffect(() => {
    fetchLivePrice();
    const interval = setInterval(fetchLivePrice, 60000);
    return () => clearInterval(interval);
  }, [fetchLivePrice]);

  const getExchangeRate = useCallback((from: string, to: string) => {
    const fromPrice = priceData[from as TokenSymbol] || 0;
    const toPrice = priceData[to as TokenSymbol] || 0;

    if (fromPrice <= 0 || toPrice <= 0) return 0;
    return fromPrice / toPrice;
  }, [priceData]);

  useEffect(() => {
    if (lastEditedField === 'from' && fromAmount) {
      const rate = getExchangeRate(fromToken, toToken);
      if (rate > 0) {
        const calculatedAmount = parseFloat(fromAmount) * rate;
        setToAmount(calculatedAmount.toFixed(6));
      } else {
        setToAmount('');
      }
    } else if (lastEditedField === 'to' && toAmount) {
      const rate = getExchangeRate(toToken, fromToken);
      if (rate > 0) {
        const calculatedAmount = parseFloat(toAmount) * rate;
        setFromAmount(calculatedAmount.toFixed(6));
      } else {
        setFromAmount('');
      }
    }
  }, [fromAmount, toAmount, fromToken, toToken, getExchangeRate, lastEditedField]);

  const handleFromAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setFromAmount(value);
      setLastEditedField('from');
    }
  }, []);

  const handleToAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setToAmount(value);
      setLastEditedField('to');
    }
  }, []);

  const handleTokenSwap = useCallback(() => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);

    if (fromAmount || toAmount) {
      const tempAmount = fromAmount;
      setFromAmount(toAmount);
      setToAmount(tempAmount);
    }
    setLastEditedField(lastEditedField === 'from' ? 'to' : 'from');
  }, [fromToken, toToken, fromAmount, toAmount, lastEditedField]);


  const executeSwap = useCallback(async () => {
    if (!activeWallet) {
      toast.warn("Please connect your wallet to proceed with swap.");
      setIsConnectModalOpen(true);
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast.error("Please enter a valid amount to swap.");
      return;
    }

    if (activeWallet === 'starkey') {
      if (starkeyAccounts.length === 0 || !supraProvider) {
        toast.error("StarKey Wallet is not connected or ready.");
        return;
      }

      const txExpiryTime = (Math.ceil(Date.now() / 1000) + 30);
      const optionalTransactionPayloadArgs = { txExpiryTime };
      const rawTxPayload = [
        starkeyAccounts[0],
        0,
        "0000000000000000000000000000000000000000000000000000000000000001",
        "supra_account",
        "transfer",
        [],
        // ... (lanjutan payload StarKey Anda)
        // Ini adalah contoh payload, Anda perlu menyesuaikannya dengan fungsi swap yang sebenarnya
        // new HexString("0x8de4158b48633d853186d5fc790718e5821d7d3c4855e06bcd97b105389a7d0f").toUint8Array(),
        // BCS.bcsSerializeUint64(parseFloat(fromAmount) * 1_000_000)
      ];

      try {
        toast.info("Creating raw transaction data for StarKey...");
        // const data = await supraProvider.createRawTransactionData(rawTxPayload);
        // if (data) {
        //   const params = { data: data };
        //   toast.info("Sending transaction to StarKey for signing...");
        //   const txHash = await supraProvider.sendTransaction(params);
        //   console.log("StarKey Transaction Hash:", txHash);
        //   toast.success(`StarKey Transaction sent! Hash: ${txHash}`);
        //   setFromAmount('');
        //   setToAmount('');
        // }
        // Simulasi
        console.log("StarKey Swap Payload (Simulasi):", rawTxPayload);
        toast.success("Simulasi Swap StarKey berhasil!");
        setFromAmount('');
        setToAmount('');
      } catch (e: any) {
        console.error("Error sending raw transaction with StarKey:", e);
        toast.error(`StarKey Transaction failed: ${e.message || "User rejected transaction."}`);
      }

    } else if (activeWallet === 'metamask') {
      const { ethereum } = window as any;

      if (!ethereum) {
        toast.error("MetaMask is not detected. Please install it.");
        setIsMetamaskInstalled(false);
        return;
      }

      if (metamaskSigner === null || metamaskAccounts.length === 0) {
        toast.info("MetaMask not connected or signer not ready. Attempting to connect...");
        await connectMetamaskWallet();
        if (metamaskSigner === null || metamaskAccounts.length === 0) {
          toast.error("Failed to connect MetaMask. Please ensure it's unlocked and connected.");
          return;
        }
      }

      const getSwapRouterAddress = (chainId: number): string | null => {
        switch (chainId) {
          case 1:
            return "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
          case 56:
            return "0x10ED43B718714eb63d5aA57B78B54704E256024E";
          case 137:
            return "0x1b02dA8Cb0d097e538CfA0933556Fd7a9bbF6E2D";
          case 11155111:
            return "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
          default:
            return null;
        }
      };

      const SWAP_CONTRACT_ADDRESS = metamaskChainId ? getSwapRouterAddress(metamaskChainId) : null;
      if (!SWAP_CONTRACT_ADDRESS || SWAP_CONTRACT_ADDRESS === ethers.ZeroAddress) {
        toast.error(`No valid swap router configured for chain ID ${metamaskChainId}.`);
        return;
      }

      const SWAP_CONTRACT_ABI = [
        "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
        "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
        "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)"
      ];

      const getTokenAddress = (symbol: TokenSymbol, chainId: number | null): string | null => {
        const ethMainnetTokens: Partial<Record<TokenSymbol, string>> = {
          'USDC': "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          'USDT': "0xdAC17F958D2ee523a2206206994597C13D831ec7",
          'WETH': "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          'BTC': "0x2260FAC54f54Cf469C52E16BF67F6Cc954Ef5678",
          'SHIB': "0x95aD61b0a150d79219dCEa23269Dd19a62fF0BdD",
          'LINK': "0x514910771af9ca65e378cba89b9174270ae9cdb3",
          'UNI': "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
        };

        const bscMainnetTokens: Partial<Record<TokenSymbol, string>> = {
          'USDC': "0x8AC76a51cc950d9822D68b83F72aA92Dc06dEb3d",
          'USDT': "0x55d398326f99059fF775485246999027B3197955",
          'WETH': "0x2170Ed0880ac9A755fd29B268895Bf972aCc53Ee",
          'BNB': "0xbb4CdB9eD5B3d29aeeC1DCDc3d09a0ABee5830",
        };

        const polygonMainnetTokens: Partial<Record<TokenSymbol, string>> = {
          'USDC': "0x2791Bca1f2de4661ED88A30C99A7a9214Ef89bc7",
          'USDT': "0xc2132D05D31c914a87C66119CFAf01602FfE03Cc",
          'WETH': "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
          'MATIC': "0x0d500B1d8E8ef31E21C99d1Db9A6444d3ADf1270",
        };

        const sepoliaTestnetTokens: Partial<Record<TokenSymbol, string>> = {
            'USDC': "0x1c7D4B196Cb0C7B01d743928Fd6FBC7adf62E334",
            'USDT': "0x40a3692a7C8D12F2A832B6E67b5D90aC8681284A",
            'WETH': "0xfFf9976782d46cC05630D1f6eB2e2ED03EbF8dcA",
        };

        if (symbol === 'SUPRA') {
            if (chainId === 11155111) {
                // return "0xYourSupraTokenAddressOnSepolia";
            }
            toast.error(`SUPRA is not supported on EVM network (Chain ID: ${chainId}) for MetaMask swap, or its address is not configured.`);
            return null;
        }

        switch (chainId) {
          case 1:
            return ethMainnetTokens[symbol] || null;
          case 56:
            return bscMainnetTokens[symbol] || null;
          case 137:
            return polygonMainnetTokens[symbol] || null;
          case 11155111:
            return sepoliaTestnetTokens[symbol] || null;
          default:
            toast.error(`Token address for ${symbol} not configured for current network (Chain ID: ${chainId}).`);
            return null;
        }
      };

      const getTokenDecimals = (symbol: TokenSymbol): number => {
        const decimals: Partial<Record<TokenSymbol, number>> = {
          'USDC': 6, 'USDT': 6, 'WETH': 18, 'ETH': 18, 'BTC': 8, 'BNB': 18, 'SOL': 9,
          'SUPRA': 18,
          'XRP': 6, 'ADA': 6, 'DOGE': 8, 'SHIB': 18, 'AVAX': 18,
          'DOT': 10, 'LINK': 18, 'MATIC': 18, 'LTC': 8, 'BCH': 8, 'XLM': 7,
          'UNI': 18, 'WBTC': 8, 'TRX': 6, 'ATOM': 6, 'NEAR': 24, 'ICP': 8,
        };
        return decimals[symbol] || 18;
      };

      try {
        if (!metamaskSigner) {
          toast.error("MetaMask signer is not available. Please try connecting again.");
          return;
        }

        const swapContract = new Contract(SWAP_CONTRACT_ADDRESS, SWAP_CONTRACT_ABI, metamaskSigner);

        const fromDecimals = getTokenDecimals(fromToken);
        const toDecimals = getTokenDecimals(toToken);

        const amountIn = ethers.parseUnits(fromAmount, fromDecimals);

        const fromTokenAddress = getTokenAddress(fromToken, metamaskChainId);
        const toTokenAddress = getTokenAddress(toToken, metamaskChainId);

        const isFromTokenNative = ['ETH', 'BNB', 'MATIC'].includes(fromToken);
        const isToTokenNative = ['ETH', 'BNB', 'MATIC'].includes(toToken);

        if (!isFromTokenNative && (fromTokenAddress === null || fromTokenAddress === ethers.ZeroAddress)) {
          toast.error(`Invalid or unconfigured ERC-20 address for ${fromToken} on the current network (${metamaskNetwork}).`);
          return;
        }
        if (!isToTokenNative && (toTokenAddress === null || toTokenAddress === ethers.ZeroAddress)) {
          toast.error(`Invalid or unconfigured ERC-20 address for ${toToken} on the current network (${metamaskNetwork}).`);
          return;
        }

        let path: string[] = [];
        let WNATIVE_ADDRESS: string | null = null;

        if (metamaskChainId === 1) WNATIVE_ADDRESS = getTokenAddress('WETH', 1);
        else if (metamaskChainId === 56) WNATIVE_ADDRESS = getTokenAddress('BNB', 56);
        else if (metamaskChainId === 137) WNATIVE_ADDRESS = getTokenAddress('MATIC', 137);
        else if (metamaskChainId === 11155111) WNATIVE_ADDRESS = getTokenAddress('WETH', 11155111);

        if (!WNATIVE_ADDRESS || WNATIVE_ADDRESS === ethers.ZeroAddress) {
            toast.error("Wrapped native token (WETH/WBNB/WMATIC) address not configured for this network.");
            return;
        }

        if (isFromTokenNative) {
          path = [WNATIVE_ADDRESS, toTokenAddress!];
        } else if (isToTokenNative) {
          path = [fromTokenAddress!, WNATIVE_ADDRESS];
        } else {
          path = [fromTokenAddress!, toTokenAddress!];
        }

        if (path.length < 2) {
            toast.error("Swap path could not be determined. Please check token selection.");
            return;
        }
        if (path.some(addr => addr === ethers.ZeroAddress || addr === null)) {
            toast.error("Swap path contains an invalid (zero) token address. Please check token configurations.");
            return;
        }

        const deadline = Math.floor(Date.now() / 1000) + (60 * 20);

        toast.info(`Preparing MetaMask swap from ${fromToken} to ${toToken}...`);

        if (!isFromTokenNative) {
          const fromTokenERC20Contract = new Contract(fromTokenAddress!, ["function approve(address spender, uint256 amount) returns (bool)", "function allowance(address owner, address spender) view returns (uint256)"], metamaskSigner);
          const currentAllowance = await fromTokenERC20Contract.allowance(metamaskAccounts[0], SWAP_CONTRACT_ADDRESS);

          if (currentAllowance < amountIn) {
            toast.info(`Approving ${fromToken} for swap... Current allowance: ${ethers.formatUnits(currentAllowance, fromDecimals)}`);
            try {
                const approveTx = await fromTokenERC20Contract.approve(SWAP_CONTRACT_ADDRESS, ethers.MaxUint256);
                await approveTx.wait();
                toast.success("Token approved for swap!");
            } catch (approveError: any) {
                console.error("Error during approve transaction:", approveError);
                if (approveError.code === 'ACTION_REJECTED' || approveError.code === 4001) {
                    toast.error("Approve transaction rejected by user.");
                } else {
                    toast.error(`Failed to approve ${fromToken}. Error: ${approveError.reason || approveError.message}`);
                }
                return;
            }
          } else {
            toast.info("Token already approved for swap, or sufficient allowance exists.");
          }
        }

        let tx;
        const amountsOutResult = await swapContract.getAmountsOut(amountIn, path);
        const expectedAmountOut = amountsOutResult[amountsOutResult.length - 1];

        const minAmountOutPercentage = 1 - (slippageTolerance / 100);
        const amountOutMin = (BigInt(expectedAmountOut.toString()) * BigInt(Math.floor(minAmountOutPercentage * 10000))) / BigInt(10000);

        if (isFromTokenNative) {
            tx = await swapContract.swapExactETHForTokens(
                amountOutMin,
                path,
                metamaskAccounts[0],
                deadline,
                { value: amountIn }
            );
        } else if (isToTokenNative) {
            tx = await swapContract.swapExactTokensForETH(
                amountIn,
                amountOutMin,
                path,
                metamaskAccounts[0],
                deadline
            );
        } else {
          tx = await swapContract.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            metamaskAccounts[0],
            deadline
          );
        }

        if (!tx) {
            toast.error("Transaction object could not be created. Check swap logic.");
            return;
        }

        toast.info("Sending MetaMask transaction for swap...");
        const receipt = await tx.wait();
        console.log("MetaMask Swap Transaction Receipt:", receipt);
        toast.success(`MetaMask Swap successful! Hash: ${receipt?.hash}`);
        setFromAmount('');
        setToAmount('');

      } catch (error: any) {
        console.error("Error executing MetaMask swap:", error);

        if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
          toast.error("MetaMask transaction rejected by user.");
        } else if (error.message.includes("insufficient funds") || error.code === 'INSUFFICIENT_FUNDS') {
          toast.error("Insufficient funds for transaction. Check your balance.");
        } else if (error.message.includes("TransferHelper: TRANSFER_FROM_FAILED")) {
            toast.error("Swap failed: Allowance not sufficient or token balance too low. Please check approval and balance.");
        } else if (error.message.includes("INSUFFICIENT_LIQUIDITY")) {
            toast.error("Swap failed: Insufficient liquidity for this pair on the DEX.");
        } else if (error.message.includes("TOO_LITTLE_RECEIVED")) {
            toast.error("Swap failed: Price slippage too high or amountOutMin too strict. Try increasing slippage tolerance (e.g., 1%).");
        }
        else if (error.reason) {
          toast.error(`MetaMask Swap failed: ${error.reason}`);
        } else {
          toast.error(`MetaMask Swap failed: ${error.message || "Unknown error"}`);
        }
      }
    } else if (activeWallet === 'sui') { // <--- BARU: Logika swap untuk Sui Wallet
        if (suiAccounts.length === 0 || !suiWalletProvider) {
            toast.error("Sui Wallet is not connected or ready.");
            return;
        }
        toast.info("Simulasi Swap dengan Sui Wallet...");
        console.log("Sui Account:", suiAccounts[0]);
        console.log("From Token:", fromToken);
        console.log("To Token:", toToken);
        console.log("From Amount:", fromAmount);
        console.log("To Amount:", toAmount);

        try {
            // Ini adalah contoh placeholder untuk transaksi Sui.
            // Anda perlu mengimplementasikan logika transaksi Sui yang sebenarnya di sini,
            // menggunakan @mysten/sui.js atau SDK Sui lainnya.
            // Contoh:
            // const tx = new TransactionBlock();
            // tx.moveCall({
            //     target: '0x...::swap_module::swap', // Ganti dengan target fungsi swap Anda
            //     arguments: [
            //         tx.pure(fromTokenObjectId),
            //         tx.pure(toTokenObjectId),
            //         tx.pure(parseFloat(fromAmount)),
            //     ],
            // });
            // const result = await suiWalletProvider.signAndExecuteTransactionBlock({
            //     transactionBlock: tx,
            // });
            // toast.success(`Sui Swap berhasil! Digest: ${result.digest}`);

            toast.success("Simulasi Swap Sui Wallet berhasil!");
            setFromAmount('');
            setToAmount('');
        } catch (e: any) {
            console.error("Error executing Sui Wallet swap:", e);
            toast.error(`Sui Swap gagal: ${e.message || "Kesalahan tidak dikenal"}`);
        }
    }
  }, [activeWallet, starkeyAccounts, supraProvider, fromAmount, toAmount, metamaskSigner, metamaskAccounts, fromToken, toToken, connectMetamaskWallet, metamaskChainId, metamaskNetwork, slippageTolerance, suiAccounts, suiWalletProvider, setIsMetamaskInstalled]); // Tambahkan setIsMetamaskInstalled ke dependencies


  const getConnectedAccount = useMemo(() => {
    if (activeWallet === 'starkey' && starkeyAccounts.length > 0) {
      return starkeyAccounts[0];
    }
    if (activeWallet === 'metamask' && metamaskAccounts.length > 0) {
      return metamaskAccounts[0];
    }
    if (activeWallet === 'sui' && suiAccounts.length > 0) { // <--- BARU: Dapatkan akun Sui
      return suiAccounts[0];
    }
    return null;
  }, [activeWallet, starkeyAccounts, metamaskAccounts, suiAccounts]);

  const getConnectedNetwork = useMemo(() => {
    if (activeWallet === 'starkey' && starkeyNetworkData) {
      return starkeyNetworkData.chainId || 'Unknown Starkey Network';
    }
    if (activeWallet === 'metamask' && metamaskNetwork) {
      return metamaskNetwork;
    }
    if (activeWallet === 'sui' && suiNetwork) { // <--- BARU: Dapatkan jaringan Sui
      return suiNetwork;
    }
    return null;
  }, [activeWallet, starkeyNetworkData, metamaskNetwork, suiNetwork]);

  const renderPage = useCallback(() => {
    // ... (fungsi renderPage Anda yang sudah ada, tidak perlu perubahan di sini)
    // Pastikan `executeSwap` tetap dipanggil di tombol swap
    return (
      <div className="swap-container">
        <h1>Swap Tokens</h1>
        <div className="input-group">
          <label>From</label>
          <input type="text" placeholder="0.0" value={fromAmount} onChange={handleFromAmountChange} />
          <select value={fromToken} onChange={(e) => { setFromToken(e.target.value as TokenSymbol); setLastEditedField('from'); }}>
            {tokenList.map(token => <option key={token} value={token}>{token}</option>)}
          </select>
        </div>
        <button className="swap-button-icon" onClick={handleTokenSwap}>↔</button>
        <div className="input-group">
          <label>To</label>
          <input type="text" placeholder="0.0" value={toAmount} onChange={handleToAmountChange} />
          <select value={toToken} onChange={(e) => { setToToken(e.target.value as TokenSymbol); setLastEditedField('to'); }}>
            {tokenList.map(token => <option key={token} value={token}>{token}</option>)}
          </select>
        </div>
        <div className="info-row">
          <span>Rate:</span>
          <span>1 {fromToken} = {getExchangeRate(fromToken, toToken).toFixed(6)} {toToken}</span>
        </div>
        <div className="info-row">
          <span>Slippage Tolerance:</span>
          <input
            type="number"
            value={slippageTolerance}
            onChange={(e) => setSlippageTolerance(parseFloat(e.target.value))}
            min="0.1"
            step="0.1"
            className="slippage-input"
          />%
        </div>
        <button className="connect-button" onClick={executeSwap} disabled={loadingPrice}>
          {loadingPrice ? 'Loading Prices...' : 'Swap'}
        </button>
      </div>
    );
  }, [fromAmount, handleFromAmountChange, fromToken, handleTokenSwap, toAmount, handleToAmountChange, toToken, tokenList, getExchangeRate, slippageTolerance, executeSwap, loadingPrice]);


  const TradeSubTabs = useCallback(() => (
    <div className="swap-tabs">
        <button
            onClick={() => setActivePage('swap')}
            className={`tab-button ${activePage === 'swap' ? 'active' : ''}`}
        >
            Swap
        </button>
        <button
            onClick={() => setActivePage('dca')}
            className={`tab-button ${activePage === 'dca' ? 'active' : ''}`}
        >
            DCA
        </button>
    </div>
  ), [activePage, setActivePage]);

  const renderPageContent = useCallback(() => {
    const showTradeSubTabs = activePage === 'swap' || activePage === 'dca';

    return (
      <div className="main-content">
        <div className="swap-container">
          <div className="swap-header">
            <h2 className="swap-title">
                {activePage === 'dca' ? 'DCA' :
                 activePage === 'bridge' ? 'Bridge' :
                 activePage === 'liquidity' ? 'Liquidity' :
                 activePage === 'token-nago' ? 'Token Nago' : 'Swap'}
            </h2>
            {showTradeSubTabs && <TradeSubTabs />}
          </div>

          {activePage === 'swap' && (
            <>
              <div className="input-group">
                <label htmlFor="fromAmount">You Pay</label>
                <input
                  type="text"
                  id="fromAmount"
                  value={fromAmount}
                  onChange={handleFromAmountChange}
                  placeholder="0.0"
                  className="amount-input"
                  autoComplete="off"
                />
                <select
                  value={fromToken}
                  onChange={(e) => { setFromToken(e.target.value as TokenSymbol); setLastEditedField('from'); }}
                  className="token-select"
                >
                  {tokenList.map(token => (
                    <option key={token} value={token}>{token}</option>
                  ))}
                </select>
              </div>

              <button onClick={handleTokenSwap} className="swap-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-arrow-down-circle"><circle cx="12" cy="12" r="10"></circle><polyline points="8 12 12 16 16 12"></polyline><line x1="12" y1="8" x2="12" y2="16"></line></svg>
              </button>

              <div className="input-group">
                <label htmlFor="toAmount">You Receive</label>
                <input
                  type="text"
                  id="toAmount"
                  value={toAmount}
                  onChange={handleToAmountChange}
                  placeholder="0.0"
                  className="amount-input"
                />
                <select
                  value={toToken}
                  onChange={(e) => { setToToken(e.target.value as TokenSymbol); setLastEditedField('to'); }}
                  className="token-select"
                >
                  {tokenList.map(token => (
                    <option key={token} value={token}>{token}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="slippage">Slippage Tolerance (%)</label>
                <input
                  type="number"
                  id="slippage"
                  value={slippageTolerance}
                  onChange={(e) => setSlippageTolerance(parseFloat(e.target.value))}
                  placeholder="0.5"
                  min="0"
                  step="0.1"
                  className="amount-input"
                />
              </div>

              {getConnectedAccount ? ( // Cek apakah ada wallet yang terhubung
                <button
                  onClick={executeSwap}
                  className={`execute-swap-button ${activeWallet === 'metamask' ? 'metamask-button' : ''}`}
                  disabled={!fromAmount || parseFloat(fromAmount) <= 0 || loadingPrice}
                >
                  Execute Swap ({activeWallet === 'starkey' ? 'StarKey' : activeWallet === 'metamask' ? 'MetaMask' : 'Sui'})
                </button>
              ) : (
                <button onClick={() => setIsConnectModalOpen(true)} className="execute-swap-button connect-prompt">
                  Connect Wallet to Swap
                </button>
              )}

              {loadingPrice ? (
                <p className="loading-message">Fetching prices...</p>
              ) : (
                priceData[fromToken] > 0 && priceData[toToken] > 0 ? (
                  <div className="rate-info">
                    <p>1 {fromToken} = {(getExchangeRate(fromToken, toToken)).toFixed(6)} {toToken}</p>
                  </div>
                ) : (
                  <p className="rate-display">Prices not available or loading.</p>
                )
              )}
            </>
          )}

          {activePage === 'dca' && <DcaPage />}
          {activePage === 'bridge' && <BridgePage />}
          {activePage === 'liquidity' && <LiquidityPage />}
          {activePage === 'token-nago' && <NagoTokenPage />}
        </div>
      </div>
    );
  }, [activePage, fromAmount, toAmount, fromToken, toToken, tokenList, activeWallet, loadingPrice, priceData, slippageTolerance, handleFromAmountChange, handleToAmountChange, handleTokenSwap, executeSwap, getExchangeRate, TradeSubTabs, getConnectedAccount, setIsConnectModalOpen]);


  return (
    <div className="App">
      <header className="main-header">
        <div className="logo-container">
          <span className="logo-text">NAGO SWAP</span>
        </div>

        <div className="hamburger-icon" onClick={() => setIsNavOpen(!isNavOpen)}>
          ☰
        </div>

        <nav className="main-nav" style={{ display: isNavOpen ? 'block' : '' }}>
          <ul className="nav-menu">
            <li className={`nav-item ${(activePage === 'swap' || activePage === 'dca') ? 'active' : ''}`}>
              <a href="#trade" onClick={() => { setActivePage('swap'); setIsNavOpen(false); }}>Trade</a>
            </li>
            <li className={`nav-item ${activePage === 'bridge' ? 'active' : ''}`}>
              <a href="#bridge" onClick={() => { setActivePage('bridge'); setIsNavOpen(false); }}>Bridge</a>
            </li>
            <li className={`nav-item ${activePage === 'liquidity' ? 'active' : ''}`}>
              <a href="#liquidity" onClick={() => { setActivePage('liquidity'); setIsNavOpen(false); }}>Liquidity</a>
            </li>
            <li className={`nav-item ${activePage === 'token-nago' ? 'active' : ''}`}>
              <a href="#token-nago" onClick={() => { setActivePage('token-nago'); setIsNavOpen(false); }}>Token Nago</a>
            </li>
          </ul>
        </nav>

        <div className="wallet-section">
          {getConnectedAccount ? (
            <>
              <ConnectedWalletDropdown
                address={getConnectedAccount}
                explorerUrl={
                  activeWallet === 'starkey'
                    ? `https://explorer.supraoracles.com/address/${getConnectedAccount}` // Ganti dengan URL explorer Supra yang sesuai
                    : activeWallet === 'metamask'
                      ? `https://${metamaskNetwork === 'sepolia' ? 'sepolia.' : ''}etherscan.io/address/${getConnectedAccount}`
                      : activeWallet === 'sui' // <--- BARU: URL Explorer Sui
                        ? `https://suiexplorer.com/address/${getConnectedAccount}?network=${suiNetwork || 'mainnet'}` // Sesuaikan network Sui
                        : '#'
                }
                onDisconnect={handleDisconnectWallet}
                onChangeWallet={handleChangeWallet}
                walletName={activeWallet === 'starkey' ? 'StarKey' : activeWallet === 'metamask' ? 'MetaMask' : 'Sui'}
              />
              {activeWallet === 'starkey' && (
                <select onChange={(e) => switchToStarkeyNetwork(e.target.value)} className="network-select" value={starkeyNetworkData?.chainId || "6"}>
                  <option value="6">Supra Testnet</option>
                  <option value="8">Supra Mainnet</option>
                </select>
              )}
              {/* Untuk MetaMask dan Sui, pemilihan jaringan biasanya diurus oleh ekstensi wallet itu sendiri */}
            </>
          ) : (
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="connect-wallet-button"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {renderPageContent()}

      <ToastContainer position="bottom-right" autoClose={3000} />

      {/* --- RENDER CONNECT WALLET MODAL --- */}
      <ConnectWalletModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnectStarkey={connectStarkeyWallet}
        onConnectMetamask={connectMetamaskWallet}
        onConnectSui={connectSuiWallet} // <--- BARU: Teruskan fungsi koneksi Sui
      />
      {/* ---------------------------------- */}
    </div>
  );
}

export default App;