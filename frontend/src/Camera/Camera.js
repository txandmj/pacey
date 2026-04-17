import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import "./Camera.css";

const LABELS = {
  pacemaker_manufacturer: "Manufacturer / Device",
  implant_date:           "Implant Date",
  impedance:              "Impedance (Ω)",
  battery:                "Battery Status",
};

function Camera() {
  const [currentFile, setCurrentFile]   = useState(null);
  const [previewSrc, setPreviewSrc]     = useState(null);
  const [isPdf, setIsPdf]               = useState(false);
  const [isAnalyzing, setIsAnalyzing]   = useState(false);
  const [results, setResults]           = useState(null);
  const [error, setError]               = useState(null);
  const [isDragging, setIsDragging]     = useState(false);
  const fileInputRef   = useRef();
  const cameraInputRef = useRef();
  const navigate = useNavigate();

  const handleFile = (file) => {
    if (!file) return;
    setCurrentFile(file);
    setResults(null);
    setError(null);
    const pdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    setIsPdf(pdf);
    if (!pdf) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewSrc(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewSrc(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const analyze = () => {
    if (!currentFile) return;
    setIsAnalyzing(true);
    setResults(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
        const resp = await fetch(`${API_URL}/api/images/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64Image: e.target.result }),
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error || "Analysis failed");
        setResults(json.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(currentFile);
  };

  const formatValue = (key, val) => {
    if (key === "implant_date") {
      return typeof val === "number" && val > 100000
        ? new Date(val).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : <span className="unknown">not found</span>;
    }
    if (key === "battery") {
      return <span className={`badge ${val === "ON" ? "badge-on" : "badge-off"}`}>{val}</span>;
    }
    if (!val || val === "unknown" || val === "TBD") {
      return <span className="unknown">{val || "not found"}</span>;
    }
    return val;
  };

  return (
    <div className="page">
      <div className="card">
        <h1>🫀 Pacey</h1>
        <p className="subtitle">AI-powered pacemaker interrogation report analyzer</p>

        {/* Upload zone */}
        <div
          className={`upload-zone ${isDragging ? "drag" : ""}`}
          onClick={() => fileInputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="upload-icon">📄</div>
          <p><strong>Click to upload</strong> or drag &amp; drop</p>
          <p>PNG, JPG, or PDF — pacemaker interrogation report</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>

        {/* Camera button (mobile) */}
        <div className="divider-row">
          <div className="divider-line" />
          <span className="divider-text">or on mobile</span>
          <div className="divider-line" />
        </div>
        <label className="btn-secondary">
          📷 Take photo of report
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </label>

        {/* File name */}
        {currentFile && (
          <p className="filename">Selected: {currentFile.name}</p>
        )}

        {/* Preview */}
        {(previewSrc || isPdf) && (
          <div className="preview-wrap">
            {previewSrc
              ? <img src={previewSrc} alt="Report preview" className="preview-img" />
              : (
                <div className="pdf-preview">
                  <div className="pdf-icon">📋</div>
                  <p>{currentFile?.name}</p>
                  <p className="pdf-sub">PDF will be converted and analyzed</p>
                </div>
              )
            }
          </div>
        )}

        {/* Analyze button */}
        <button
          className="btn"
          style={{ marginTop: 14 }}
          onClick={analyze}
          disabled={!currentFile || isAnalyzing}
        >
          {isAnalyzing ? "Analyzing…" : "Analyze Report"}
        </button>

        {/* Spinner */}
        {isAnalyzing && (
          <div className="spinner">
            <span className="dot">Running OCR and extracting clinical fields</span>
          </div>
        )}

        {/* Error */}
        {error && <div className="error-box">Error: {error}</div>}

        {/* Results */}
        {results && (
          <div className="results-section">
            <h2>Extracted Clinical Data</h2>
            <table className="results-table">
              <thead>
                <tr><th>Field</th><th>Extracted Value</th></tr>
              </thead>
              <tbody>
                {Object.entries(LABELS).map(([key, label]) => (
                  <tr key={key}>
                    <td>{label}</td>
                    <td>{formatValue(key, results[key])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Navigation */}
        <div className="nav-row">
          <button className="btn-outline" onClick={() => navigate("/table")}>
            View History
          </button>
          <button className="btn-outline" onClick={() => navigate("/about")}>
            About
          </button>
        </div>
      </div>
    </div>
  );
}

export default Camera;
