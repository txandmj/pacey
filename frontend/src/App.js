import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Camera from "./Camera/Camera";
import Process from "./Process/Process";
import About from "./About/About";
import Table from "./Table/Table";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/camera" replace />} />
        <Route path="/about" element={<About />} />
        <Route path="/camera" element={<Camera />} />
        <Route path="/process" element={<Process />} />
        <Route path="/table" element={<Table />} />
      </Routes>
    </Router>
  );
}

export default App;
