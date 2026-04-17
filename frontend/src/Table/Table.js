import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import "./Table.css";

function Table() {
  const [data, setData]           = useState([]);
  const [page, setPage]           = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
      const resp = await fetch(`${API_URL}/api/images/allimages`);
      if (!resp.ok) throw new Error(`Server error ${resp.status}`);
      const json = await resp.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const formatDate = (val) => {
    if (!val || val === 10000) return <span className="unknown">—</span>;
    const d = new Date(typeof val === "number" ? val : Number(val));
    return isNaN(d) ? val : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const formatBattery = (val) => {
    if (!val) return <span className="unknown">—</span>;
    return <span className={`badge ${val === "ON" ? "badge-on" : "badge-off"}`}>{val}</span>;
  };

  const paginated = data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const totalPages = Math.ceil(data.length / rowsPerPage);

  return (
    <div className="page">
      <div className="card">
        <h1>🫀 Pacey</h1>
        <p className="subtitle">Patient history — {data.length} records</p>

        <div className="table-actions">
          <button className="btn-outline" onClick={fetchData}>↻ Refresh</button>
          <button className="btn" onClick={() => navigate("/camera")}>+ New Analysis</button>
        </div>

        {loading && <div className="spinner"><span className="dot">Loading records</span></div>}
        {error   && <div className="error-box">Error: {error}</div>}

        {!loading && !error && (
          <>
            <div className="table-wrap">
              <table className="results-table history-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Manufacturer</th>
                    <th>Implant Date</th>
                    <th>Impedance (Ω)</th>
                    <th>Battery</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0
                    ? <tr><td colSpan={5} className="empty-row">No records yet</td></tr>
                    : paginated.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.pacemaker_manufacturer || <span className="unknown">—</span>}</td>
                        <td>{formatDate(row.implant_date)}</td>
                        <td>{row.impedance || <span className="unknown">—</span>}</td>
                        <td>{formatBattery(row.battery)}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn-outline"
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 0}
                >← Prev</button>
                <span>Page {page + 1} of {totalPages}</span>
                <button
                  className="btn-outline"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages - 1}
                >Next →</button>
                <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Table;
