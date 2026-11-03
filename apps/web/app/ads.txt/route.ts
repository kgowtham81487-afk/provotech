import { NextResponse } from 'next/server';

export async function GET() {
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.replace('ca-', '') || 'pub-PENDING_OWNER_CONFIG';
  const content = `# EES Platform — Google AdSense Authorized Digital Sellers (ads.txt)
# Organization: Provolution Technologies Pvt. Ltd.
google.com, ${pubId}, DIRECT, f08c47fec0942fa0
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
