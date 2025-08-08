# Stripe → Slack Router (Serverless)

Forward any Stripe webhook event to Slack with flexible filtering. Deploys easily to Vercel (Next.js serverless).

- Supports all Stripe events and signature verification
- Filter with allowlist/denylist glob patterns (e.g. `invoice.*`)
- Works with Slack Incoming Webhooks (single channel)

## Examples
<img width="1195" height="634" alt="image" src="https://github.com/user-attachments/assets/35bfc9f9-96d3-4fff-8daf-ede6e436bed7" />
<img width="1301" height="838" alt="image" src="https://github.com/user-attachments/assets/00478ac2-12f6-4ef9-b2da-c28629d7500c" />


## Irrelevant Background

I've been using the Stripe integration for Slack to forward events from Stripe to Slack. However, to my unfortunate dismay, only certain events are actually forwarded to Slack, which meant I missed some pretty critical pieces of information. I wanted an alternative, and with GPT5 coming out, I wanted to see if how far a one-shot prompt could take it. All things considered, it did pretty much exactly what I needed.


## How it works

Stripe sends webhooks to `/api/stripe-webhook`. The endpoint verifies the `Stripe-Signature` header with your signing secret, optionally filters the event, formats a Slack message using Block Kit, and posts the notification to Slack (via Incoming Webhook).

- Stripe webhooks quickstart: [docs.stripe.com/webhooks/quickstart](https://docs.stripe.com/webhooks/quickstart)

## Environment variables

Copy `.env.example` to your deployment and set values:

- `STRIPE_WEBHOOK_SECRET` (required): Obtain from Stripe Dashboard → Developers → Webhooks (specific endpoint).
- `SLACK_WEBHOOK_URL` (required): Incoming Webhook URL for the Slack channel you want to post to.
- Optional filtering:
  - `STRIPE_EVENT_ALLOWLIST`: Comma-separated glob patterns; if present, only matching events are forwarded.
  - `STRIPE_EVENT_DENYLIST`: Comma-separated glob patterns; events matching any deny pattern are dropped.

## Local development

```bash
pnpm install # or npm/yarn
pnpm dev
```

Use Stripe CLI to test webhooks locally (recommended):

```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

## Deploy to Vercel

1. Create a new Vercel project and import this repo.
2. Set the environment variables in Vercel → Settings → Environment Variables.
3. Deploy.
4. In Stripe Dashboard → Developers → Webhooks, create an endpoint pointing to:
   - `https://YOUR-VERCEL-DOMAIN/api/stripe-webhook`
5. Copy the signing secret (`whsec_...`) from Stripe and set it as `STRIPE_WEBHOOK_SECRET` in Vercel.

## Slack setup

- Incoming Webhook:
  1. Go to the Slack API Apps page: [api.slack.com/apps](https://api.slack.com/apps).
  2. Create a new app (From scratch is fine) in your workspace.
  3. In the app settings, navigate to `Incoming Webhooks` and enable it.
  4. Click "Add New Webhook to Workspace" and choose the target channel.
  5. Copy the generated Webhook URL and set it as `SLACK_WEBHOOK_URL`.

  This posts to the fixed channel you selected when creating the webhook.

## Security notes

- The webhook endpoint verifies signatures with your `STRIPE_WEBHOOK_SECRET`. Ensure you keep this secret safe and unique per environment.

## Endpoint

- `GET /api/stripe-webhook`: Health/config information (no secrets).
- `POST /api/stripe-webhook`: Stripe webhook receiver.

## Event selection helper page

There is a simple UI at `/events` that lists many common Stripe event types. Use it to select events and copy a comma-separated list to set in `STRIPE_EVENT_ALLOWLIST` or `STRIPE_EVENT_DENYLIST`.
