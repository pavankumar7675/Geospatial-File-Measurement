import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchFileInfo, fetchMeasurements } from '../api/client';
import { MapView } from '../components/map/MapView';
import type { FeatureMeasurement } from '../api/types';

function formatMeasurement(feature: FeatureMeasurement) {
  if (feature.measurement.kind === 'none' || feature.measurement.kind === 'unsupported') {
    return feature.measurement.kind;
  }
  return `${feature.measurement.value?.toFixed(2)} ${feature.measurement.unit}`;
}

function formatTotal(value: number, unit: string) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit}`;
}

export function FilePage() {
  const { id } = useParams<{ id: string }>();
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | number | null>(null);

  const { data: fileInfo, isLoading: loadingInfo, error: errorInfo } = useQuery({
    queryKey: ['file', id],
    queryFn: () => fetchFileInfo(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const state = query.state.data;
      if (state?.status === 'PENDING' || state?.status === 'PROCESSING') return 2000;
      return false;
    }
  });

  const { data: measurements, isLoading: loadingMeasurements } = useQuery({
    queryKey: ['measurements', id],
    queryFn: () => fetchMeasurements(id!),
    enabled: !!id && fileInfo?.status === 'COMPLETED',
  });

  const summary = useMemo(() => {
    const results = measurements ?? [];
    return {
      area: results.filter((feature) => feature.measurement.kind === 'area').reduce((total, feature) => total + (feature.measurement.value ?? 0), 0),
      length: results.filter((feature) => feature.measurement.kind === 'length').reduce((total, feature) => total + (feature.measurement.value ?? 0), 0),
      measured: results.filter((feature) => feature.measurement.kind === 'area' || feature.measurement.kind === 'length').length,
      unsupported: results.filter((feature) => feature.measurement.kind === 'unsupported' || feature.measurement.kind === 'none').length,
    };
  }, [measurements]);

  if (loadingInfo) return <div className="panel mx-auto w-full max-w-6xl p-8"><span className="eyebrow">Loading record</span><p className="display-font mt-3 text-3xl text-[#263326]">Locating your survey...</p></div>;
  if (errorInfo || !fileInfo) return <div className="panel mx-auto w-full max-w-6xl p-8"><span className="eyebrow text-[#913c38]">Record unavailable</span><p className="display-font mt-3 text-3xl text-[#263326]">We could not load this file.</p><Link to="/" className="button-primary mt-6 inline-block px-4 py-3 text-sm font-bold">Return to intake</Link></div>;

  const isProcessing = fileInfo.status === 'PENDING' || fileInfo.status === 'PROCESSING';

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="min-w-0">
          <Link to="/" className="eyebrow text-[#bf5d32]">Back to intake</Link>
          <p className="eyebrow mt-5">02 / Analysis record</p>
          <h1 className="display-font mt-2 truncate text-3xl font-bold text-[#263326] md:text-5xl">{fileInfo.filename}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#68705f]">
            <span className={`status-pill ${isProcessing ? 'is-processing' : fileInfo.status === 'FAILED' ? 'is-failed' : ''}`}>{fileInfo.status}</span>
            <span className="mono-data">{fileInfo.feature_count} features</span>
            <span className="mono-data">CRS {fileInfo.crs || 'not supplied'}</span>
          </div>
        </div>
        <span className="mono-data text-xs text-[#8a9082]">FILE ID<br />{fileInfo.id}</span>
      </div>

      {fileInfo.status === 'COMPLETED' ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="panel p-4"><span className="eyebrow">Total area</span><p className="metric-value mt-3">{formatTotal(summary.area, 'm2')}</p></div>
            <div className="panel p-4"><span className="eyebrow">Total length</span><p className="metric-value mt-3">{formatTotal(summary.length, 'm')}</p></div>
            <div className="panel p-4"><span className="eyebrow">Measured</span><p className="metric-value mt-3">{summary.measured}<span className="ml-1 text-base text-[#68705f]">/ {fileInfo.feature_count}</span></p></div>
            <div className="panel p-4"><span className="eyebrow">Unmeasured</span><p className="metric-value mt-3">{summary.unsupported}</p></div>
          </div>

          <div className="panel grid min-h-[520px] overflow-hidden lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
            <div className="relative min-h-[360px] border-b border-[#cbc8bb] lg:border-b-0 lg:border-r">
              {measurements ? <MapView features={measurements} selectedFeatureId={selectedFeatureId} onSelectFeature={setSelectedFeatureId} /> : <div className="p-6 text-sm text-[#68705f]">Loading map layers...</div>}
              <div className="pointer-events-none absolute left-4 top-4 z-[400] border border-[#cbc8bb] bg-[#faf8f1]/90 px-3 py-2 text-xs text-[#495745] shadow-sm"><span className="eyebrow block">Map view</span><span className="mono-data">{measurements?.filter((feature) => feature.geometry).length || 0} geometries plotted</span></div>
            </div>
            <div className="min-w-0 overflow-auto p-5 md:p-6">
              <div className="mb-5 flex items-end justify-between gap-3">
                <div><p className="eyebrow">Feature register</p><h2 className="display-font mt-1 text-2xl font-bold text-[#263326]">Measurements</h2></div>
                <span className="mono-data text-xs text-[#68705f]">{Math.min(measurements?.length || 0, 100).toString().padStart(2, '0')} / 100</span>
              </div>
              {loadingMeasurements ? <p className="text-sm text-[#68705f]">Reading feature measurements...</p> : measurements?.length ? (
                <table className="w-full border-collapse text-left text-sm">
                  <thead><tr className="border-b border-[#b8b7aa] text-[0.68rem] uppercase tracking-[0.1em] text-[#68705f]"><th className="pb-3 pr-3 font-bold">ID</th><th className="pb-3 pr-3 font-bold">Geometry</th><th className="pb-3 text-right font-bold">Result</th></tr></thead>
                  <tbody>{measurements.slice(0, 100).map((feature) => <tr key={feature.feature_id} className={`cursor-pointer border-b border-[#dedbd0] transition-colors hover:bg-[#f4f1e8] ${selectedFeatureId === feature.feature_id ? 'bg-[#f7e8dc]' : ''}`} onClick={() => setSelectedFeatureId(feature.feature_id)}>
                    <td className="py-3 pr-3 font-semibold text-[#263326]">{feature.feature_id}</td><td className="py-3 pr-3 text-[#68705f]">{feature.geometry_type}</td><td className={`py-3 text-right font-semibold ${feature.measurement.kind === 'unsupported' || feature.measurement.kind === 'none' ? 'text-[#9a9588]' : 'text-[#bf5d32]'}`}>{formatMeasurement(feature)}</td>
                  </tr>)}</tbody>
                </table>
              ) : <p className="text-sm text-[#68705f]">No measurements were returned for this file.</p>}
              {measurements && measurements.length > 100 && <p className="mt-4 text-xs text-[#68705f]">Showing the first 100 features. The map includes all returned geometries.</p>}
            </div>
          </div>
        </>
      ) : (
        <div className="panel p-8 md:p-12">
          <span className={`status-pill ${isProcessing ? 'is-processing' : 'is-failed'}`}>{fileInfo.status}</span>
          <h2 className="display-font mt-5 max-w-xl text-4xl font-bold text-[#263326]">{isProcessing ? 'Your geometry is being read.' : 'This file could not be processed.'}</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#68705f]">{isProcessing ? 'We are checking the source layers and calculating measurements. This page will update automatically.' : fileInfo.error || 'The server returned an error while processing this file. Check the source bundle and try again.'}</p>
          {isProcessing && <div className="mt-8 h-1 max-w-md overflow-hidden bg-[#d5d1c4]"><div className="h-full w-2/3 animate-pulse bg-[#bf5d32]" /></div>}
        </div>
      )}
    </div>
  );
}
