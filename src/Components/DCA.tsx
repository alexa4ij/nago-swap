import React, { useState, useCallback, useMemo } from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../App.css'; // Pastikan jalur CSS ini benar

// Definisikan tipe untuk token yang didukung
type DcaTokenSymbol = 'SUPRA' | 'USDC' | 'BTC' | 'ETH';

// Definisikan tipe untuk frekuensi
type DcaFrequency = 'daily' | 'weekly' | 'monthly';

const DcaPage: React.FC = () => {
  // State untuk mengelola input pengguna
  const [token, setToken] = useState<DcaTokenSymbol>('SUPRA');
  const [amount, setAmount] = useState<string>('');
  const [frequency, setFrequency] = useState<DcaFrequency>('weekly');

  // Daftar token yang tersedia untuk DCA
  const tokenList = useMemo<DcaTokenSymbol[]>(() => ['SUPRA', 'USDC', 'BTC', 'ETH'], []);

  /**
   * Mengatur nilai input jumlah dengan validasi.
   * Hanya menerima angka dan titik desimal.
   * Menggunakan useCallback untuk mengoptimalkan kinerja.
   */
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Regex untuk memastikan input hanya angka dan satu titik desimal
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setAmount(value);
    }
  }, []); // Dependensi kosong karena state 'amount' tidak digunakan di dalam fungsi

  /**
   * Fungsi untuk menjadwalkan DCA dan menampilkan notifikasi.
   * Menggunakan useCallback untuk mengoptimalkan kinerja.
   */
  const handleScheduleDca = useCallback(() => {
    // Validasi input jumlah
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    // Tampilkan informasi di konsol dan notifikasi toast
    console.log(`Scheduling DCA for ${amount} ${token} on a ${frequency} basis.`);
    toast.success(`DCA schedule for ${amount} ${token} (${frequency}) has been set!`);

    // Di sini Anda akan menambahkan logika untuk mengirim transaksi
    // ke blockchain untuk menjadwalkan DCA (misalnya, memanggil kontrak pintar).
    // Contoh:
    // scheduleTransactionOnChain(token, amount, frequency);

  }, [amount, token, frequency]); // Dependensi: fungsi dibuat ulang jika 'amount', 'token', atau 'frequency' berubah

  return (
    <div className="main-content">
      <div className="swap-container">
        <div className="swap-header">
          <h2 className="swap-title">Dollar-Cost Averaging (DCA)</h2>
          <p className="page-description">
            Invest a fixed amount automatically at regular intervals to reduce the impact of market volatility.
          </p>
        </div>

        {/* Bagian Input Jumlah Investasi */}
        <div className="input-group">
          <label htmlFor="dcaAmount">Invest Amount</label>
          <input
            type="text"
            id="dcaAmount"
            value={amount}
            onChange={handleAmountChange}
            placeholder="e.g., 50.0"
            className="amount-input"
            autoComplete="off"
          />
          <select
            value={token}
            // Tambahkan tipe data eksplisit untuk event select
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setToken(e.target.value as DcaTokenSymbol)}
            className="token-select"
          >
            {tokenList.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Bagian Pilihan Frekuensi */}
        <div className="input-group">
          <label htmlFor="frequency">Frequency</label>
          <select
            id="frequency"
            value={frequency}
            // Tambahkan tipe data eksplisit untuk event select
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFrequency(e.target.value as DcaFrequency)}
            className="token-select"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Tombol untuk Menjadwalkan DCA */}
        <button
          onClick={handleScheduleDca}
          className="execute-swap-button"
          disabled={!amount || parseFloat(amount) <= 0} // Nonaktifkan tombol jika jumlah tidak valid
        >
          Schedule DCA
        </button>
      </div>
    </div>
  );
};

export default DcaPage;