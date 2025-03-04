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
      <span className="quote-id">#{quote.id}</span>
      <p className="quote-text">{quote.text}</p>
      <div className="quote-meta">
        <span>— {quote.quotee}</span>
        <span>{quote.year}</span>
      </div>
      <div className="quote-meta" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
        <span>Added by: {quote.quoter}</span>
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
    <div className="container">
      <header className="header">
        <h1>
          <span>Quote Manager</span>
        </h1>
      </header>

      <div className="search-container">
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

      <div className="tabs">
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

      {error && <div className="error">{error}</div>}

      {loading ? (
        <LoadingSpinner />
      ) : quotes.length > 0 ? (
        <div className="quote-list">
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

// Render the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

export default App;
