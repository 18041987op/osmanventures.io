# osmanventures.io

Personal portfolio site for Osman — full-stack developer and business owner from
Charlotte, NC. Built with the Next.js App Router, Tailwind CSS, and Framer Motion,
and deployed on Vercel.

## Tech stack

- **Next.js** (App Router) + **React** + **TypeScript**
- **Tailwind CSS v4** for styling
- **Framer Motion** for animations
- **lucide-react** for icons
- **Resend** for the contact form email delivery

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | Description                |
| --------------- | -------------------------- |
| `npm run dev`   | Start the dev server       |
| `npm run build` | Production build           |
| `npm run start` | Serve the production build |
| `npm run lint`  | Run ESLint                 |

## Contact form

The contact form posts to the `/api/contact` route handler
(`src/app/api/contact/route.ts`), which validates the input, traps bots with a
honeypot field, and sends the message via [Resend](https://resend.com) using
`replyTo` so replies reach the sender.

Configure these environment variables (see `.env.example`):

| Variable             | Required | Notes                                                               |
| -------------------- | -------- | ------------------------------------------------------------------- |
| `RESEND_API_KEY`     | Yes      | API key from your Resend account.                                   |
| `CONTACT_FROM_EMAIL` | No\*     | Sender address; must be on a **verified** Resend domain.            |
| `CONTACT_TO_EMAIL`   | No       | Inbox that receives messages. Defaults to `osman@osmanventures.io`. |

\* In production you must set `CONTACT_FROM_EMAIL` to an address on a domain you
have verified in Resend, otherwise Resend rejects the send (HTTP 502).

## Project structure

```
src/
  app/
    api/contact/route.ts   # Contact form backend (Resend)
    opengraph-image.tsx    # Generated Open Graph / Twitter share image
    layout.tsx, page.tsx
  components/              # Section components (Hero, About, Projects, ...)
  lib/site.ts             # Centralized site/contact details
public/images/            # Project screenshots
docs/revision-sitio.md    # Site review + action plan
```

## Deployment

Deployed on [Vercel](https://vercel.com). Remember to configure the contact-form
environment variables in the project settings, then redeploy.
