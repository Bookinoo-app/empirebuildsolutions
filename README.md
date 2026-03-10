# Empire Build Solutions

Official website for Empire Build Solutions - a software studio building platforms, automation systems and AI tools.

## Overview

This repository contains the public website for Empire Build Solutions, including:

- the main studio site
- featured work and case study pages
- product positioning pages
- contact handling for project enquiries

## Stack

- HTML
- CSS
- JavaScript
- Python

The site is mostly static, with a lightweight Python backend used for contact form handling.

## Main Pages

- `index.html` - homepage
- `products.html` - products and featured work overview
- `work.html` - selected work
- `studio.html` - studio positioning and process
- `services.html` - services and capabilities
- `contact.html` - enquiry page
- `amare.html` - Amare case study
- `bookinoo.html` - Bookinoo product page

Legacy pages are kept for compatibility and redirect to the newer structure.

## Features

- studio marketing site
- product and case study pages
- contact form handling
- input validation and anti-spam protections
- deployment support templates

## Local Development

### Static preview

```bash
python3 -m http.server 8000
```

### Backend preview

```bash
python3 server.py
```

## Environment

Use `.env.example` as a reference for the contact-mail configuration.

Production secrets and real environment values are supplied outside version control.

## Deployment

This repository includes deployment-related templates and reference files for running the site in production.

Production-specific infrastructure details, secrets, credentials, and machine-specific configuration are intentionally kept outside this public repository.

## Public Repo Safety

This repository is intended to stay public.

Safe to keep here:

- public site code
- public-facing content
- asset files used by the site
- deployment templates and reference examples
