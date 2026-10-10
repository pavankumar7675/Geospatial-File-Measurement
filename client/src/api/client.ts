import type { FileInfo, FeatureMeasurement, MeasurementsResponse } from './types';
import { env } from '../config/env';

export async function uploadFile(file: File, onProgress?: (progress: number) => void): Promise<FileInfo> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${env.VITE_API_BASE_URL}/api/files/`;
    
    xhr.open('POST', url, true);
    
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as FileInfo);
        } catch {
          reject(new Error("Failed to parse response"));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.detail || err.message || "Upload failed"));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };
    
    xhr.onerror = () => reject(new Error("Network error occurred during upload"));
    
    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}

export async function fetchFileInfo(id: string): Promise<FileInfo> {
  const res = await fetch(`${env.VITE_API_BASE_URL}/api/files/${id}/`);
  if (!res.ok) {
    throw new Error(`Failed to fetch file info: ${res.status}`);
  }
  return res.json();
}

export async function fetchMeasurements(id: string): Promise<FeatureMeasurement[]> {
  const res = await fetch(`${env.VITE_API_BASE_URL}/api/files/${id}/measurements/`);
  if (!res.ok) {
    throw new Error(`Failed to fetch measurements: ${res.status}`);
  }
  const data = await res.json();
  if (Array.isArray(data)) return data;
  return (data as MeasurementsResponse).results;
}
