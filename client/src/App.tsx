import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UploadPage } from './pages/UploadPage.tsx';
import { FilePage } from './pages/FilePage.tsx';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="app-shell flex min-h-screen flex-col">
          <header className="app-header sticky top-0 z-20 flex items-center justify-between gap-4 px-5 py-4 md:px-10">
            <Link to="/" className="flex items-center gap-3 no-underline">
              <span className="brand-mark" aria-hidden="true">G</span>
              <span>
                <span className="eyebrow block">Field measurement desk</span>
                <span className="display-font block text-xl font-bold text-[#263326]">Groundwork</span>
              </span>
            </Link>
            <nav className="flex items-center gap-2 text-sm font-semibold">
              <span className="hidden text-xs text-[#68705f] sm:inline">GIS FILE ANALYSIS</span>
              <Link to="/" className="button-quiet rounded px-3 py-2">New survey</Link>
            </nav>
          </header>
          <main className="flex flex-1 flex-col px-4 py-6 md:px-10 md:py-10">
            <Routes>
              <Route path="/" element={<UploadPage />} />
              <Route path="/files/:id" element={<FilePage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
