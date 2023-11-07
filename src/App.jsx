import React from "react";

import { Home } from './pages/Home';
import { Country } from './pages/Country';

import { locationToUrl, urlToLocation } from './utils/func.js';

function App() {
  return (
    <div>
        { document.location.search.includes('country=') ? <Country /> : <Home /> }
    </div>
  );
}

export default App;