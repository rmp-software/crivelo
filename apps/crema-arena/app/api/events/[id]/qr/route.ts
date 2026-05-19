import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

// GET /api/events/[id]/qr - Generate QR code for live display URL
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // QR points to the audience companion (/e/:id), per spec.
    const baseUrl = request.nextUrl.origin;
    const audienceUrl = `${baseUrl}/e/${params.id}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(audienceUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1F1410', // espresso-900
        light: '#FBF6EA', // crema-50
      },
    });

    // Convert data URL to buffer
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Return as PNG image
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error: any) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
