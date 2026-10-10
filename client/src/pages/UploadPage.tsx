import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '../api/client';
import { inspectZip } from '../lib/zipInspect';
import { env } from '../config/env';

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    processFileSelection(f);
  };

  const processFileSelection = async (f: File) => {
    setError(null);
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (ext !== 'zip' && ext !== 'kml') {
      setError('Unsupported format. Groundwork accepts .zip shapefiles and .kml files.');
      setFile(null);
      return;
    }

    if (f.size > env.VITE_MAX_UPLOAD_MB * 1024 * 1024) {
      setError(`This file is larger than the ${env.VITE_MAX_UPLOAD_MB} MB upload limit.`);
      setFile(null);
      return;
    }
    
    if (ext === 'zip') {
      try {
        const { hasShp } = await inspectZip(f);
        if (!hasShp) {
          setError('This archive does not contain a .shp file. Check the shapefile bundle and try again.');
          setFile(null);
          return;
        }
      } catch (e: any) {
        // graceful degrade if zip parse fails
        console.warn('Zip inspect failed:', e);
      }
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError(null);
    try {
      const res = await uploadFile(file, (p) => setProgress(p));
      navigate(`/files/${res.id}`);
    } catch (e: any) {
      setError(e.message || 'Upload failed');
      setUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFileSelection(f);
  };

  const onDragLeave = () => setDragging(false);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]">
      <section className="panel overflow-hidden p-6 md:p-10">
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">01 / Start a survey</p>
            <h1 className="display-font max-w-xl text-4xl font-bold leading-tight text-[#263326] md:text-6xl">Turn raw geometry into something you can measure.</h1>
          </div>
          <span className="mono-data hidden text-xs text-[#8a9082] sm:block">N 40.7128<br />W 074.0060</span>
        </div>

        <div
        className={`drop-zone cursor-pointer p-8 text-center md:p-14 ${dragging ? 'is-active' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragLeave={onDragLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') fileInputRef.current?.click();
        }}
      >
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full border border-[#bf5d32] text-2xl text-[#bf5d32]">+</div>
          <p className="display-font text-2xl font-bold text-[#263326]">Drop a file to begin</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#68705f]">Bring in a KML or a zipped shapefile. We will inspect its geometry and calculate what it contains.</p>
          <span className="mt-6 inline-flex border border-[#9da995] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#495745]">Browse files</span>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".zip,.kml" 
          onChange={handleFileChange} 
        />
      </div>

      {file && (
          <div className="mt-5 flex flex-col gap-4 border border-[#c9c6b9] bg-[#f4f1e8] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
              <p className="truncate font-semibold text-[#263326]">{file.name}</p>
              <p className="mono-data mt-1 text-xs text-[#68705f]">{formatBytes(file.size)} / {file.name.split('.').pop()?.toUpperCase()} / READY</p>
          </div>
          <button 
            onClick={handleUpload}
            disabled={uploading}
              className="button-primary shrink-0 px-5 py-3 text-sm font-bold"
          >
              {uploading ? `Sending ${progress}%` : 'Run analysis'}
          </button>
        </div>
      )}

      {error && (
          <div className="mt-5 border border-[#d7a49a] bg-[#f6dfdc] p-4 text-sm text-[#913c38]">
          {error}
        </div>
      )}
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 border-t border-[#d5d1c4] pt-4 text-xs text-[#68705f]">
          <span><strong className="text-[#263326]">ZIP</strong> shapefile bundle</span>
          <span><strong className="text-[#263326]">KML</strong> mapped layers</span>
          <span><strong className="text-[#263326]">{env.VITE_MAX_UPLOAD_MB} MB</strong> maximum</span>
        </div>
      </section>

      <aside className="flex flex-col gap-4">
        <div className="panel p-6">
          <p className="eyebrow mb-5">What happens next</p>
          <ol className="space-y-5 text-sm text-[#495745]">
            <li className="flex gap-3"><span className="mono-data text-[#bf5d32]">01</span><span><strong className="text-[#263326]">Inspect</strong><br />Validate the bundle and read its geometry.</span></li>
            <li className="flex gap-3"><span className="mono-data text-[#bf5d32]">02</span><span><strong className="text-[#263326]">Measure</strong><br />Calculate lengths and areas in a projected CRS.</span></li>
            <li className="flex gap-3"><span className="mono-data text-[#bf5d32]">03</span><span><strong className="text-[#263326]">Review</strong><br />Compare the map with each individual feature.</span></li>
          </ol>
        </div>
        <div className="border-l-2 border-[#bf5d32] px-5 py-2 text-sm leading-6 text-[#68705f]">
          <span className="eyebrow mb-2 block">Designed for the field</span>
          Keep the source file close. Groundwork preserves the original feature identity while making the measurements easy to audit.
        </div>
      </aside>
    </div>
  );
}
