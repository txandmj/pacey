# 🫀 Pacey — AI Pacemaker Report Analyzer

Pacey extracts key pre-surgery clinical fields from pacemaker interrogation reports (images or PDFs) using OCR — replacing manual chart interpretation with structured, instant output.

Built at the **UCI MSWE Fall 2024 Hackathon** in collaboration with UCI Medical Center physicians.

---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Team](#team)

---

## Overview

Pre-surgery pacemaker review requires physicians to manually read dense interrogation reports — documents that vary in format across manufacturers (Medtronic, Abbott, Boston Scientific, Biotronik) and often arrive as faxed or scanned PDFs.

Pacey solves this by:
1. Accepting a photo or PDF of any pacemaker report
2. Running OCR + regex-based clinical field extraction
3. Returning a structured summary of the fields that drive pre-surgery decisions

### Clinical Decision Context

These are the fields physicians need before surgery (per UCI Medical Center workflow):

| Field | Why it matters |
|---|---|
| **Manufacturer / Device** | Determines which EP rep to call for reprogramming |
| **Implant Date** | Indicates device age and expected battery life |
| **Impedance (Ω)** | Lead integrity indicator |
| **Battery Status** | Whether device has adequate charge for surgery |

---

## Features

- **Upload or photograph** — drag-and-drop PNG/JPG/PDF, or use mobile camera to photograph the paper printout directly
- **Multi-manufacturer support** — recognizes Medtronic, Abbott, Boston Scientific, Biotronik, and more via direct brand scan + keyword extraction
- **PDF support** — converts multi-page PDFs to images via PyMuPDF before OCR
- **Inline results** — extracted fields displayed immediately below the upload without navigation
- **Patient history** — all analyzed reports stored in MariaDB, viewable in paginated table
- **Fully containerized** — runs as 3 Docker containers (frontend, backend, database)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router |
| **Backend** | Node.js 20, Express 4 |
| **OCR** | Tesseract.js 5 |
| **PDF conversion** | Python 3, PyMuPDF (fitz) |
| **Field extraction** | Regex + any-date-parser |
| **Database** | MariaDB 10.6, Sequelize ORM |
| **Infrastructure** | Docker, Docker Compose |

---

## Project Structure

```
pacey/
├── compose.yaml                  # Docker Compose — all 3 services
├── dockerfiles/
│   ├── backend.Dockerfile        # Node.js + Python/PyMuPDF
│   └── frontend.Dockerfile       # React build → static server
├── backend/
│   ├── index.js                  # Entry point (Express server)
│   ├── app.js                    # Middleware, routes setup
│   ├── config/database.js        # Sequelize + MariaDB connection
│   ├── models/Patient.js         # Patient schema
│   ├── controllers/
│   │   └── imageController.js    # Upload, parse, store, retrieve
│   ├── routes/imageRoutes.js     # API route definitions
│   └── parser/
│       ├── parser.js             # Tesseract.js OCR wrapper
│       ├── converter.js          # OCR text → structured JSON
│       ├── keymap.js             # Keyword/regex field extraction
│       └── pdf_to_png.py         # PyMuPDF PDF→PNG conversion
├── frontend/
│   └── src/
│       ├── App.js                # Router
│       ├── Camera/               # Upload + analyze page (main UI)
│       ├── Table/                # Patient history page
│       └── About/                # About page
└── db/
    └── init.sql                  # Database schema + seed data
```

---

## Getting Started

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Run locally

```bash
git clone https://github.com/charlesweng/pacey.git
cd pacey
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |

### Usage

1. Open **http://localhost:3000**
2. **Upload** a pacemaker report image or PDF (or tap **Take photo** on mobile)
3. Click **Analyze Report**
4. View extracted clinical fields inline
5. Click **View History** to see all previously analyzed reports

### Sample reports

Two sample pacemaker images are included for testing:
- `backend/parser/abbott.png` — Abbott device report
- `backend/parser/boston.png` — Boston Scientific device report

---

## Deployment

### Synology NAS (always-on, accessible on local network)

1. Copy the `pacey/` folder to your NAS (e.g. `/volume1/docker/pacey`)
2. SSH into the NAS:

```bash
ssh admin@<NAS-IP>
cd /volume1/docker/pacey
REACT_APP_API_URL=http://<NAS-IP>:8000 docker compose up --build -d
```

3. Access at `http://<NAS-IP>:3000` from any device on the same network

> **Note:** The `REACT_APP_API_URL` variable bakes the backend address into the React build. It must be set to the NAS IP so mobile devices can reach the backend.

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `REACT_APP_API_URL` | `http://localhost:8000` | Backend URL (set to NAS/server IP for remote access) |
| `DB_HOST` | `db` | MariaDB hostname (Docker service name) |
| `DB_NAME` | `flask_app` | Database name |
| `DB_USER` | `root` | Database user |
| `DB_PASS` | *(empty)* | Database password |
| `PORT` | `8000` | Backend port |

---

## API Reference

Base URL: `http://localhost:8000/api/images`

### `POST /upload`
Upload a base64-encoded image or PDF for OCR analysis. Stores result in database.

**Request body:**
```json
{ "base64Image": "data:image/png;base64,..." }
```

**Response:**
```json
{
  "message": "Image saved and patient record created successfully.",
  "data": {
    "pacemaker_manufacturer": "Medtronic",
    "implant_date": 1554854400000,
    "impedance": "418,342,646",
    "battery": "ON"
  }
}
```

### `GET /allimages`
Returns all stored patient records in descending order.

### `GET /patients/:patient_id`
Returns a single patient record with implant date formatted as ISO string and image encoded as base64.

---

## Troubleshooting

**Port 3306 already in use:**
```
Error: ports are not available: exposing port TCP 0.0.0.0:3306
```
A local MySQL instance is running. This is fine — the DB port is not exposed externally in `compose.yaml`. Run `docker compose down` then `docker compose up --build` again.

**Docker engine not running:**
```
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified
```
Start Docker Desktop and wait for it to fully load before running compose commands.

**Database container unhealthy / backend won't start:**
The DB takes ~20 seconds to initialize on first run. The backend waits via `depends_on: condition: service_healthy`. If it times out, run:
```bash
docker compose down
docker compose up
```

**Slow first analysis:**
Tesseract.js downloads ~40MB English language models on first use. Subsequent analyses are fast. The models are cached in a named Docker volume (`pacey_tessdata`) and persist across restarts.

**CRLF line ending error (Windows → Linux):**
```
/usr/bin/env: 'bash\r': No such file or directory
```
```bash
dos2unix entrypoint.sh
```

**Force clean rebuild:**
```bash
docker compose build --no-cache
# or rebuild a single service:
docker compose build --no-cache backend
```

---

## Team

| Name | Role |
|---|---|
| Charles Weng | Full-stack / Flex |
| Hank Chang | Backend |
| Matthew Sah | Backend |
| Jason Yim | Frontend |
| Dylan Loe | Database & Data Analysis |
| Ryan Soo | Database & Data Analysis |
| Xin Tang | Database & Data Analysis |
