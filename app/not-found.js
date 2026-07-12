import Link from 'next/link';

export const metadata = {
  title: 'Page Not Found | EcoSphere ESG',
};

export default function NotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: '#0B0B0D',
          color: '#EDEDEF',
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <div>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #22C55E, #16a34a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '2rem',
            }}
          >
            🌿
          </div>
          <h1
            style={{
              fontSize: '6rem',
              fontWeight: 800,
              color: '#22C55E',
              margin: 0,
              lineHeight: 1,
            }}
          >
            404
          </h1>
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#EDEDEF',
              margin: '0.75rem 0',
            }}
          >
            Page Not Found
          </h2>
          <p
            style={{
              fontSize: '0.95rem',
              color: '#8E8E93',
              marginBottom: '2rem',
              maxWidth: '400px',
            }}
          >
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '0.6rem 1.5rem',
              background: '#22C55E',
              color: '#0B0B0D',
              borderRadius: '8px',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}
          >
            Back to Dashboard
          </Link>
        </div>
      </body>
    </html>
  );
}
