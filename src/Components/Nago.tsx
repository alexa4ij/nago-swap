import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from 'react-toastify';
import '../App.css'; 

function NagoTokenPage() {
  const [nagoPrice, setNagoPrice] = useState('N/A');
  const [loading, setLoading] = useState(true);

  const fetchNagoPrice = async () => {
    setLoading(true);
    // Note: The CoinGecko ID from the search results is 'supra-token' for SUPRA and 'base-wrapped-dog' for NAGO.
    // This is a placeholder as CoinGecko might not have a dedicated 'Nago' token page.
    const coingeckoId = 'base-wrapped-dog'; // Assuming this is the correct ID from search results
    
    try {
        const response = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`,
            { headers: { 'Accept': 'application/json' } }
        );
        const price = response.data[coingeckoId]?.usd;
        if (price) {
            setNagoPrice(`$${price.toFixed(8)}`);
            toast.success("Nago token price updated!");
        } else {
            setNagoPrice("N/A");
            toast.warn("Price not found for Nago token. Using fallback.");
        }
    } catch (error) {
        console.error("Error fetching Nago token price:", error);
        setNagoPrice("$0.00000001"); // Fallback price
        toast.error("Failed to fetch Nago token price. Using fallback.");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchNagoPrice();
    const interval = setInterval(fetchNagoPrice, 60000); 
    return () => clearInterval(interval); 
  }, []);

  return (
    <div className="main-content">
      <div className="swap-container"> {/* Reusing swap-container for styling */}
        <div className="swap-header">
          <h2 className="swap-title">Token Nago</h2>
          <p className="page-description">Learn more about the Nago Token and its ecosystem.</p>
        </div>
        <div className="token-info-card">
          <h3>NAGO Token Information</h3>
          <p><strong>Current Price:</strong> {loading ? 'Fetching...' : nagoPrice}</p>
          <p><strong>Total Supply:</strong> 1,000,000,000 NAGO</p>
          <p><strong>Contract Address:</strong> <a href="https://etherscan.io/address/0x167b1e709ac835d56bcfdeb81c93f93ca1776675" target="_blank" rel="noopener noreferrer">0x167b...6675</a></p> {/* Example address from search results */}
          <hr className="info-divider" />
          <h4>Utility and Use Case</h4>
          <ul>
            <li><strong>Governance:</strong> Participate in the governance of the NAGO ecosystem.</li>
            <li><strong>Staking:</strong> Stake NAGO to earn rewards and secure the network.</li>
            <li><strong>Fee Reduction:</strong> Get discounts on trading fees when paying with NAGO.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default NagoTokenPage;