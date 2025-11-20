import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Serve logo.png from public folder as favicon
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    
    if (fs.existsSync(logoPath)) {
      const imageBuffer = fs.readFileSync(logoPath);
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
    
    // Fallback: return 404
    return new NextResponse(null, { status: 404 });
  } catch (error) {
    console.error('Error serving icon:', error);
    return new NextResponse(null, { status: 500 });
  }
}

