from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import shutil
import tempfile
import zipfile
import os
from uuid import uuid4
from datetime import datetime
import geopandas as gpd
import math

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

files_db = {}
measurements_db = {}

@app.post("/api/files/")
async def upload_file(file: UploadFile = File(...)):
    file_id = str(uuid4())
    filename = file.filename
    
    with tempfile.TemporaryDirectory() as tmpdir:
        file_path = os.path.join(tmpdir, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        try:
            ext = os.path.splitext(filename)[1].lower()
            if ext == '.zip':
                extract_dir = os.path.join(tmpdir, "extracted")
                os.makedirs(extract_dir, exist_ok=True)
                with zipfile.ZipFile(file_path, 'r') as zip_ref:
                    zip_ref.extractall(extract_dir)
                
                shp_files = [f for f in os.listdir(extract_dir) if f.endswith('.shp')]
                if not shp_files:
                    raise HTTPException(status_code=400, detail="No .shp file found in zip")
                gdf = gpd.read_file(os.path.join(extract_dir, shp_files[0]))
            elif ext == '.kml':
                gdf = gpd.read_file(file_path, engine='pyogrio')
            else:
                raise HTTPException(status_code=400, detail="Unsupported file format")

            crs = str(gdf.crs) if gdf.crs else None
            feature_count = len(gdf)
            
            measure_gdf = gdf
            projected_crs = None
            if gdf.crs and gdf.crs.is_geographic:
                measure_gdf = gdf.to_crs(epsg=6933)
                projected_crs = "EPSG:6933"
            
            features = []
            for idx, row in measure_gdf.iterrows():
                geom = row.geometry
                geom_type = geom.geom_type if geom else "None"
                
                kind = "none"
                val = None
                unit = None
                
                if geom_type in ["Polygon", "MultiPolygon"]:
                    kind = "area"
                    val = geom.area
                    unit = "m2"
                elif geom_type in ["LineString", "MultiLineString"]:
                    kind = "length"
                    val = geom.length
                    unit = "m"
                elif geom_type in ["Point", "MultiPoint"]:
                    kind = "none"
                else:
                    kind = "unsupported"
                
                original_geom = gdf.loc[idx].geometry
                
                def clean_float(v):
                    if isinstance(v, float) and math.isnan(v): return None
                    return v

                features.append({
                    "feature_id": str(idx),
                    "geometry_type": geom_type,
                    "geometry": original_geom.__geo_interface__ if original_geom else None,
                    "crs": crs,
                    "properties": {k: clean_float(v) for k, v in row.drop("geometry").items()},
                    "measurement": {
                        "kind": kind,
                        "value": val,
                        "unit": unit,
                        "projected_crs": projected_crs
                    }
                })
            
            files_db[file_id] = {
                "id": file_id,
                "filename": filename,
                "feature_count": feature_count,
                "crs": crs,
                "status": "COMPLETED",
                "created_at": datetime.utcnow().isoformat()
            }
            measurements_db[file_id] = features
            return files_db[file_id]

        except Exception as e:
            files_db[file_id] = {
                "id": file_id,
                "filename": filename,
                "feature_count": 0,
                "crs": None,
                "status": "FAILED",
                "error": str(e),
                "created_at": datetime.utcnow().isoformat()
            }
            return files_db[file_id]

@app.get("/api/files/{file_id}/")
async def get_file_info(file_id: str):
    if file_id not in files_db:
        raise HTTPException(status_code=404, detail="File not found")
    return files_db[file_id]

@app.get("/api/files/{file_id}/measurements/")
async def get_measurements(file_id: str):
    if file_id not in measurements_db:
        raise HTTPException(status_code=404, detail="Measurements not found")
    return {
        "count": len(measurements_db[file_id]),
        "results": measurements_db[file_id]
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
