import React, { useEffect, useState } from "react";

import { Home } from './pages/Home';
import { Country } from './pages/Country';

function App() {
  const [search, setSearch] = useState(document.location.search);

  useEffect(() => {
    const sync = () => setSearch(document.location.search);
    window.addEventListener('popstate', sync);
    window.addEventListener('adh-country-change', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('adh-country-change', sync);
    };
  }, []);

  return (
    <div>
        { search.includes('country=') ? <Country key={search} /> : <Home /> }
    </div>
  );
}

export default App;
