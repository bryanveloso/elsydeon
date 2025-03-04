import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// Types
interface Quote {
  id: number;
  text: string;
  quotee: string;
  quoter: string;
  year: number;
  timestamp: string;
}

// Component for displaying a single quote
const QuoteCard: React.FC<{ quote: Quote }> = ({ quote }) => {
  return (
    <div className="quote-card">
      <p className="font-mono text-xl text-pretty">
        <span className="text-slate-200">&lt;{quote.quotee}&gt;&nbsp;</span>
        <span>{quote.text}</span>
      </p>
      <div className="text-[0.70rem] text-slate-600 flex gap-1">
        <span className="underline underline-offset-4">#{quote.id}</span>
        <span>/</span>
        <span>{quote.year}</span>
        {/* <span className="text-xs">Added by: {quote.quoter}</span> */}
      </div>
    </div>
  );
};

// Loading spinner component
const LoadingSpinner: React.FC = () => (
  <div className="loading">
    <div className="spinner"></div>
  </div>
);

const App: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'latest' | 'random' | 'search'>(
    'latest'
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch quotes based on active tab
  useEffect(() => {
    const fetchQuotes = async () => {
      setLoading(true);
      setError(null);

      try {
        let endpoint = '/api/quotes/latest';

        if (activeTab === 'random') {
          endpoint = '/api/quotes/random';
        } else if (activeTab === 'search' && searchTerm.length >= 3) {
          endpoint = `/api/quotes/search?q=${encodeURIComponent(searchTerm)}`;
        } else if (activeTab === 'search') {
          setLoading(false);
          return;
        }

        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setQuotes(data);
        } else if (data.error) {
          setError(data.error);
        }
      } catch (err) {
        setError('Failed to fetch quotes. Please try again later.');
        console.error('Error fetching quotes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, [activeTab, searchTerm]);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveTab('search');
  };

  return (
    <div className="max-w-xl py-12 mx-auto">
      <header className="flex">
        <h1 className="flex-1">
          <span className="">Avalonstar Quote Database</span>
        </h1>
        <div className="flex gap-4">
          <button
            className={`tab ${activeTab === 'latest' ? 'active' : ''}`}
            onClick={() => setActiveTab('latest')}
          >
            Latest Quotes
          </button>
          <button
            className={`tab ${activeTab === 'random' ? 'active' : ''}`}
            onClick={() => setActiveTab('random')}
          >
            Random Quotes
          </button>
          {searchTerm && (
            <button
              className={`tab ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              Search Results
            </button>
          )}
        </div>
      </header>

      <div className="py-6">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Search quotes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            required
            minLength={3}
          />
          <button type="submit" className="btn">
            Search
          </button>
        </form>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <LoadingSpinner />
      ) : quotes.length > 0 ? (
        <div className="grid gap-6 quote-list">
          {quotes.map(quote => (
            <QuoteCard key={quote.id} quote={quote} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', margin: '3rem 0' }}>
          {activeTab === 'search'
            ? 'No quotes found matching your search.'
            : 'No quotes available.'}
        </div>
      )}
    </div>
  );
};

export default App;
