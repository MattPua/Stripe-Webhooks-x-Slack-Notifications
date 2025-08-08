import Stripe from 'stripe';

import pino from 'pino';
const logger = pino({
  level: 'info',
  name: 'formatters',
});

function stripeDashboardUrl(event: Stripe.Event): string {
  const livemode = !!event.livemode;
  const base = livemode
    ? 'https://dashboard.stripe.com'
    : 'https://dashboard.stripe.com/test';
  const dataObj: any = event.data.object || {};
  const objType: string | undefined = dataObj.object;
  const id: string | undefined = dataObj.id;

  if (objType && id) {
    switch (objType) {
      case 'payment_intent':
        return `${base}/payments/${id}`;
      case 'charge':
        return `${base}/payments/${id}`;
      case 'invoice':
        return `${base}/invoices/${id}`;
      case 'customer':
        return `${base}/customers/${id}`;
      case 'subscription':
        return `${base}/subscriptions/${id}`;
      case 'checkout.session':
        return `${base}/checkouts/sessions/${id}`;
      default:
        return `${base}/events/${event.id}`;
    }
  }
  return `${base}/events/${event.id}`;
}

function asMoney(
  amount: number | null | undefined,
  currency: string | undefined,
): string | undefined {
  if (amount == null || currency == null) return undefined;
  const decimals = 2; // most currencies; for brevity not handling zero-decimal currencies here
  const formatted = (amount / Math.pow(10, decimals)).toFixed(decimals);
  return `${formatted} ${currency.toUpperCase()}`;
}

export function formatSlackMessage(event: Stripe.Event) {
  const obj: any = event.data.object || {};
  const customerEmail: string | undefined =
    obj.customer_email ||
    obj.receipt_email ||
    obj.email ||
    obj.customer_details?.email;
  const amount: number | undefined =
    obj.amount || obj.amount_total || obj.amount_due || obj.amount_paid;
  const currency: string | undefined = obj.currency || obj.currency_code;
  const amountStr = asMoney(amount, currency);
  const id: string | undefined = obj.id;

  const text = `Stripe ${event.type}${amountStr ? ` · ${amountStr}` : ''}${
    customerEmail ? ` · ${customerEmail}` : ''
  }`;

  // Choose a color based on event type
  const color = (() => {
    const t = event.type;
    if (t.includes('failed') || t.includes('dispute') || t.includes('refunded'))
      return '#E01E5A'; // red
    if (
      t.includes('succeeded') ||
      t.includes('completed') ||
      t.includes('paid')
    )
      return '#2EB67D'; // green
    if (t.includes('requires') || t.includes('pending')) return '#ECB22E'; // yellow
    return '#4A154B'; // purple neutral
  })();

  const fields: any[] = [];
  fields.push({ type: 'mrkdwn', text: `*Event:* \`${event.type}\`` });
  fields.push({
    type: 'mrkdwn',
    text: `*Mode:* ${event.livemode ? 'Live' : 'Test'}`,
  });
  if (amountStr)
    fields.push({ type: 'mrkdwn', text: `*Amount:* ${amountStr}` });
  if (customerEmail)
    fields.push({ type: 'mrkdwn', text: `*Customer:* ${customerEmail}` });
  if (id)
    fields.push({
      type: 'mrkdwn',
      text: `*Object:* <${stripeDashboardUrl(event)}|${id}>`,
    });

  const attachments = [
    {
      color,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'Stripe Notification',
            emoji: true,
          },
        },
        { type: 'section', text: { type: 'mrkdwn', text } },
        { type: 'section', fields },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Event: <${`https://dashboard.stripe.com${
                event.livemode ? '' : '/test'
              }/events/${event.id}`}|${event.id}>`,
            },
          ],
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View in Dashboard' },
              url: stripeDashboardUrl(event),
              style: 'primary',
            },
          ],
        },
      ],
    },
  ];

  return { text, attachments };
}
