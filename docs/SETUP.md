# LOHAA website handoff

## No build step
Open `website/index.html` to inspect the complete design offline. Keep the assets folder beside it. All images and fonts are local. The homepage has ten distinct generated photos, not external image URLs.

## Working lead collection
Requires Node.js 20 or newer. No npm install and no API keys are required. From the package root run `npm start` or `node server/server.mjs`, then open `http://127.0.0.1:3000`. On Windows, use `START-WINDOWS.bat`. The frontend detects the bundled server. When available it submits JSON to `/api/leads`; otherwise it remains in clearly labelled preview mode.

The server validates input and consent, limits request size and submission frequency, checks Origin, and writes successful leads to private `storage/leads.jsonl`. It reports success only after the file write finishes. It does not send email, SMS or WhatsApp messages or confirm appointments.

Run `npm run export-leads` to generate a spreadsheet-compatible CSV in private storage. Formula-like values are escaped in CSV. Do not put lead records into a public document root. The owner dashboard at `/admin.html` requires a password. Lead data and exports are available only through authenticated administrator API endpoints.

## Hosting
Use a host with a persistent Node.js process and persistent disk. Start command: `node server/server.mjs`. The Node service serves both website assets and the enquiry API. Set `PORT` as required; set `HOST=0.0.0.0` if your platform requires it. For a public website configure an HTTPS reverse proxy and set `PUBLIC_ORIGIN` to the exact public origin, without a trailing slash. `LOHAA_DATA_DIR` may point to a private persistent directory. Run only one app instance for this file-based storage.

Uploading only the `website` directory to static hosting gives a design preview with downloadable enquiries. A static host cannot run the bundled Node lead service.

For production, use process supervision, back up private storage and define the business's record-retention policy. The in-memory rate limiter resets on restart and, behind a proxy, sees the proxy address; configure the host's own per-client rate limits before public launch. Use a database/shared rate limiter before running multiple instances.

## Owner dashboard

Run `npm run setup-admin` (Windows: `SETUP-ADMIN-WINDOWS.bat`) in an interactive terminal. Choose a password with at least 12 characters. Input is hidden and only a salted scrypt hash is saved in private `storage/admin-config.json`. Restart the Node server, then open `/admin.html`. There is no default password. For a hosted installation, an environment secret `LOHAA_ADMIN_PASSWORD` can be used instead; it takes precedence over the private file. Never put the password in website files.

The dashboard supports search, status filters, pagination, private follow-up notes and CSV export. Status options are New, Contacted, Visit scheduled, Joined and Closed. These are internal follow-up labels: changing status does not contact the customer or confirm a booking with them. Conflicting edits from two sessions are rejected instead of silently overwriting.

Sessions use HttpOnly, SameSite=Strict cookies and expire after eight hours or a server restart. Set `PUBLIC_ORIGIN=https://your-real-domain` for hosted use so the server marks the cookie Secure and validates the exact origin. HTTPS is required for public owner access. Login rate limits are local to one process; use host-level rate limiting behind a proxy. All requests modifying lead status require a session-bound CSRF token. There is no password-recovery email flow: rerun setup and restart the server to replace a forgotten password.

Lead statuses and notes persist in private `storage/lead-status.json`. Keep this file with `leads.jsonl` when backing up or moving the server. This package uses one process with local persistent disk; use a database and shared session storage before scaling to multiple instances.

## Owner details to finalize
LOHAA is a proposed brand. Programme descriptions and membership categories are illustrative. Confirm the real services, fees, address, hours, contact destination and the business privacy contact. Generated images represent a consistent creative gym environment; replace with actual-premises photography when appropriate.

## Photos and programme flow

Ten original generated scenes remain in the homepage. Image variants in `website/assets/images/responsive` are resized delivery copies of those same scenes. The browser chooses a suitable width through srcset. Original PNGs remain in `source-images`. Photo-view buttons open a keyboard-accessible native dialog with captions, Previous, Next and Close controls. Programme details provide audience, training outline and first-visit guidance, and pass the programme name into the lead form and stored enquiry.

## Animations and access
Separate animation files control scroll reveals, the moving text strip and form transitions. Reduced-motion preferences are respected. The layout supports mobile screens, keyboard navigation, native validation, program detail dialogs and expandable FAQs.

## Editing
Edit copy in `website/index.html`, design in `assets/css` (the V3 overrides are in `refinements.css`), behaviour in `assets/js`, animation in `assets/animations`. Original PNG images are in `source-images`; optimized WebP files used by the site are in `website/assets/images`.
