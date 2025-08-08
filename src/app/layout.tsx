export const metadata = {
  title: 'Stripe → Slack Router',
  description: 'Forward Stripe webhooks to Slack with filtering and routing',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
