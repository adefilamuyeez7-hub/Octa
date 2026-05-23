import { useEffect, useState } from "react";
import { ethers } from "ethers";

export default function WalletConnect() {
  const [addr, setAddr] = useState<string | null>(null);
  const [chain, setChain] = useState<number | null>(null);

  useEffect(() => {
    const eth = (window as Window & { ethereum?: {
      selectedAddress?: string;
      on: (event: string, listener: (...args: unknown[]) => void) => void;
      removeListener: (event: string, listener: (...args: unknown[]) => void) => void;
    } }).ethereum;
    if (!eth) return;

    if (eth.selectedAddress) {
      setAddr(eth.selectedAddress);
    }

    const handleAccountsChanged = (accounts: unknown) => {
      const next = Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : null;
      setAddr(next);
    };
    const handleChainChanged = (chainId: unknown) => {
      if (typeof chainId === "string") {
        setChain(parseInt(chainId, 16));
      }
    };

    eth.on("accountsChanged", handleAccountsChanged);
    eth.on("chainChanged", handleChainChanged);

    return () => {
      try {
        eth.removeListener("accountsChanged", handleAccountsChanged);
        eth.removeListener("chainChanged", handleChainChanged);
      } catch {
        // Ignore wallet cleanup failures.
      }
    };
  }, []);

  const connect = async () => {
    try {
      const eth = (window as Window & {
        ethereum?: { request: (args: { method: string }) => Promise<unknown> };
      }).ethereum;
      if (!eth) {
        alert("No wallet found");
        return;
      }

      const accounts = await eth.request({ method: "eth_requestAccounts" });
      const nextAddr = Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : null;
      setAddr(nextAddr);

      const provider = new ethers.BrowserProvider(eth as ethers.Eip1193Provider);
      const network = await provider.getNetwork();
      setChain(Number(network.chainId));
    } catch (e) {
      console.error("wallet connect", e);
    }
  };

  const disconnect = () => setAddr(null);

  return (
    <div>
      {addr ? (
        <button onClick={disconnect} className="text-sm text-muted-foreground hover:text-foreground">
          {addr.slice(0, 6)}...{addr.slice(-4)}{chain ? ` · ${chain}` : ""}
        </button>
      ) : (
        <button onClick={connect} className="text-sm text-muted-foreground hover:text-foreground">
          Connect Wallet
        </button>
      )}
    </div>
  );
}
