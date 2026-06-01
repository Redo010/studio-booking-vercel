import { useState, useEffect } from 'react';
import Head from 'next/head';
import Nav from '../components/Nav';
import SearchFilters from '../components/SearchFilters';
import StudioCard from '../components/StudioCard';

export default function HomePage() {
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchMeta, setSearchMeta] = useState(null);
  const [error, setError] = useState(null);

  // Load all studios on mount
  useEffect(() => {
    fetchStudios({});
  }, []);

  const fetchStudios = async (params) => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (params.date) query.set('date', params.date);
      if (params.start_hour) query.set('start_hour', params.start_hour);
      if (params.end_hour) query.set('end_hour', params.end_hour);
      if (params.size) query.set('size', params.size);
      if (params.requirements?.length) query.set('requirements', params.requirements.join(','));

      const res = await fetch(`/api/studios/search?${query}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      
      setStudios(data.studios);
      setSearchMeta({ ...data.searchParams, total: data.total });
      setSearched(!!params.date);
    } catch (err) {
      setError('Failed to load studios. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (params) => {
    fetchStudios(params);
  };

  const availableCount = studios.filter(s => s.availability?.status === 'AVAILABLE').length;
  const partialCount = studios.filter(s => s.availability?.status === 'PARTIAL').length;

  return (
    <>
      <Head>
        <title>StudioBook Dubai — Book Production Studios Instantly</title>
        <meta name="description" content="Real-time booking for Dubai's best production studios. Instant availability, no waiting." />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎬</text></svg>" />
      </Head>

      <Nav />

      <main className="min-h-screen bg-obsidian-950">
        {/* Hero */}
        <section className="relative pt-32 pb-16 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-obsidian-900/50 to-obsidian-950" />
          
          {/* Ambient light effect */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(ellipse, #d08428 0%, transparent 70%)' }}
          />
          
          <div className="relative max-w-7xl mx-auto text-center">
            <div className="section-label mb-6 inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Availability · Dubai · UAE
            </div>
            
            <h1 className="display-heading text-5xl sm:text-7xl text-sand-50 mb-4 leading-none">
              Book Production
              <br />
              <span className="text-sand-400 italic">Studios Instantly</span>
            </h1>
            
            <p className="text-obsidian-400 text-lg max-w-xl mx-auto mb-8 font-light">
              Real-time availability across Dubai's top studios.
              No WhatsApp. No back-and-forth. Just book.
            </p>

            {/* Quick stats */}
            <div className="flex items-center justify-center gap-8 text-sm font-mono text-obsidian-400">
              <div>
                <span className="text-sand-300 font-medium">6</span> Studios
              </div>
              <div className="w-px h-4 bg-obsidian-700" />
              <div>
                <span className="text-emerald-400 font-medium">Real-time</span> Availability
              </div>
              <div className="w-px h-4 bg-obsidian-700" />
              <div>
                <span className="text-sand-300 font-medium">Instant</span> Booking
              </div>
            </div>
          </div>
        </section>

        {/* Main content */}
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
            
            {/* Filters sidebar */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              <SearchFilters onSearch={handleSearch} loading={loading} />
            </div>

            {/* Results */}
            <div>
              {/* Results header */}
              {searched && searchMeta && (
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-sm text-obsidian-300">
                      {searchMeta.total} {searchMeta.total === 1 ? 'studio' : 'studios'} found
                      {searchMeta.date && <span className="text-obsidian-500"> · {searchMeta.date}</span>}
                    </p>
                    {(availableCount > 0 || partialCount > 0) && (
                      <p className="text-xs font-mono text-obsidian-500 mt-0.5">
                        {availableCount > 0 && <span className="text-emerald-400">{availableCount} fully available</span>}
                        {availableCount > 0 && partialCount > 0 && ' · '}
                        {partialCount > 0 && <span className="text-amber-400">{partialCount} partial</span>}
                      </p>
                    )}
                  </div>
                  <div className="text-xs font-mono text-obsidian-500">
                    Ranked by match + availability
                  </div>
                </div>
              )}

              {!searched && (
                <div className="mb-5">
                  <p className="text-sm text-obsidian-400">
                    All {studios.length} studios · Select dates to check availability
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-4 text-sm mb-5">
                  {error}
                </div>
              )}

              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-obsidian-900 border border-obsidian-800 h-80 animate-pulse" />
                  ))}
                </div>
              )}

              {!loading && studios.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {studios.map((studio, i) => (
                    <div key={studio.id} className="animate-fade-in-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: `${i * 60}ms` }}>
                      <StudioCard 
                        studio={studio} 
                        searchParams={searchMeta}
                        rank={i}
                      />
                    </div>
                  ))}
                </div>
              )}

              {!loading && studios.length === 0 && (
                <div className="text-center py-20 border border-obsidian-800">
                  <div className="text-4xl mb-4">🎬</div>
                  <p className="text-obsidian-400">No studios match your criteria</p>
                  <p className="text-xs text-obsidian-600 mt-2 font-mono">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-obsidian-800 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="section-label">
            StudioBook Dubai · {new Date().getFullYear()}
          </div>
          <div className="text-xs font-mono text-obsidian-600">
            Real-time booking infrastructure for production studios in the UAE
          </div>
        </div>
      </footer>
    </>
  );
}
