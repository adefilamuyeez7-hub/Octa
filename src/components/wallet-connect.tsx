import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

export default function WalletConnect() {
  const [addr, setAddr] = useState<string | null>(null);
  const [chain, setChain] = useState<number | null>(null);

  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;
    if (eth.selectedAddress) setAddr(eth.selectedAddress);
    eth.on('accountsChanged', (accounts: string[]) => setAddr(accounts?.[0] ?? null));
    eth.on('chainChanged', (chainId: string) => setChain(parseInt(chainId, 16)));
    return () => {
      try { eth.removeAllListeners(); } catch {}
    };
  }, []);

  const connect = async () => {
    try {
      const eth = (window as any).ethereum;
      if (!eth) return alert('No wallet found');
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      setAddr(accounts?.[0] ?? null);
      const provider = new ethers.providers.Web3Provider(eth);
      const network = await provider.getNetwork();
      setChain(network.chainId);
    } catch (e) {
      console.error('wallet connect', e);
    }
  };

  const disconnect = () => setAddr(null);

  return (
    <div>
      {addr ? (
        <button onClick={disconnect} className="text-sm text-muted-foreground hover:text-foreground">{addr.slice(0,6)}…{addr.slice(-4)}</button>
      ) : (
        <button onClick={connect} className="text-sm text-muted-foreground hover:text-foreground">Connect Wallet</button>
      )}
    </div>
  );
}
