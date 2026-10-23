# blurrr 📸

**A shared event camera for photos that feel like memories.**

### [Visit blurrr](https://blurrrr.netlify.app)

blurrr is a collaborative event photo-sharing web app where friends can capture and share moments from college festivals, parties, trips, and other gatherings—all in one shared gallery.

No guest accounts needed. Just open the event link, capture the moment, and share the memories.

### Features

- Create events and share guest links.
- Capture photos or upload them from your device.
- View photos together in a shared gallery.
- Download and manage event photos.
- Vintage-inspired, mobile-friendly interface.

### Tech Stack

HTML, CSS, JavaScript, Node.js, Express, and Supabase (Auth, PostgreSQL, and Storage).

### Project Structure

The repository is organized into separate frontend, backend, database migration, and documentation directories.

- `apps/web/` — Frontend
- `apps/api/` — Backend API
- `supabase/migrations/` — Database schema and storage setup
- `docs/` — API and architecture documentation

For implementation details, explore the project folders or read:

- [API Documentation](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)

### Security

Never commit `.env` files or expose the Supabase service-role key in the frontend.

---

*Every moment, a little blurry.*
