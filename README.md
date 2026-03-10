# Empire Build Solutions

Official website for Empire Build Solutions - a software studio building platforms, automation systems and AI tools.

## Overview

This repository contains the public marketing site for:

- `empirebuildsolutions.co.uk` - main studio site
- `amare.empirebuildsolutions.co.uk` - live client project
- `bookinoo` product positioning pages inside the studio site

The site is a mostly static HTML/CSS/JS project with a lightweight Python backend used for:

- contact form handling
- local submission storage
- SMTP email delivery
- basic request hardening and rate limiting

## Main Pages

- `index.html` - homepage
- `products.html` - products and featured work overview
- `work.html` - selected work
- `studio.html` - studio positioning and process
- `services.html` - services and capabilities
- `contact.html` - enquiry page
- `amare.html` - Amare case study
- `bookinoo.html` - Bookinoo product page

Legacy pages remain for compatibility and redirect to the newer structure:

- `about.html`
- `apps.html`
- `portfolio.html`
- `lab.html`

## Project Structure

```text
.
|- assets/
|  |- logos/
|  |- projects/
|- data/
|  |- contact-submissions.jsonl
|  |- security-events.jsonl
|- deploy/
|  |- cloudflare-security-checklist.txt
|  |- nginx/
|  |- systemd/
|- server.py
|- styles.css
|- script.js
```

## Local Development

### Static preview only

If you only want to preview the site without the backend:

```bash
python3 -m http.server 8000
```

### Full local server with contact form backend

```bash
python3 server.py
```

By default the custom server runs on port `8001`.

Then open:

```text
http://localhost:8001
```

## Contact Form

The contact form submits to:

```text
POST /api/contact
```

The backend will:

- validate inputs
- apply rate limiting
- reject oversized or suspicious submissions
- store valid submissions in `data/contact-submissions.jsonl`
- send email if SMTP is configured

If email delivery fails, submissions are still stored locally.

## Environment Variables

Use `.env.example` as the reference for SMTP-related values.

This project does not load a local `.env` automatically. In production, environment values are supplied through the systemd environment file:

```text
/etc/default/empirebuildsolutions-site
```

Never commit real SMTP credentials, destination inboxes, app passwords, tunnel credentials, or server secrets into this repository.

## Production Service

The site runs as a systemd service:

```text
empirebuildsolutions-site
```

Service file source in repo:

```text
deploy/systemd/empirebuildsolutions-site.service
```

Useful commands:

```bash
sudo systemctl status empirebuildsolutions-site
sudo systemctl restart empirebuildsolutions-site
sudo journalctl -u empirebuildsolutions-site -n 100 --no-pager
```

## Cloudflare / Routing Notes

Current live routing is handled through a Cloudflare Tunnel.

Expected public behavior:

- `empirebuildsolutions.co.uk` -> main site on `127.0.0.1:8001`
- `empirebuildsolutions.co.uk/tv` -> Jellyfin on `127.0.0.1:8096`
- `amare.empirebuildsolutions.co.uk` -> existing Amare service
- `bookinoo.empirebuildsolutions.co.uk` -> tunnel route exists, but the public site does not expose that link

Reference docs:

- `deploy/cloudflare-security-checklist.txt`
- `deploy/nginx/`

## Public Repo Safety

This repository is intended to stay public.

Safe to keep here:

- HTML, CSS, JS, and Python application code
- deployment templates and reference configs
- placeholder environment examples
- public domain names and public-facing product positioning

Do not commit:

- real SMTP usernames/passwords
- real inbox destinations if you do not want them public
- server environment files
- Cloudflare tunnel credentials
- private logs or submission data
- machine-specific secrets or tokens

## Security

The backend currently includes:

- input validation
- request size limits
- email validation
- per-IP rate limiting
- honeypot anti-spam field
- security event logging
- security headers
- hardened systemd service settings

Cloudflare should also enforce additional protection on `POST /api/contact`.

## Logging

- submissions: `data/contact-submissions.jsonl`
- blocked/suspicious events: `data/security-events.jsonl`

These files are intentionally ignored by git.

## Git

Primary branch:

```text
main
```

Remote:

```text
git@github.com:Bookinoo-app/empirebuildsolutions.git
```

## Notes

- Bookinoo is intentionally positioned as an in-development product and not publicly linked as a live app from the site.
- Amare remains publicly linked as a live client-facing case study.
- The repository contains deployment notes, but live secrets and machine-specific config stay outside version control.
