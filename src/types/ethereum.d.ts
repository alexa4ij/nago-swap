// src/types/ethereum.d.ts
import { Eip1193Provider } from "ethers";

declare global {
  interface Window {
    ethereum?: Eip1193Provider & {
      // Menambahkan method 'on' untuk event listener
      on?: (eventName: string, listener: (...args: any[]) => void) => void;
      // Menambahkan method 'removeListener' untuk melepas event listener
      removeListener?: (eventName: string, listener: (...args: any[]) => void) => void;
      // Properti lain yang mungkin ada di MetaMask, opsional
      isMetaMask?: boolean;
    };
  }
}