import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import jsonDb from "../lib/jsonDb";

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
  head: () => ({ meta: [{ title: '0cta — Settings' }] }),
});

function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [siteName, setSiteName] = useState('0cta');
  const [tokenEnabled, setTokenEnabled] = useState(true);
  const [walletEnabled, setWalletEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      const s = await jsonDb.getSettings();
      setSiteName((s.siteName as string) ?? '0cta');
      setTokenEnabled((s.tokenEnabled as boolean) ?? true);
      setWalletEnabled((s.walletEnabled as boolean) ?? true);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    await jsonDb.setSettings({ siteName, tokenEnabled, walletEnabled });
    alert('Settings saved locally');
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>
      <div className="space-y-4">
        <label className="block">
          <div className="text-sm mb-1">Site name</div>
          <input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full p-2 border rounded" />
        </label>

        <label className="flex items-center gap-3">
          <input type="checkbox" checked={tokenEnabled} onChange={(e) => setTokenEnabled(e.target.checked)} />
          <span>Enable token purchase prompts (top)</span>
        </label>

        <label className="flex items-center gap-3">
          <input type="checkbox" checked={walletEnabled} onChange={(e) => setWalletEnabled(e.target.checked)} />
          <span>Enable wallet usage</span>
        </label>

        <div className="flex gap-3">
          <button onClick={save} className="px-4 py-2 rounded bg-blue-600 text-white">Save</button>
          <Link to="/" className="px-4 py-2 rounded border">Cancel</Link>
        </div>
      </div>
    </div>
  );
}
