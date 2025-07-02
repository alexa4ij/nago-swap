import React, { useState, useCallback } from "react";
import { toast } from 'react-toastify';
import '../App.css'; 

function BridgePage() {
  const [fromChain, setFromChain] = useState('Ethereum');
  const [toChain, setToChain] = useState('Supra');
  const [token, setToken] = useState('USDC');
  const [amount, setAmount] = useState('');

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
        // Asumsikan Anda memiliki state seperti `setFromAmount` atau `setToAmount`
        // Ganti dengan state yang sesuai dengan komponen Anda
        // Misalnya: setFromAmount(value);
    }
}, []);

  const handleBridge = () => {
    if (parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (fromChain === toChain) {
        toast.error("Source and destination chains cannot be the same.");
        return;
    }
    // Logic to initiate bridging transaction would go here.
    // This is a placeholder for the actual bridging function.
    console.log(`Bridging ${amount} ${token} from ${fromChain} to ${toChain}.`);
    toast.info("Initiating bridge transaction...");
    setTimeout(() => {
        toast.success(`Successfully bridged ${amount} ${token} from ${fromChain} to ${toChain}!`);
    }, 2000); // Simulate network delay
  };

  return (
    <div className="main-content">
      <div className="swap-container"> {/* Reusing swap-container for styling */}
        <div className="swap-header">
          <h2 className="swap-title">Bridge</h2>
          <p className="page-description">Transfer assets seamlessly between different blockchain networks.</p>
        </div>
        <div className="input-group">
          <label htmlFor="fromChain">From Chain</label>
          <select
            id="fromChain"
            value={fromChain}
            onChange={(e) => setFromChain(e.target.value)}
            className="token-select"
          >
            <option value="Ethereum">Ethereum</option>
            <option value="Supra">Supra</option>
            <option value="Polygon">Polygon</option>
            <option value="BNB Chain">BNB Chain</option>
          </select>
        </div>
        
        <button onClick={() => {
            const temp = fromChain;
            setFromChain(toChain);
            setToChain(temp);
        }} className="swap-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-arrow-down-circle"><circle cx="12" cy="12" r="10"></circle><polyline points="8 12 12 16 16 12"></polyline><line x1="12" y1="8" x2="12" y2="16"></line></svg>
        </button>

        <div className="input-group">
          <label htmlFor="toChain">To Chain</label>
          <select
            id="toChain"
            value={toChain}
            onChange={(e) => setToChain(e.target.value)}
            className="token-select"
          >
            <option value="Supra">Supra</option>
            <option value="Ethereum">Ethereum</option>
            <option value="Polygon">Polygon</option>
            <option value="BNB Chain">BNB Chain</option>
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="bridgeAmount">Amount</label>
          <input
            type="text"
            id="bridgeAmount"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.0"
            className="amount-input"
            autoComplete="off"
          />
          <select
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="token-select"
          >
            <option value="USDC">USDC</option>
            <option value="SUPRA">SUPRA</option>
            <option value="WETH">WETH</option>
          </select>
        </div>
        
        <button onClick={handleBridge} className="execute-swap-button">
          Bridge
        </button>
      </div>
    </div>
  );
}

export default BridgePage;