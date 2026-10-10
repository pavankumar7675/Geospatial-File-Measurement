# Groundwork

Groundwork is a geospatial file measurement workspace for inspecting KML files and zipped shapefiles. Upload a source file, calculate measurements for its geometries, and review the results on an interactive map and feature register.

The interface is designed as a field measurement desk: quiet paper and ink colors, survey-orange status signals, compact metadata, and an audit-friendly connection between each map feature and its measurement.

## What It Does

- Accepts `.kml` files and `.zip` archives containing a `.shp` file.
- Validates supported extensions, archive contents, and the 50 MB client upload limit.
- Reads geometry, CRS, feature identifiers, and source properties.
- Calculates polygon area in square meters.
- Calculates line length in meters.
- Handles points and unsupported geometry types without crashing.
- Reprojects geographic source data such as `EPSG:4326` to `EPSG:6933` before calculating measurements.
- Displays totals, measured and unmeasured counts, map geometry, and a feature register.

## Interface

The frontend has two focused screens:

1. **Start a survey**: drag or browse for a KML or zipped shapefile, review the detected file, and start analysis.
2. **Analysis record**: inspect the file status, source CRS, feature count, area and length totals, plotted geometry, and individual feature measurements.

Selecting a row in the feature register highlights the corresponding geometry on the map. Processing and failed states are presented explicitly, while completed records show the full measurement workspace.

## Architecture

```text
projecttt/
|-- client/                 React + TypeScript + Vite frontend
|   |-- src/api/            API client and response types
|   |-- src/components/map/ Leaflet map presentation
|   |-- src/pages/          Upload and analysis screens
|   |-- src/lib/            Client-side ZIP inspection
|   `-- src/index.css       Groundwork visual system
|-- server/                 FastAPI backend
|   `-- main.py             Upload, processing, and measurement endpoints
|-- test_kml.py             Backend test helper
|-- valid_test.kml          Sample KML file
`-- test_shapefile/         Sample shapefile bundle
```

The backend currently stores uploaded file metadata and measurements in memory. Restarting the server clears that in-memory store; this keeps the project small and makes the processing flow easy to inspect.

## Requirements

- Python 3.11+ recommended
- Node.js 18+ recommended
- A browser with JavaScript enabled

## Setup

### Backend

From the repository root:

```powershell
py -m pip install -r server/requirements.txt
py -m uvicorn main:app --reload --app-dir server --host 127.0.0.1 --port 8000
```

The API and interactive documentation will be available at:

- API: `http://127.0.0.1:8000`
- Swagger UI: `http://127.0.0.1:8000/docs`

### Frontend

In a second terminal:

```powershell
cd client
npm install
npm run dev
```

Open `http://127.0.0.1:5173/` in a browser.

The frontend defaults to `http://localhost:8000` for the API. To use another API host, create `client/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_MAX_UPLOAD_MB=50
```

On Windows, if Node.js is installed but `npm` is not on `PATH`, run the commands from a Node-enabled terminal or invoke `C:\Program Files\nodejs\npm.cmd` directly.

## API

### Upload a file

```http
POST /api/files/
Content-Type: multipart/form-data
```

The form field must be named `file`.

```powershell
curl.exe -X POST http://127.0.0.1:8000/api/files/ -F "file=@valid_test.kml"
```

Example response:

```json
{
  "id": "e1f7f6c1-3c03-4d59-9b3f-8a1f0d1d6c40",
  "filename": "valid_test.kml",
  "feature_count": 3,
  "crs": "EPSG:4326",
  "status": "COMPLETED",
  "created_at": "2026-10-10T12:00:00.000000"
}
```

### Get file information

```http
GET /api/files/{file_id}/
```

Returns the stored filename, status, feature count, CRS, and processing error when applicable.

### Get feature measurements

```http
GET /api/files/{file_id}/measurements/
```

Returns a `count` and `results` array. Each result contains the feature id, geometry type, original geometry, properties, source CRS, and measurement object.

```json
{
  "count": 1,
  "results": [
    {
      "feature_id": "0",
      "geometry_type": "Polygon",
      "crs": "EPSG:4326",
      "measurement": {
        "kind": "area",
        "value": 977843.0,
        "unit": "m2",
        "projected_crs": "EPSG:6933"
      }
    }
  ]
}
```

## Measurement Flow

1. The client checks the file extension and inspects ZIP archives for a `.shp` entry.
2. The API reads the source with GeoPandas.
3. If the input CRS is geographic, the measurement copy is transformed to `EPSG:6933`.
4. Polygon areas and line lengths are calculated from the projected geometry.
5. The original geometry and source CRS are returned for map display and traceability.
6. Point and unsupported geometries receive `none` or `unsupported` instead of failing the whole upload.

## Development Commands

From `client/`:

```powershell
npm run dev       # Start Vite
npm run build     # Type-check and create a production bundle
npm run lint      # Run Oxlint
npm run preview   # Preview the production bundle
```

From the repository root:

```powershell
py test_kml.py
```

## Design Decisions and Future Scope

- **FastAPI** keeps the upload and geospatial processing API concise and provides interactive API documentation.
- **GeoPandas** handles file reading, CRS inspection, reprojection, and geometry measurements.
- **React Query** manages file information polling while processing and measurement loading after completion.
- **Leaflet** provides an established map surface without requiring a paid map provider.
- **In-memory storage** is deliberately used for this project. A production deployment should use durable storage, background jobs, authentication, upload cleanup, and a database.
- Future improvements could include persistent file history, richer CRS selection, exportable measurement reports, geometry filtering, server-side pagination, and user-controlled map basemaps.