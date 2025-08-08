import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import {
  eventTypeIsAllowed,
  isConfigValid,
  loadRouterConfig,
} from '@/lib/config';
import { SlackNotifier } from '@/lib/slack';
import { formatSlackMessage } from '@/lib/formatters';
import { verifyStripeWebhook } from '@/lib/stripe';

import pino from 'pino';

const logger = pino({
  level: 'info',
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Health check / simple config echo
export async function GET() {
  return NextResponse.json({}, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const cfg = loadRouterConfig();
    if (!isConfigValid(cfg)) {
      logger.error('Service not configured. Check environment variables.');
      return NextResponse.json({}, { status: 500 });
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      logger.error('Missing Stripe signature');
      return NextResponse.json({}, { status: 400 });
    }

    const rawBody = await req.text();

    let event: Stripe.Event;
    try {
      event = verifyStripeWebhook(rawBody, signature, cfg.stripeWebhookSecret);
    } catch (err: any) {
      logger.error(`Failed to verify Stripe webhook: ${err.message}`);
      return NextResponse.json({}, { status: 400 });
    }

    // Filter by allow/deny
    if (
      !eventTypeIsAllowed(
        event.type,
        cfg.allowlistPatterns,
        cfg.denylistPatterns,
      )
    ) {
      logger.info(`Event type ${event.type} is not allowed. Skipping...`);
      return NextResponse.json({}, { status: 200 });
    }

    const notifier = new SlackNotifier({ webhookUrl: cfg.slackWebhookUrl });

    try {
      const message = formatSlackMessage(event);
      await notifier.postMessage(message);
    } catch (err: any) {
      logger.error(`Failed to post to Slack: ${err.message}`);
      return NextResponse.json({}, { status: 500 });
    }
    logger.info('Successfully posted to Slack');

    return NextResponse.json({}, { status: 200 });
  } catch (err: any) {
    logger.error(`Unexpected error: ${err.message}`);
    return NextResponse.json({}, { status: 500 });
  }
}
