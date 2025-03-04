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
        <span className="text-zinc-200">&lt;{quote.quotee}&gt;&nbsp;</span>
        <span>{quote.text}</span>
      </p>
      <div className="text-[0.70rem] text-zinc-600 flex gap-1">
        <span className="underline underline-offset-4">#{quote.id}</span>
        <span>/</span>
        <span>{quote.year}</span>
        {/* <span className="text-xs">Added by: {quote.quoter}</span> */}
      </div>
      <div className="relative"></div>
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
  const [searchType, setSearchType] = useState<'content' | 'user'>('content');

  // Fetch quotes based on active tab
  useEffect(() => {
    const fetchQuotes = async () => {
      setLoading(true);
      setError(null);

      try {
        let endpoint = '/api/quotes/latest';

        if (activeTab === 'random') {
          endpoint = '/api/quotes/random';
        } else if (activeTab === 'search') {
          // Validate search term length based on search type
          const minLength = searchType === 'user' ? 2 : 3;
          if (searchTerm.length < minLength) {
            setLoading(false);
            return;
          }

          // Use appropriate endpoint based on search type
          if (searchType === 'content') {
            endpoint = `/api/quotes/search?q=${encodeURIComponent(searchTerm)}`;
          } else if (searchType === 'user') {
            endpoint = `/api/quotes/user/${encodeURIComponent(searchTerm)}`;
          }
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
  }, [activeTab, searchTerm, searchType]);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveTab('search');
  };

  return (
    <div className="mx-auto max-w-6xl px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-2xl">
        <header className="flex">
          <h1 className="flex-1">
            <span className="font-bold">Avalonstar Quote Database</span>
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
            <div className="flex flex-col mb-2">
              <div className="flex gap-4 mb-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="searchType"
                    checked={searchType === 'content'}
                    onChange={() => setSearchType('content')}
                    className="mr-2"
                  />
                  Search in quotes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="searchType"
                    checked={searchType === 'user'}
                    onChange={() => setSearchType('user')}
                    className="mr-2"
                  />
                  Search by user
                </label>
              </div>
            </div>

            <div className="mt-2 flex">
              <div className="-mr-px grid grow grid-cols-1 focus-within:relative">
                <input
                  type="text"
                  className="col-start-1 row-start-1 block w-full rounded-l-md bg-white py-1.5 pr-3 pl-10 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:pl-9 sm:text-sm/6"
                  placeholder={
                    searchType === 'content'
                      ? 'Search quotes...'
                      : 'Search by username...'
                  }
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  required
                  minLength={searchType === 'content' ? 3 : 2}
                />
              </div>
              <button
                type="submit"
                className="flex shrink-0 items-center gap-x-1.5 rounded-r-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-1 -outline-offset-1 outline-gray-300 hover:bg-gray-50 focus:relative focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {error && <div className="error">{error}</div>}

        {loading ? (
          <LoadingSpinner />
        ) : quotes.length > 0 ? (
          <div className="grid gap-8 quote-list">
            {quotes.map(quote => (
              <QuoteCard key={quote.id} quote={quote} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', margin: '3rem 0' }}>
            {activeTab === 'search'
              ? searchType === 'content'
                ? 'No quotes found matching your search.'
                : 'No quotes found from this user.'
              : 'No quotes available.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
