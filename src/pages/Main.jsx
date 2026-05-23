import { useState } from 'react';
import Landing from './Landing.jsx';
import Dashboard from './Dashboard.jsx';

export default function Main() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <Landing onEnter={() => setIsLoggedIn(true)} />;
  }

  return <Dashboard />;
}
