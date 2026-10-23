# blurrr

**A shared event camera for photos that feel like memories.**

## Open the website

### [Visit blurrr](https://blurrrr.netlify.app)

Browse the site and explore the app. To use the camera, open it in a modern browser and allow camera access when prompted. Camera access requires HTTPS, which the live site uses.

To create an event and share photos, the deployed API and Supabase project must also be configured and available.

## What you can do

- Create an event and share its private guest link or QR code.
- Let guests upload photos without creating accounts.
- Capture photos with the camera or choose them from a device.
- Browse the shared event gallery.
- Download or manage event photos as the organizer.

## Project structure

```text
apps/
  web/       Static website and browser app
  api/       Node.js and Express API
supabase/
  migrations/ Database schema and private photo storage setup
docs/        API and architecture notes
```

## Built with

HTML, CSS, JavaScript, Node.js, Express, and Supabase (Auth, PostgreSQL, and Storage).

## More information

- [API documentation](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)

Never commit `.env` files or expose the Supabase service-role key in the frontend.
