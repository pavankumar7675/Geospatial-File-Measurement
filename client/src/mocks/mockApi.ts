import type { FileInfo, FeatureMeasurement } from '../api/types';

export async function mockUploadFile(file: File, onProgress?: (p: number) => void): Promise<FileInfo> {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      if (onProgress) onProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        resolve({
          id: 'mock-123',
          filename: file.name,
          feature_count: 5,
          crs: 'EPSG:4326',
          status: 'PENDING',
          created_at: new Date().toISOString()
        });
      }
    }, 200);
  });
}

let mockStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' = 'PENDING';

export async function mockFetchFileInfo(id: string): Promise<FileInfo> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (mockStatus === 'PENDING') mockStatus = 'PROCESSING';
      else if (mockStatus === 'PROCESSING') mockStatus = 'COMPLETED';
      
      resolve({
        id,
        filename: 'mock-upload.zip',
        feature_count: 3,
        crs: 'EPSG:4326',
        status: mockStatus,
        created_at: new Date().toISOString()
      });
    }, 500);
  });
}

export async function mockFetchMeasurements(id: string): Promise<FeatureMeasurement[]> {
  console.log(`Fetching mock measurements for ${id}`);
  return [
    {
      feature_id: '1',
      geometry_type: 'Polygon',
      geometry: { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] },
      crs: 'EPSG:4326',
      properties: { name: 'Square' },
      measurement: { kind: 'area', value: 12345.67, unit: 'm2' }
    },
    {
      feature_id: '2',
      geometry_type: 'LineString',
      geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
      crs: 'EPSG:4326',
      properties: { name: 'Line' },
      measurement: { kind: 'length', value: 123.45, unit: 'm' }
    },
    {
      feature_id: '3',
      geometry_type: 'Point',
      geometry: { type: 'Point', coordinates: [0, 0] },
      crs: 'EPSG:4326',
      properties: { name: 'Dot' },
      measurement: { kind: 'none', value: null, unit: null }
    }
  ];
}
