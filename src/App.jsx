import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';

export default function App() {
  const [readingList, setReadingList] = useState(() => {
    const saved = localStorage.getItem('readingList');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('readingList', JSON.stringify(readingList));
  }, [readingList]);

  const addToReadingList = (book) => {
    if (!readingList.some(item => item.key === book.key)) {
      setReadingList([...readingList, book]);
    }
  };

  const removeFromReadingList = (key) => {
    setReadingList(readingList.filter(book => book.key !== key));
  };

  return (
    <BrowserRouter basename={import.meta.env.DEV ? '/' : '/book-finder/'}>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3 mb-4">
        <Link className="navbar-brand" to="/">📚 BookFinder</Link>
        <div className="navbar-nav">
          <Link className="nav-link" to="/">Search</Link>
          <Link className="nav-link" to="/reading-list">Reading List ({readingList.length})</Link>
        </div>
      </nav>

      <div className="container">
        <Routes>
          <Route path="/" element={<Home addToReadingList={addToReadingList} />} />
          <Route path="/book/:id" element={<BookDetail />} />
          <Route path="/reading-list" element={<ReadingList readingList={readingList} removeFromReadingList={removeFromReadingList} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

// --- SCREEN 1: HOME / SEARCH SCREEN ---
function Home({ addToReadingList }) {
  const [query, setQuery] = useState('react');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchBooks = async (searchQuery) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Failed to fetch data from API');
      const data = await response.json();
      setBooks(data.docs.slice(0, 12));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks(query);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBooks(query);
  };

  return (
    <div>
      <h2>Find Your Next Read</h2>
      <form onSubmit={handleSearch} className="input-group mb-4">
        <input 
          type="text" 
          className="form-control" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="Search books by title..." 
        />
        <button className="btn btn-primary" type="submit">Search</button>
      </form>

      {loading && <div className="text-center my-5"><div className="spinner-border text-primary" role="status"></div></div>}
      {error && <div className="alert alert-danger">Error: {error}</div>}

      <div className="row">
        {books.map((book, index) => (
          <div className="col-md-4 mb-3" key={book.key || index}>
            <div className="card h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{book.title}</h5>
                <p className="card-text text-muted">Author: {book.author_name ? book.author_name.join(', ') : 'Unknown'}</p>
                <div className="mt-auto">
                  <button 
                    className="btn btn-outline-secondary btn-sm me-2" 
                    onClick={() => navigate(`/book/${encodeURIComponent(book.key)}`, { state: { book } })}
                  >
                    Details
                  </button>
                  <button 
                    className="btn btn-success btn-sm" 
                    onClick={() => addToReadingList(book)}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- SCREEN 2: BOOK DETAIL SCREEN ---
function BookDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const book = state?.book;

  if (!book) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">
          <h4>No Book Data Found</h4>
          <p>Please go back to the search page and select a book again.</p>
        </div>
        <button className="btn btn-secondary mt-2" onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }

  return (
    <div className="card p-4 shadow mt-4">
      <h2>{book.title || 'Book Details'}</h2>
      <p className="mt-3"><strong>Author:</strong> {Array.isArray(book.author_name) ? book.author_name.join(', ') : (book.author_name || 'Unknown')}</p>
      <p><strong>First Published Year:</strong> {book.first_publish_year || 'N/A'}</p>
      <p><strong>Edition Count:</strong> {book.edition_count || 'N/A'}</p>
      <button className="btn btn-secondary mt-3 w-25" onClick={() => navigate(-1)}>Back</button>
    </div>
  );
}

// --- SCREEN 3: READING LIST SCREEN ---
function ReadingList({ readingList, removeFromReadingList }) {
  return (
    <div>
      <h2>My Saved Reading List</h2>
      {readingList.length === 0 ? (
        <p className="text-muted">Your reading list is empty. Go search and save some books!</p>
      ) : (
        <ul className="list-group">
          {readingList.map((book) => (
            <li key={book.key} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <h5>{book.title}</h5>
                <small className="text-muted">{book.author_name ? book.author_name.join(', ') : 'Unknown'}</small>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => removeFromReadingList(book.key)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}