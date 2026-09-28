import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || 'sarkari-revalidate-secret-token-2026';

export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const secret = body.secret || request.nextUrl.searchParams.get('secret');
    const path = body.path || request.nextUrl.searchParams.get('path');
    const tag = body.tag || request.nextUrl.searchParams.get('tag');

    if (secret !== REVALIDATE_SECRET) {
      return NextResponse.json({ message: 'Invalid revalidation secret' }, { status: 401 });
    }

    if (path) {
      revalidatePath(path);
    }

    if (tag) {
      revalidateTag(tag);
    }

    // Default revalidate home & sitemap if not specified
    if (!path && !tag) {
      revalidatePath('/');
      revalidateTag('exams');
      revalidateTag('updates');
      revalidateTag('blog');
    }

    return NextResponse.json({
      revalidated: true,
      timestamp: new Date().toISOString(),
      path: path || 'all',
      tag: tag || 'all',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
