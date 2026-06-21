# Events Platform

A full-stack event ticket booking platform where users can discover events, book tickets, save favorites, and leave reviews. Built with React, Node.js, Express, and PostgreSQL.

**Live demo:** https://events-platform-wine.vercel.app
**API:** https://events-platform-production-1d72.up.railway.app

---

## Tech Stack

- **Frontend:** React, React Router, Axios
- **Backend:** Node.js, Express
- **Database:** PostgreSQL (hosted on Railway)
- **Auth:** JWT, bcrypt
- **Image hosting:** Cloudinary
- **Hosting:** Vercel (frontend), Railway (backend + database)

---

## Features

- User registration and login (email/password) with JWT authentication
- Role-based access control (User / Admin)
- Browse, search, filter, sort, and paginate events
- Event categories: concerts, conferences, festivals, sports
- Event statuses: draft, published, cancelled, archived
- Ticket booking with seat availability tracking
- Booking cancellation with automatic seat restoration
- Favorites — save events to revisit later
- Ratings & reviews — users can review events they've booked (1 review per user per event)
- Event image upload (Cloudinary)
- Admin panel:
  - Dashboard with summary stats and recent bookings
  - Event management (create, edit, publish, cancel, archive, delete)
  - Booking management with status filtering
  - User management (search, block/activate)
  - Review moderation (delete inappropriate reviews)
- Global error handling and backend validation

---

## Project Structure

```
events-platform/
├── client/          # React frontend
│   └── src/
│       ├── components/   # Navbar
│       ├── context/      # AuthContext (global auth state)
│       ├── pages/         # Home, Events, EventDetail, Login, Register,
│       │                   Favorites, MyTickets, Admin
│       └── config.js      # API base URL
└── server/          # Express backend
    ├── routes/       # auth, events, tickets, favorites, reviews, users, upload
    ├── middleware/   # JWT auth middleware
    └── db.js         # PostgreSQL connection pool
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- A PostgreSQL database (local or hosted, e.g. Railway)
- A Cloudinary account (free tier) for image uploads

### 1. Clone the repository

```bash
git clone https://github.com/Makostya19/events-platform.git
cd events-platform
```

### 2. Backend setup

```bash
cd server
npm install
```

Create a `.env` file in `server/` with:

```
PORT=5000
CLIENT_URL=http://localhost:3000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Run the database schema (see [Database Schema](#database-schema) below) against your PostgreSQL instance.

Start the server:

```bash
npm run dev
```

### 3. Frontend setup

```bash
cd ../client
npm install
```

Create a `.env` file in `client/` with:

```
REACT_APP_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm start
```

The app will be available at `http://localhost:3000`.

---

## Database Schema

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(20) DEFAULT 'user',
  status VARCHAR(20) DEFAULT 'active',
  provider VARCHAR(20) DEFAULT 'local',
  provider_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  location VARCHAR(200),
  event_date TIMESTAMP NOT NULL,
  start_datetime TIMESTAMP,
  end_datetime TIMESTAMP,
  price DECIMAL(10,2) DEFAULT 0,
  total_seats INT NOT NULL,
  available_seats INT NOT NULL,
  image_url TEXT,
  status VARCHAR(20) DEFAULT 'published',
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  event_id INT REFERENCES events(id) ON DELETE CASCADE,
  quantity INT DEFAULT 1,
  total_price DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  event_id INT REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  event_id INT REFERENCES events(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);
```

---

## API Endpoints

| Method | Endpoint                      | Access     | Description                                     |
| ------ | ----------------------------- | ---------- | ----------------------------------------------- |
| POST   | `/api/auth/register`          | Public     | Register a new user                             |
| POST   | `/api/auth/login`             | Public     | Log in                                          |
| GET    | `/api/events`                 | Public     | List events (pagination, search, filters, sort) |
| GET    | `/api/events/:id`             | Public     | Get event details with average rating           |
| POST   | `/api/events`                 | Admin      | Create event                                    |
| PUT    | `/api/events/:id`             | Admin      | Update event                                    |
| PATCH  | `/api/events/:id/status`      | Admin      | Change event status                             |
| DELETE | `/api/events/:id`             | Admin      | Delete event                                    |
| POST   | `/api/tickets`                | User       | Book a ticket                                   |
| GET    | `/api/tickets/my`             | User       | View own bookings                               |
| PATCH  | `/api/tickets/:id/cancel`     | User/Admin | Cancel a booking                                |
| GET    | `/api/tickets/admin/all`      | Admin      | View all bookings                               |
| POST   | `/api/favorites/:eventId`     | User       | Add favorite                                    |
| DELETE | `/api/favorites/:eventId`     | User       | Remove favorite                                 |
| GET    | `/api/favorites/my`           | User       | List favorites                                  |
| POST   | `/api/reviews/:eventId`       | User       | Create review (must have booking)               |
| PUT    | `/api/reviews/:id`            | User       | Update own review                               |
| DELETE | `/api/reviews/:id`            | User/Admin | Delete review                                   |
| GET    | `/api/reviews/:eventId`       | Public     | List reviews for an event                       |
| GET    | `/api/admin/users`            | Admin      | List users (search, pagination)                 |
| PATCH  | `/api/admin/users/:id/status` | Admin      | Block/activate a user                           |
| POST   | `/api/upload`                 | Admin      | Upload event image (Cloudinary)                 |

---

## Demo Credentials

| Role  | Email                              | Password |
| ----- | ---------------------------------- | -------- |
| Admin | (set via DB after registration)    | —        |
| User  | Register a new account on the site | —        |

To make an account admin, run:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

---

## Known Limitations

- Uploaded event images are hosted on Cloudinary (persist across deploys); no local file storage is used in production.
- Google/SNS login is planned but not yet implemented.
- Booking status currently only transitions between `confirmed` and `cancelled` (no `pending`/payment step).

---

## Deployment

- **Frontend:** Deployed on Vercel from the `client/` directory.
- **Backend:** Deployed on Railway from the `server/` directory, connected to a Railway-hosted PostgreSQL instance.
- Environment variables are configured directly in each platform's dashboard (not committed to the repo).
