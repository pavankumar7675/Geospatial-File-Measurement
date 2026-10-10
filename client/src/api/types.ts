export type FileStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface FileInfo {
  id: string;
  filename: string;
  feature_count: number;
  crs: string | null;
  status: FileStatus;
  error?: string | null;
  created_at?: string;
}

export type MeasurementKind = "area" | "length" | "none" | "unsupported";

export interface FeatureMeasurement {
  feature_id: string | number;
  geometry_type: string;
  geometry: any | null; // Using any for GeoJSON.Geometry to avoid needing @types/geojson everywhere if not installed
  crs: string | null;
  properties: Record<string, unknown>;
  measurement: {
    kind: MeasurementKind;
    value: number | null;
    unit: "m2" | "m" | null;
    projected_crs?: string | null;
    note?: string | null;
  };
}

export interface MeasurementsResponse {
  count: number;
  results: FeatureMeasurement[];
}
