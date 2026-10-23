# blurrr API

Base URL (local): `http://localhost:4000/api`

Organizer endpoints require `Authorization: Bearer <Supabase access token>`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | API health check |
| POST | `/events` | Organizer | Create an event; returns guest token once |
| GET | `/events/guest/:token` | Guest link | Validate guest link and get safe event details |
| GET | `/events/guest/:token/photos` | Guest link | List photos with short-lived signed URLs |
| POST | `/events/guest/:token/photos` | Guest link | Upload one image as multipart field `photo` |
| GET | `/admin/events` | Organizer | List owned events and photo counts |
| GET | `/admin/events/:id/photos` | Organizer | List photos in an owned event |
| GET | `/admin/events/:id/download` | Organizer | Download ZIP of event photos |
| DELETE | `/admin/photos/:id` | Organizer | Delete an owned event photo |
| DELETE | `/admin/events/:id` | Organizer | Begin and complete permanent deletion |

## Notes

- Guests can upload and read photos only when the guest token is valid and the event is active.
- Guests cannot delete photos or call organizer routes.
- Guest tokens are never stored in plaintext and cannot be recovered after event creation. Save the guest link when it is shown.
- Images are private and signed URLs expire after a short period.
- Upload limit is configured by `MAX_UPLOAD_MB`; allowed types are JPEG, PNG, and WebP.
- Event deletion marks the event `pending_deletion` before storage cleanup. If cleanup fails, guests are denied access and the organizer can retry the delete request.
