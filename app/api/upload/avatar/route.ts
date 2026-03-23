import { NextResponse } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebaseAdmin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 });
    }

    // Validation: Type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. PNG, JPG, or WebP only.' }, { status: 400 });
    }

    // Validation: Size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 2MB.' }, { status: 400 });
    }

    if (!adminDb || !adminStorage) {
      return NextResponse.json({ error: 'Database/Storage not initialized' }, { status: 500 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(`avatars/${fileName}`);

    await fileRef.save(buffer, {
      metadata: { contentType: file.type },
      public: true,
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/avatars/${fileName}`;

    // Update user profile
    await adminDb.collection('users').doc(userId).update({
      avatar_url: publicUrl,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Optional: Delete the actual file from storage if you want to be tidy
    // For now, just clearing the URL in the database is the primary "reset"
    await adminDb.collection('users').doc(userId).update({
      avatar_url: null,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Avatar reset error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
