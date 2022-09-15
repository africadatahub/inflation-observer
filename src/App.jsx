import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Header } from './components/Header';

import { Home } from './pages/Home';
import { DataExplorer } from './pages/DataExplorer';
import { Country } from './pages/Country';

function App() {
  return (
    <div>
        <Header />
        <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/:country" element={<Country />} />
              <Route path="/data" element={<DataExplorer />} />
            </Routes>
        </BrowserRouter>
    </div>
  );
}

export default App;