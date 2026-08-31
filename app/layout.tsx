import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Doña Ana County Records Automation',
  description: 'Production-ready browser automation and indexing suite for the Doña Ana County Public Records portal (donaana.nm.publicsearch.us). Automates search setup, result looping, modal cart ingestion, checkout, and document package retrieval with real-time telemetry.',
  openGraph: {
    title: 'Doña Ana County Records Automation',
    description: 'Production-ready browser automation and indexing suite for the Doña Ana County Public Records portal (donaana.nm.publicsearch.us). Automates search setup, result looping, modal cart ingestion, checkout, and document package retrieval with real-time telemetry.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Doña Ana County Records Automation',
    description: 'Production-ready browser automation and indexing suite for the Doña Ana County Public Records portal (donaana.nm.publicsearch.us). Automates search setup, result looping, modal cart ingestion, checkout, and document package retrieval with real-time telemetry.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
