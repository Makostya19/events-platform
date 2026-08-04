import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import './Events.css';

const categoryStyle = {
  concert: { emoji: '🎵', color: '#a970ff', label: 'Concert' },
  conference: { emoji: '💼', color: '#3ba9ff', label: 'Conference' },
  festival: { emoji: '🎪', color: '#ff5fa2', label: 'Festival' },
  sports: { emoji: '⚽', color: '#3bd671', label: 'Sports' },
};

const priceLabelFor = (event) => {
  const min = event.min_ticket_price !== null && event.min_ticket_price !== undefined ? parseFloat(event.min_ticket_price) : null;
  const max = event.max_ticket_price !== null && event.max_ticket_price !== undefined ? parseFloat(event.max_ticket_price) : null;
  if (min === null && max === null) return null;
  if (max === 0) return 'Free';
  if (min === null) return `From Free`;
  if (min === max) return `$${min}`;
  return `$${min} – $${max}`;
};

const Events = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState([]);
  const [cities, setCities] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    fetchEvents();
    if (user && token) fetchFavorites();
  }, [category, city, sort, minPrice, maxPrice, dateFrom, dateTo, page]);

  // Синхронизация всех фильтров с URL, чтобы можно было поделиться ссылкой
  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    if (city) params.city = city;
    if (sort !== 'newest') params.sort = sort;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    if (page > 1) params.page = page;
    setSearchParams(params, { replace: true });
  }, [search, category, city, sort, minPrice, maxPrice, dateFrom, dateTo, page]);

  const fetchCities = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/events/meta/cities`);
      setCities(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEvents = async (overridePage) => {
    setLoading(true);
    try {
      const params = { page: overridePage || page, limit: 9, sort };
      if (category) params.category = category;
      if (city) params.city = city;
      if (search) params.search = search;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await axios.get(`${API_URL}/api/events`, { params });
      setEvents(res.data.items);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/favorites/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ids = new Set((res.data || []).map(e => e.id));
      setFavorites(ids);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFavorite = async (e, eventId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate('/login');
    try {
      if (favorites.has(eventId)) {
        await axios.delete(`${API_URL}/api/favorites/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites(prev => { const s = new Set(prev); s.delete(eventId); return s; });
      } else {
        await axios.post(`${API_URL}/api/favorites/${eventId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites(prev => new Set(prev).add(eventId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEvents(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setCity('');
    setSort('newest');
    setMinPrice('');
    setMaxPrice('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasActiveFilters = search || category || city || sort !== 'newest' || minPrice || maxPrice || dateFrom || dateTo;

  const filterFields = (
    <>
      <div className="events-filters">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '1rem' }}
          />
          <button type="submit" style={{ padding: '10px 24px', background: '#a970ff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
            Search
          </button>
        </form>
        <select
          value={category}
          onChange={e => { setCategory(e.target.value); setPage(1); }}
          style={{ padding: '10px 16px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '1rem' }}
        >
          <option value="">All Categories</option>
          <option value="concert">Concerts</option>
          <option value="conference">Conferences</option>
          <option value="festival">Festivals</option>
          <option value="sports">Sports</option>
        </select>
        <select
          value={city}
          onChange={e => { setCity(e.target.value); setPage(1); }}
          style={{ padding: '10px 16px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '1rem' }}
        >
          <option value="">All Cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={sort}
          onChange={e => { setSort(e.target.value); setPage(1); }}
          style={{ padding: '10px 16px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '1rem' }}
        >
          <option value="newest">Newest</option>
          <option value="date_asc">Date: Soonest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating_desc">Top Rated</option>
        </select>
      </div>

      <div className="events-price-filters">
        <input
          type="number"
          placeholder="Min price"
          value={minPrice}
          onChange={e => setMinPrice(e.target.value)}
          style={{ width: '120px', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #ddd' }}
        />
        <input
          type="number"
          placeholder="Max price"
          value={maxPrice}
          onChange={e => setMaxPrice(e.target.value)}
          style={{ width: '120px', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #ddd' }}
        />
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #ddd' }}
        />
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #ddd' }}
        />
        <button onClick={() => { setPage(1); fetchEvents(1); }} style={{ padding: '8px 18px', background: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
          Apply Filters
        </button>
        {hasActiveFilters && (
          <button onClick={handleResetFilters} style={{ padding: '8px 18px', background: 'transparent', color: '#e03131', border: '1.5px solid #e03131', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            Reset Filters
          </button>
        )}
      </div>
    </>
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '24px', color: '#1a1a2e' }}>All Events</h1>

      {/* Мобильная collapsible-панель фильтров */}
      <div className="events-filters-mobile-toggle">
        <button
          onClick={() => setFiltersOpen(o => !o)}
          style={{
            width: '100%', padding: '12px 16px', background: '#f5f5f7', border: '1.5px solid #ddd',
            borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', marginBottom: filtersOpen ? '16px' : '0'
          }}
        >
          <span>Filters {hasActiveFilters ? '•' : ''}</span>
          <span>{filtersOpen ? '▲' : '▼'}</span>
        </button>
      </div>

      <div className={filtersOpen ? 'events-filters-panel open' : 'events-filters-panel'}>
        {filterFields}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#888' }}>Loading...</p>
      ) : events.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#888' }}>No events found</p>
      ) : (
        <>
          <p style={{ color: '#888', marginBottom: '16px', fontSize: '0.9rem' }}>{totalPages > 0 ? `Page ${page} of ${totalPages}` : ''}</p>
          <div className="events-grid">
            {events.map(event => {
              const cat = categoryStyle[event.category] || categoryStyle.concert;
              const isFav = favorites.has(event.id);
              const priceLabel = priceLabelFor(event);
              return (
                <Link to={`/events/${event.id}`} key={event.id} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      background: '#16161a',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      border: '1px solid #2a2a30',
                      transition: 'transform 0.25s, box-shadow 0.25s, border-color 0.25s',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.boxShadow = `0 12px 32px ${cat.color}33`;
                      e.currentTarget.style.borderColor = cat.color;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = '#2a2a30';
                    }}
                  >
                    <div style={{
                      height: '160px',
                      position: 'relative',
                      background: event.image_url ? `url(${event.image_url}) center/cover` : `radial-gradient(circle at 30% 30%, ${cat.color}55, #0e0e10 70%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '3rem',
                    }}>
                      {!event.image_url && cat.emoji}
                      <span style={{
                        position: 'absolute', top: '12px', left: '12px',
                        background: cat.color, color: '#0e0e10',
                        padding: '4px 10px', borderRadius: '20px',
                        fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.03em',
                        textTransform: 'uppercase',
                      }}>
                        {cat.label}
                      </span>
                      {priceLabel === 'Free' && (
                        <span style={{
                          position: 'absolute', top: '12px', right: '12px',
                          background: '#0e0e10', color: '#3bd671',
                          padding: '4px 10px', borderRadius: '20px',
                          fontSize: '0.7rem', fontWeight: '800',
                          border: '1px solid #3bd671',
                        }}>
                          FREE
                        </span>
                      )}
                      {user && (
                        <button
                          onClick={e => toggleFavorite(e, event.id)}
                          style={{
                            position: 'absolute', bottom: '10px', right: '10px',
                            background: isFav ? `${cat.color}33` : 'rgba(0,0,0,0.5)',
                            border: `1.5px solid ${isFav ? cat.color : 'rgba(255,255,255,0.3)'}`,
                            borderRadius: '50%', width: '34px', height: '34px',
                            cursor: 'pointer', fontSize: '1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          {isFav ? '❤️' : '🤍'}
                        </button>
                      )}
                    </div>
                    <div style={{ padding: '20px' }}>
                      <h3 style={{ margin: '0 0 8px', color: '#fff', fontWeight: '700', fontSize: '1.1rem' }}>{event.title}</h3>
                      {parseFloat(event.avg_rating) > 0 && (
                        <p style={{ color: '#f5a623', fontSize: '0.85rem', marginBottom: '6px' }}>
                          ⭐ {event.avg_rating} ({event.review_count})
                        </p>
                      )}
                      <p style={{ color: '#9a9aa5', fontSize: '0.88rem', marginBottom: '6px' }}>
                        📍 {event.venue}{event.city ? `, ${event.city}` : ''}
                      </p>
                      <p style={{ color: '#9a9aa5', fontSize: '0.88rem', marginBottom: '16px' }}>
                        📅 {new Date(event.starts_at).toLocaleDateString()}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #2a2a30', paddingTop: '14px' }}>
                        <span style={{ fontWeight: '800', color: cat.color, fontSize: '1.15rem' }}>
                          {priceLabel || 'N/A'}
                        </span>
                        <span style={{ color: '#9a9aa5', fontSize: '0.8rem' }}>{event.seats_left ?? 0} seats left</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="events-pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #ddd', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
              >
                ← Prev
              </button>
              <span style={{ padding: '8px 16px', fontWeight: '600', color: '#1a1a2e' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #ddd', background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Events;