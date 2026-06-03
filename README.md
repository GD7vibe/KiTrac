# KiTrac — Track your kit!

A child safety QR labelling system. Parents register their children's school kit and clothing, receive unique QR codes, and stitch/stick them onto items. When someone finds a labelled item, they scan the QR code and land on this page to report it — anonymously, with no login required.

## Features

- **Instant scan logging** — GPS location captured the moment the QR is scanned, even before the form is filled in
- **4-step form** — School/Club, Town/Postcode, Item description, Where is it now
- **Voice input** — tap the mic to speak instead of typing (Chrome, Safari)
- **Abandon detection** — if someone scans but doesn't complete the form, the scan event (with location) is still logged
- **Privacy-first** — the finder never sees the child's details; the parent is notified and contacts the finder

## Local development

```bash
npm install
npm run dev
```

## Deployment

Push to the `main` branch and GitHub Actions will automatically build and deploy to GitHub Pages.
