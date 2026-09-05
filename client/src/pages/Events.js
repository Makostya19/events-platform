import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { MusicIcon, BriefcaseIcon, FestivalIcon, SportsIcon, MapPinIcon, CalendarIcon, StarIcon, HeartIcon, SearchIcon, SeatIcon } from '../components/Icons';
import './Events.css';

const categoryMeta = {
  concert: { icon: MusicIcon, label: 'Concert' },
  conference: { icon: BriefcaseIcon, label: 'Conference' },
  festival: { icon: FestivalIcon, label: 'Festival' },
  sports: { icon: SportsIcon, label: 'Sports' },
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

const DateBlock = ({ iso }) => {
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  return (
    <div className="event-date-block" aria-hidden="true">
      <span className="event-date-day">{day}</span>
      <span className="event-date-month">{month}</span>
    </div>
  );
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
        <form onSubmit={handleSearch} className="events-search-form">
          <label htmlFor="events-search" className="visually-hidden">Search events</label>
          <SearchIcon className="events-search-icon" />
          <input
            id="events-search"
            name="search"
            type="text"
            placeholder="Search by name, venue, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="events-search-input"
          />
          <button type="submit" className="btn-filled">Search</button>
        </form>
        <label htmlFor="events-category" className="visually-hidden">Category</label>
        <select id="events-category" name="category" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="events-select">
          <option value="">All categories</option>
          <option value="concert">Concerts</option>
          <option value="conference">Conferences</option>
          <option value="festival">Festivals</option>
          <option value="sports">Sports</option>
        </select>
        <label htmlFor="events-city" className="visually-hidden">City</label>
        <select id="events-city" name="city" value={city} onChange={e => { setCity(e.target.value); setPage(1); }} className="events-select">
          <option value="">All cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label htmlFor="events-sort" className="visually-hidden">Sort by</label>
        <select id="events-sort" name="sort" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} className="events-select">
          <option value="newest">Newest</option>
          <option value="date_asc">Date: Soonest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating_desc">Top Rated</option>
        </select>
      </div>

      <div className="events-price-filters">
        <label htmlFor="events-min-price" className="visually-hidden">Minimum price</label>
        <input id="events-min-price" name="minPrice" type="number" placeholder="Min price" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="events-small-input" />
        <label htmlFor="events-max-price" className="visually-hidden">Maximum price</label>
        <input id="events-max-price" name="maxPrice" type="number" placeholder="Max price" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="events-small-input" />
        <label htmlFor="events-date-from" className="visually-hidden">Date from</label>
        <input id="events-date-from" name="dateFrom" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="events-small-input" />
        <label htmlFor="events-date-to" className="visually-hidden">Date to</label>
        <input id="events-date-to" name="dateTo" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="events-small-input" />
        <button onClick={() => { setPage(1); fetchEvents(1); }} className="btn-outline">Apply</button>
        {hasActiveFilters && (
          <button onClick={handleResetFilters} className="btn-text-danger">Reset filters</button>
        )}
      </div>
    </>
  );

  return (
    <div className="events-page">
      <h1 className="events-title">All events</h1>

      <div className="events-filters-mobile-toggle">
        <button
          onClick={() => setFiltersOpen(o => !o)}
          aria-expanded={filtersOpen}
          aria-controls="events-filters-panel"
          className="events-filters-toggle-btn"
        >
          <span>Filters {hasActiveFilters ? '•' : ''}</span>
          <span aria-hidden="true">{filtersOpen ? '▲' : '▼'}</span>
        </button>
      </div>

      <div id="events-filters-panel" className={filtersOpen ? 'events-filters-panel open' : 'events-filters-panel'}>
        {filterFields}
      </div>

      {loading ? (
        <div className="events-grid">
          {[...Array(6)].map((_, i) => <div key={i} className="event-card-skeleton" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="events-empty">
          <p>No events match these filters.</p>
          {hasActiveFilters && <button onClick={handleResetFilters} className="btn-outline">Clear filters</button>}
        </div>
      ) : (
        <>
          <p className="events-count">{totalPages > 0 ? `Page ${page} of ${totalPages}` : ''}</p>
          <div className="events-grid">
            {events.map(event => {
              const meta = categoryMeta[event.category] || categoryMeta.concert;
              const CatIcon = meta.icon;
              const isFav = favorites.has(event.id);
              const priceLabel = priceLabelFor(event);
              return (
                <Link to={`/events/${event.id}`} key={event.id} className="event-card">
                  <div className={`event-card-media event-card-media--${event.category || 'concert'}`}>
                    {event.image_url ? (
                      <img src={event.image_url} alt="" loading="lazy" className="event-card-image" />
                    ) : (
                      <CatIcon width={36} height={36} />
                    )}
                    <DateBlock iso={event.starts_at} />
                    {priceLabel === 'Free' && <span className="badge-free">Free</span>}
                    {user && (
                      <button
                        key={`fav-${event.id}-${isFav}`}
                        onClick={e => toggleFavorite(e, event.id)}
                        aria-label={isFav ? `Remove ${event.title} from favorites` : `Add ${event.title} to favorites`}
                        aria-pressed={isFav}
                        className={isFav ? 'fav-button fav-button--active' : 'fav-button'}
                      >
                        <HeartIcon filled={isFav} width={16} height={16} />
                      </button>
                    )}
                  </div>
                  <div className="event-card-body">
                    <span className="event-card-category">
                      <CatIcon width={14} height={14} /> {meta.label}
                    </span>
                    <h3 className="event-card-title">{event.title}</h3>
                    {parseFloat(event.avg_rating) > 0 && (
                      <p className="event-card-rating">
                        <StarIcon filled width={14} height={14} /> {event.avg_rating} ({event.review_count})
                      </p>
                    )}
                    <p className="event-card-meta">
                      <MapPinIcon width={14} height={14} /> {event.venue}{event.city ? `, ${event.city}` : ''}
                    </p>
                    <div className="event-card-footer">
                      <span className="event-card-price">{priceLabel || 'N/A'}</span>
                      <span className="event-card-seats"><SeatIcon width={14} height={14} /> {event.seats_left ?? 0} left</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="events-pagination">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline">← Prev</button>
              <span className="events-pagination-label">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-outline">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Events;