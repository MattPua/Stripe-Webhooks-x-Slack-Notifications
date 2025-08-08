import Stripe from 'stripe';

export function verifyStripeWebhook(
  rawBody: string,
  signature: string,
  endpointSecret: string
): Stripe.Event {
  // Using the static helper does not require an API key
  return Stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
}
