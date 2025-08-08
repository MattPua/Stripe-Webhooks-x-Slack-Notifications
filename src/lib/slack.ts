export type SlackMessage = {
  text: string;
  blocks?: any[];
  attachments?: any[];
};

export class SlackNotifier {
  private readonly webhookUrl?: string;

  constructor(params: { webhookUrl?: string }) {
    this.webhookUrl = params.webhookUrl;
  }

  async postMessage(message: SlackMessage): Promise<void> {
    if (this.webhookUrl) {
      // Incoming webhook cannot reliably override channel dynamically
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
      return;
    }

    throw new Error('No Slack credentials configured');
  }
}
