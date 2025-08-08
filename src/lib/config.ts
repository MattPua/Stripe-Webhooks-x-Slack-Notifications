export type RouterConfig = {
  stripeWebhookSecret: string;
  slackWebhookUrl?: string;
  allowlistPatterns: string[]; // glob patterns, e.g. invoice.*
  denylistPatterns: string[]; // glob patterns
};

function parseJson<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseCsv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function globToRegExp(glob: string): RegExp {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

export function loadRouterConfig(): RouterConfig {
  return {
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
    allowlistPatterns: parseCsv(process.env.STRIPE_EVENT_ALLOWLIST),
    denylistPatterns: parseCsv(process.env.STRIPE_EVENT_DENYLIST),
  };
}

export function isConfigValid(config: RouterConfig): boolean {
  if (!config.stripeWebhookSecret) return false;
  if (!config.slackWebhookUrl) return false;
  return true;
}

export function eventTypeIsAllowed(
  eventType: string,
  allowlistPatterns: string[],
  denylistPatterns: string[],
): boolean {
  const allowlist = allowlistPatterns.map(globToRegExp);
  const denylist = denylistPatterns.map(globToRegExp);

  if (allowlist.length > 0) {
    const allowed = allowlist.some((re) => re.test(eventType));
    if (!allowed) return false;
  }
  if (denylist.length > 0) {
    const denied = denylist.some((re) => re.test(eventType));
    if (denied) return false;
  }
  return true;
}

// Bot routing and per-event channel mapping removed; incoming webhook posts to a single channel.
