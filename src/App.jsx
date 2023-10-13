import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Header } from './components/Header';

import { Home } from './pages/Home';
import { DataExplorer } from './pages/DataExplorer';
import { Country } from './pages/Country';

import { locationToUrl, urlToLocation } from './utils/func.js';

function App() {
  return (
    <div>
        {/* <Header /> */}
        <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/:country" element={ urlToLocation(window.location.pathname.replace('/','')) == undefined ? <Navigate to="/" /> : <Country />} />
              <Route path="/data" element={<DataExplorer />} />
            </Routes>
        </BrowserRouter>
    </div>
  );
}

export default App;