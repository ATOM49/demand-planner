# Docker Placeholder

Docker packaging is intentionally out of scope for the first local-first MVP.

If containerization is needed later, keep these constraints:

- Build only the `apps/web` runtime.
- Persist the SQLite file and staged import directory with mounted volumes.
- Keep the image focused on local evaluation and preview environments, not heavy background processing.