# blurrr architecture

```mermaid
flowchart TD
  Guest[Guest mobile browser] --> Web[Static frontend on Netlify]
  Organizer[Organizer browser] --> Web
  Web -->|Guest token / REST API| API[Express API on Render]
  Web -->|Organizer sign-in| Auth[Supabase Auth]
  Web -->|Access token| API
  API -->|Validate token| Auth
  API --> DB[(Supabase PostgreSQL)]
  API --> Storage[(Private Supabase Storage)]
  API -->|Short-lived signed image URLs| Web
```

The browser holds only the Supabase public anon/publishable key. The service-role key exists only in the Render environment. Because server-side service-role requests bypass RLS, the API must enforce organizer ownership and guest-token checks for every protected operation.
