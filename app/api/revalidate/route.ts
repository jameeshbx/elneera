import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      );
    }

    // Revalidate the specific path
    revalidatePath(path);

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    console.error('Error revalidating:', error);
    return NextResponse.json(
      { error: 'Error revalidating' },
      { status: 500 }
    );
  }
}
