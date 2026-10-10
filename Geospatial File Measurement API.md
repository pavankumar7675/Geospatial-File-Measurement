# Geospatial File Measurement API

## Problem Statement

Build a backend service using either **Django** or **FastAPI** that accepts a geospatial file, processes the features within it, and returns measurement information.

The service should accept either:

- Shapefile
- KML

The objective is to evaluate your ability to build a clean backend API, work with geospatial data, handle file processing, and write production-quality Python code.

You are free to make architectural and implementation decisions beyond the minimum requirements.

## Minimum Requirements

### 1. Backend Framework

Build the application using **one** of:

- Django + Django REST Framework
- FastAPI

### 2. File Upload

Provide an API endpoint that accepts a geospatial file.

Example:

```http
POST /api/files/
```

The API should accept:

- `.zip` containing a Shapefile
- `.kml`

### 3. File Processing

After uploading the file, the service should read the geospatial data and extract its features.

For every feature, identify at minimum:

- Feature ID/index
- Geometry type
- Geometry
- CRS
- Properties/attributes

If a geometry type is not supported for measurement calculation, the API should handle it gracefully rather than crashing.

### 4. Measurements

Calculate measurements for supported geometries.

#### Polygon

Calculate:

- Area

#### LineString

Calculate:

- Length

#### Point

No measurement is required.

### 5. CRS Handling

The application must correctly handle files with geographic coordinates.

For example, a file may use:

```text
EPSG:4326
```

The application should **not directly calculate area or distance using latitude/longitude degrees**.

Transform the geometry to an appropriate projected coordinate system before calculating measurements.

You may choose your own strategy for selecting the projected CRS.

### 6. API Design

At minimum, provide APIs for:

#### Upload

```http
POST /api/files/
```

Uploads and processes a file.

#### File Information

```http
GET /api/files/{id}/
```

Returns information about the uploaded file.

Example:

```json
{
  "id": "abc123",
  "filename": "survey.kml",
  "feature_count": 120,
  "crs": "EPSG:4326",
  "status": "COMPLETED"
}
```

#### Measurements

```http
GET /api/files/{id}/measurements/
```

Returns measurements for the features in the file.

### 7. Documentation

Include a `README.md` containing:

#### Setup

Explain how to run the application locally.

#### API

Document the available endpoints and example requests/responses.

#### Architecture

Briefly explain:

- Application structure
- File-processing flow
- Measurement calculation flow
- CRS handling

#### Design Decisions

Explain important technical decisions and alternatives you considered.

### 8. Submission

- Create a public GitHub repo and share the link.
- In the README mention learning and future scope.
