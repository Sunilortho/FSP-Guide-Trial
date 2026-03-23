'use client';

import { useState } from 'react';
import { Camera, Loader2, Check, AlertCircle, RotateCcw } from 'lucide-react';

interface AvatarUploadProps {
  userId: string;
  displayName?: string;
  currentAvatarUrl?: string;
  onUploadSuccess: (url: string) => void;
  onReset?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getInitialsColor(name: string): string {
  const colors = [
    '#00B4D8', '#6366F1', '#F5A623', '#10B981',
    '#EF4444', '#8B5CF6', '#EC4899', '#0077B6',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function AvatarUpload({
  userId,
  displayName = 'User',
  currentAvatarUrl,
  onUploadSuccess,
  onReset,
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [wantReset, setWantReset] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only PNG, JPG, or WebP allowed.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Max size is 2 MB.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Upload failed');

      setSuccess(true);
      setWantReset(false);
      onUploadSuccess(data.url);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    if (!wantReset) {
      setWantReset(true);
      return;
    }
    setUploading(true);
    try {
      const res = await fetch('/api/upload/avatar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error('Reset failed');
      onReset?.();
      onUploadSuccess('');
      setWantReset(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setUploading(false);
    }
  };

  const initials = getInitials(displayName);
  const bgColor = getInitialsColor(displayName);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg flex items-center justify-center relative">
          {currentAvatarUrl ? (
            <img
              src={currentAvatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: bgColor }}
            >
              {initials}
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>

        <label
          htmlFor="avatar-input"
          className="absolute bottom-0 right-0 p-2 bg-[#00B4D8] rounded-full text-white cursor-pointer shadow-md hover:bg-[#0077B6] transition-colors group-hover:scale-110"
        >
          <Camera className="w-4 h-4" />
          <input
            id="avatar-input"
            type="file"
            className="hidden"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Reset checkbox */}
      {currentAvatarUrl && (
        <label className="flex items-center gap-2 text-xs text-[#6B7280] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={wantReset}
            onChange={() => setWantReset(!wantReset)}
            className="rounded border-gray-300"
          />
          Remove avatar
          {wantReset && (
            <button
              onClick={handleReset}
              disabled={uploading}
              className="ml-2 flex items-center gap-1 text-red-500 hover:text-red-700 font-medium"
            >
              <RotateCcw className="w-3 h-3" /> Confirm
            </button>
          )}
        </label>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs font-medium text-red-500 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-xs font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
          <Check className="w-3.5 h-3.5" />
          Updated!
        </div>
      )}
    </div>
  );
}
