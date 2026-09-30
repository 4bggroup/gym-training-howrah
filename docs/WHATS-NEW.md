# Update 4 — visual experience and lead desk

- Responsive delivery images (480, 800 and 1200 pixels where appropriate), with ten original scenes retained.
- Full photo viewer with captions, keyboard navigation, Previous/Next and Close.
- Programme details explain audience, training outline and the first conversation.
- Selected programme follows the visitor into enquiry, the saved lead and CSV export.
- Password-protected lead dashboard with counts, search, filters and pagination.
- Private follow-up status and notes, with conflicting edits detected.
- CSV export available from the dashboard and Windows launcher.
- First-run admin password setup uses hidden entry and salted scrypt hashing.
- Existing responsive design, animations, local image/font assets and footer credit retained.

## Validation

Verified API login, logout, authorization, session-cookie flags, CSRF and Origin checks, lead creation with programme, search/filter, notes/status persistence across restart, conflict rejection, CSV formula escaping, rate limits and private-file access restrictions. Static checks cover unique HTML IDs, asset paths, responsive image variants and the exact footer credit. No sample leads, credentials or passwords are shipped.

The required control-browser skill is not available in this environment. Direct browser visual and interaction testing could not be completed; this is a limitation, not a passed check.
