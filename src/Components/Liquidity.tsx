import React, { useState, useCallback, useMemo } from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../App.css'; // Pastikan jalur CSS ini benar

// Definisikan tipe untuk token yang didukung
type LiquidityTokenSymbol = 'SUPRA' | 'USDC' | 'USDT' | 'WETH';

function LiquidityPage() {
  const [tokenA, setTokenA] = useState<LiquidityTokenSymbol>('SUPRA');
  const [tokenB, setTokenB] = useState<LiquidityTokenSymbol>('USDC');
  const [amountA, setAmountA] = useState<string>('');
  const [amountB, setAmountB] = useState<string>('');

  // Daftar token yang tersedia untuk pool
  const tokenList = useMemo<LiquidityTokenSymbol[]>(() => ['SUPRA', 'USDC', 'USDT', 'WETH'], []);

  /**
   * Mengatur nilai input jumlah token A dengan validasi.
   * Menggunakan useCallback untuk mengoptimalkan kinerja.
   */
  const handleAmountAChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setAmountA(value);
    }
  }, []);

  /**
   * Mengatur nilai input jumlah token B dengan validasi.
   * Menggunakan useCallback untuk mengoptimalkan kinerja.
   */
  const handleAmountBChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setAmountB(value);
    }
  }, []);

  /**
   * Mengatur token yang dipilih untuk token A.
   */
  const handleTokenAChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setTokenA(e.target.value as LiquidityTokenSymbol);
  }, []);

  /**
   * Mengatur token yang dipilih untuk token B.
   */
  const handleTokenBChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setTokenB(e.target.value as LiquidityTokenSymbol);
  }, []);

  /**
   * Menambahkan likuiditas ke pool dan menampilkan notifikasi.
   * Menggunakan useCallback untuk mengoptimalkan kinerja.
   */
  const handleAddLiquidity = useCallback(() => {
    if (parseFloat(amountA) <= 0 || parseFloat(amountB) <= 0 || !amountA || !amountB) {
      toast.error("Please enter valid amounts for both tokens.");
      return;
    }
    if (tokenA === tokenB) {
      toast.error("Cannot add liquidity with the same token.");
      return;
    }
    
    // Logika untuk menambahkan likuiditas ke blockchain akan ditambahkan di sini.
    console.log(`Adding liquidity: ${amountA} ${tokenA} and ${amountB} ${tokenB}.`);
    toast.success(`Successfully added liquidity to the ${tokenA}-${tokenB} pool!`);
    
    // Reset input setelah berhasil
    setAmountA('');
    setAmountB('');
  }, [amountA, amountB, tokenA, tokenB]);

  /**
   * Fungsi placeholder untuk menghapus likuiditas.
   * Menggunakan useCallback untuk mengoptimalkan kinerja.
   */
  const handleRemoveLiquidity = useCallback(() => {
    // Logika untuk menghapus likuiditas akan ditambahkan di sini.
    toast.info("Removing liquidity is not yet implemented.");
  }, []);

  return (
    <div className="main-content">
      <div className="swap-container"> {/* Reusing swap-container for styling */}
        <div className="swap-header">
          <h2 className="swap-title">Liquidity</h2>
          <p className="page-description">Add liquidity to pools and earn a share of trading fees.</p>
        </div>
        
        {/* Input untuk Token 1 */}
        <div className="input-group">
          <label htmlFor="tokenA_amount">Token 1 Amount</label>
          <input
            type="text"
            id="tokenA_amount"
            value={amountA}
            onChange={handleAmountAChange}
            placeholder="0.0"
            className="amount-input"
            autoComplete="off"
          />
          <select
            value={tokenA}
            onChange={handleTokenAChange}
            className="token-select"
          >
            {tokenList.map(token => (
              <option key={token} value={token}>{token}</option>
            ))}
          </select>
        </div>
        
        <div className="plus-symbol">+</div>

        {/* Input untuk Token 2 */}
        <div className="input-group">
          <label htmlFor="tokenB_amount">Token 2 Amount</label>
          <input
            type="text"
            id="tokenB_amount"
            value={amountB}
            onChange={handleAmountBChange}
            placeholder="0.0"
            className="amount-input"
          />
          <select
            value={tokenB}
            onChange={handleTokenBChange}
            className="token-select"
          >
            {tokenList.map(token => (
              <option key={token} value={token}>{token}</option>
            ))}
          </select>
        </div>

        <div className="liquidity-actions">
          <button
            onClick={handleAddLiquidity}
            className="execute-swap-button"
            disabled={!amountA || parseFloat(amountA) <= 0 || !amountB || parseFloat(amountB) <= 0}
          >
            Add Liquidity
          </button>
          <button onClick={handleRemoveLiquidity} className="execute-swap-button secondary">
            Remove Liquidity
          </button>
        </div>
      </div>
    </div>
  );
}

export default LiquidityPage;