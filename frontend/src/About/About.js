import React from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import "./About.css";

function About() {
  const navigate = useNavigate();
  return (
    <div className="page">
      <div className="card">
        <h1>🫀 Pacey</h1>
        <p className="subtitle">AI-powered pacemaker interrogation report analyzer</p>

        <div className="about-section">
          <h2>What it does</h2>
          <ul>
            <li>Reads printed or scanned pacemaker interrogation reports</li>
            <li>Extracts key pre-surgery fields: manufacturer, implant date, impedance, and battery status</li>
            <li>Supports Medtronic, Abbott, Boston Scientific, and Biotronik report formats</li>
          </ul>
        </div>

        <div className="about-section">
          <h2>How to use</h2>
          <ol>
            <li>Upload a report image (PNG/JPG) or PDF — or photograph the paper printout on mobile</li>
            <li>Click <strong>Analyze Report</strong></li>
            <li>Review the extracted clinical fields</li>
          </ol>
        </div>

        <div className="about-section">
          <h2>Technology</h2>
          <ul>
            <li>Tesseract.js OCR for text extraction</li>
            <li>PyMuPDF for PDF-to-image conversion</li>
            <li>Regex-based clinical field extraction with date normalization</li>
          </ul>
        </div>

        <div className="nav-row" style={{ marginTop: 24 }}>
          <button className="btn" onClick={() => navigate("/camera")}>
            Start Analysis
          </button>
          <button className="btn-outline" onClick={() => navigate("/table")}>
            View History
          </button>
        </div>
      </div>
    </div>
  );
}

export default About;
