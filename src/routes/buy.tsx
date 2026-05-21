import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { appRepository } from "../lib/storage";

export const Route = createFileRoute('/buy')({ component: BuyPage, head: () => ({ meta: [{ title: 'Buy $OCTA' }] }) });

function BuyPage() {
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);

  const buy = async () => {
    setLoading(true);
    await appRepository.appendTask({ type: 'purchase', amount, createdAt: new Date().toISOString() });
    setLoading(false);
    alert(`Simulated purchase of ${amount} $OCTA recorded`);
  };

  return (
    <div className="p-8 max-w-md">
      <h1 className="text-xl font-semibold mb-4">Buy $OCTA (simulation)</h1>
      <div className="mb-4">
        <label className="block text-sm mb-1">Amount</label>
        <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full p-2 border rounded" />
      </div>
      <div className="flex gap-2">
        <button onClick={buy} disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white">Buy</button>
        <Link to="/" className="px-4 py-2 rounded border">Cancel</Link>
      </div>
    </div>
  );
}
