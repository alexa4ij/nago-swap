// src/Components/ConnectedWalletDropdown.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ConnectedWalletDropdown.css'; // Kita akan buat file CSS ini nanti

interface ConnectedWalletDropdownProps {
  address: string;
  explorerUrl?: string; // URL explorer untuk melihat alamat
  onDisconnect: () => void;
  onChangeWallet: () => void; // Untuk membuka modal connect wallet lagi
  walletName?: string; // 'MetaMask' atau 'StarKey'
}

const ConnectedWalletDropdown: React.FC<ConnectedWalletDropdownProps> = ({
  address,
  explorerUrl,
  onDisconnect,
  onChangeWallet,
  walletName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const shortAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

  const toggleDropdown = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  const handleViewInExplorer = useCallback(() => {
    if (explorerUrl) {
      window.open(explorerUrl, '_blank');
      setIsOpen(false);
    }
  }, [explorerUrl]);

  const handleTransactionDetail = useCallback(() => {
    // Ini akan menjadi placeholder. Di aplikasi nyata, Anda akan memiliki logika
    // untuk menampilkan detail transaksi, mungkin link ke Etherscan/SupraScan
    console.log("Transaction Detail clicked. Implement your logic here.");
    setIsOpen(false);
  }, []);

  const handleChangeWallet = useCallback(() => {
    onChangeWallet();
    setIsOpen(false);
  }, [onChangeWallet]);

  const handleDisconnect = useCallback(() => {
    onDisconnect();
    setIsOpen(false);
  }, [onDisconnect]);


  return (
    <div className="connected-wallet-dropdown" ref={dropdownRef}>
      <button className="dropdown-toggle" onClick={toggleDropdown}>
        {walletName === 'MetaMask' && <img src="/metamask-icon.svg" alt="MetaMask Icon" className="wallet-type-icon" />}
        {walletName === 'StarKey' && <img src="/starkey-logo.svg" alt="StarKey Icon" className="wallet-type-icon" />}
        <span>{shortAddress}</span>
        <span className={`arrow-icon ${isOpen ? 'open' : ''}`}>&#9660;</span> {/* Unicode for down arrow */}
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            {walletName === 'MetaMask' && <img src="/metamask-icon.svg" alt="MetaMask Icon" className="wallet-type-icon-large" />}
            {walletName === 'StarKey' && <img src="/starkey-logo.svg" alt="StarKey Icon" className="wallet-type-icon-large" />}
            <span className="full-address">{address}</span>
            <button className="copy-button" onClick={() => navigator.clipboard.writeText(address)} title="Copy address">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
          </div>
          {explorerUrl && (
            <button className="dropdown-item" onClick={handleViewInExplorer}>
              <span className="icon">👁️</span> View in Explorer
            </button>
          )}
          <button className="dropdown-item" onClick={handleTransactionDetail}>
            <span className="icon">📜</span> Transaction Detail
          </button>
          <button className="dropdown-item" onClick={handleChangeWallet}>
            <span className="icon">🔄</span> Change Wallet
          </button>
          <button className="dropdown-item disconnect" onClick={handleDisconnect}>
            <span className="icon">🛑</span> Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectedWalletDropdown;