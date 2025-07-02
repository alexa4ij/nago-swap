// src/Components/ConnectWalletModal.tsx
import React, { useCallback, useEffect, useRef } from 'react'; // Hapus useState yang tidak terpakai
import './ConnectWalletModal.css';

// Import Wallet Logos (Anda bisa unduh atau gunakan CDN)
// Untuk contoh, saya akan menggunakan beberapa placeholder.
import MetamaskLogo from './Metamask.svg';
import Starkeylogo from './Starkey.svg';
// Import logo Sui jika Anda punya, atau gunakan placeholder
import SuiLogo from './Sui.svg'; // Asumsi Anda punya logo Sui.svg

// Anda perlu menambahkan logo untuk wallet lain jika ingin menampilkannya
// Pastikan path logo benar:
// import PhantomLogo from '../assets/phantom-logo.svg';
// import BinanceLogo from '../assets/binance-logo.svg';
// ... dll.

interface WalletOption {
  id: string;
  name: string;
  logo: string;
  // Perbarui jenis konektor untuk menyertakan 'sui' dan 'walletconnect'
  connector: 'metamask' | 'starkey' | 'sui' | 'walletconnect';
}

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectStarkey: () => Promise<void>;
  onConnectMetamask: () => Promise<void>;
  onConnectSui: () => Promise<void>; // <--- DITAMBAHKAN: Prop untuk koneksi Sui Wallet
  // Tambahkan ini jika Anda benar-benar akan mengimplementasikan WalletConnect
  onConnectWalletConnect?: (walletId: string) => Promise<void>;
}

const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({
  isOpen,
  onClose,
  onConnectStarkey,
  onConnectMetamask,
  onConnectSui, // <--- DITAMBAHKAN: Destructuring prop onConnectSui
  onConnectWalletConnect // DITAMBAHKAN: WalletConnect prop
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const walletOptions: WalletOption[] = [
    { id: 'starkey', name: 'Starkey Wallet', logo: Starkeylogo, connector: 'starkey' },
    { id: 'metamask', name: 'MetaMask', logo: MetamaskLogo, connector: 'metamask' },
    { id: 'sui', name: 'Sui Wallet', logo: SuiLogo, connector: 'sui' }, // <--- DITAMBAHKAN: Opsi Sui Wallet
    // Contoh wallet lain yang menggunakan WalletConnect (Anda perlu mengimplementasikan logika WC)
   // { id: 'phantom', name: 'Phantom', logo: '/phantom-logo.svg', connector: 'walletconnect' },
   // { id: 'suiet', name: 'Suiet', logo: '/suiet-logo.svg', connector: 'walletconnect' },
   // { id: 'bybit', name: 'Bybit Wallet', logo: '/bybit-logo.svg', connector: 'walletconnect' },
   // { id: 'gate', name: 'Gate Wallet', logo: '/gate-logo.svg', connector: 'walletconnect' },
   // { id: 'okx', name: 'OKX', logo: '/okx-logo.svg', connector: 'walletconnect' },
   // { id: 'binance', name: 'Binance', logo: '/binance-logo.svg', connector: 'walletconnect' },
   // { id: 'martian', name: 'Martian', logo: '/martian-logo.svg', connector: 'walletconnect' },
   // { id: 'safepal', name: 'SafePal', logo: '/safepal-logo.svg', connector: 'walletconnect' },
   // { id: 'coin98', name: 'Coin98', logo: '/coin98-logo.svg', connector: 'walletconnect' },
   // { id: 'surf', name: 'Surf', logo: '/surf-logo.svg', connector: 'walletconnect' },
   // { id: 'nightly', name: 'Nightly', logo: '/nightly-logo.svg', connector: 'walletconnect' },
   // { id: 'tokenpocket', name: '/tokenpocket-logo.svg', logo: '/tokenpocket-logo.svg', connector: 'walletconnect' }, // Bug: id & logo sama. Ganti id menjadi 'tokenpocket'
   // { id: 'backpack', name: 'Backpack', logo: '/backpack-logo.svg', connector: 'walletconnect' },
  ];

  const handleWalletClick = useCallback(async (wallet: WalletOption) => {
    onClose(); // Tutup modal setelah pilihan

    switch (wallet.connector) {
      case 'starkey':
        await onConnectStarkey();
        break;
      case 'metamask':
        await onConnectMetamask();
        break;
      case 'sui': // <--- DITAMBAHKAN: Logika untuk Sui Wallet
        await onConnectSui();
        break;
      case 'walletconnect':
        if (onConnectWalletConnect) {
            await onConnectWalletConnect(wallet.id); // Teruskan id wallet ke fungsi WC
        } else {
            console.warn(`WalletConnect for ${wallet.name} not fully implemented or 'onConnectWalletConnect' prop is missing.`);
        }
        break;
      default:
        console.warn(`Konektor untuk ${wallet.name} tidak dikenali.`);
    }
  }, [onClose, onConnectStarkey, onConnectMetamask, onConnectSui, onConnectWalletConnect]); // Pastikan semua prop koneksi ada di dependency array

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content connect-wallet-modal" ref={modalRef}>
        <div className="modal-header">
          <h3>Connect a Wallet</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="wallet-grid">
          {walletOptions.map((wallet) => (
            <button
              key={wallet.id}
              className="wallet-button"
              onClick={() => handleWalletClick(wallet)}
            >
              <img src={wallet.logo} alt={`${wallet.name} Logo`} className="wallet-logo" />
              <span>{wallet.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConnectWalletModal;