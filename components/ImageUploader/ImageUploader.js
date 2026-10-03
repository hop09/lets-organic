'use client';

import { useRef, useState } from 'react';
import { AlertCircle, Check, ImagePlus, Loader2, UploadCloud, X } from 'lucide-react';
import SafeImage from '@/components/SafeImage/SafeImage';
import styles from './ImageUploader.module.css';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

/**
 * ImageUploader — drag-and-drop / click-to-browse image upload for the admin
 * console, with a "paste image URL" fallback so external URLs keep working.
 *
 * Props:
 *   value     — current image URL string (controlled).
 *   onChange  — called with the new URL after a successful upload, when a
 *               pasted URL is committed, or with '' when the image is removed.
 *   label     — optional label shown above the dropzone.
 *   canUpload — when false (e.g. the admin lacks the media.upload permission)
 *               only the paste-URL fallback is shown.
 */
export default function ImageUploader({ value = '', onChange, label, canUpload = true }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [pastedUrl, setPastedUrl] = useState('');
  const inputRef = useRef(null);

  const uploadFile = async (file) => {
    setError('');
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only image files are allowed (JPG, PNG, WebP, GIF, AVIF).');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size is 5 MB.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed.');
      }
      onChange(data.url);
    } catch (err) {
      setError(err?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (uploading) return;
    const file = e.dataTransfer?.files?.[0];
    if (file) uploadFile(file);
  };

  const commitPastedUrl = () => {
    const url = pastedUrl.trim();
    if (!url) return;
    setError('');
    onChange(url);
    setPastedUrl('');
  };

  return (
    <div className={styles.uploader}>
      {label && <span className={styles.fieldLabel}>{label}</span>}

      {canUpload && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) uploadFile(file);
            }}
          />

          <div
            role="button"
            tabIndex={uploading ? -1 : 0}
            className={`${styles.dropzone} ${dragOver ? styles.dragOver : ''} ${
              uploading ? styles.uploading : ''
            }`}
            onClick={() => !uploading && inputRef.current?.click()}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !uploading) inputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (!uploading) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {uploading ? (
              <>
                <Loader2 size={28} className={styles.spinner} />
                <span className={styles.dropzoneText}>Uploading image…</span>
              </>
            ) : value ? (
              <div className={styles.previewRow}>
                <div className={styles.previewThumb}>
                  <SafeImage src={value} alt="Preview" fill sizes="64px" style={{ objectFit: 'cover' }} />
                </div>
                <span className={styles.previewName}>{value}</span>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange('');
                  }}
                  title="Remove image"
                >
                  <X size={14} /> Remove
                </button>
              </div>
            ) : (
              <>
                {dragOver ? (
                  <ImagePlus size={28} className={styles.dropzoneIcon} />
                ) : (
                  <UploadCloud size={28} className={styles.dropzoneIcon} />
                )}
                <span className={styles.dropzoneText}>
                  Drag &amp; drop an image here, or click to browse
                </span>
                <span className={styles.dropzoneHint}>JPG, PNG, WebP, GIF, AVIF · max 5 MB</span>
              </>
            )}
          </div>
        </>
      )}

      {error && (
        <div className={styles.errorMsg} role="alert">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className={styles.pasteRow}>
        <span className={styles.pasteLabel}>or paste an image URL</span>
        <div className={styles.pasteControls}>
          <input
            type="url"
            className={styles.pasteInput}
            value={pastedUrl}
            onChange={(e) => setPastedUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitPastedUrl();
              }
            }}
            placeholder="https://images.unsplash.com/…"
          />
          <button
            type="button"
            className={styles.pasteBtn}
            onClick={commitPastedUrl}
            disabled={!pastedUrl.trim()}
          >
            <Check size={14} style={{ verticalAlign: '-2px' }} /> Use URL
          </button>
        </div>
      </div>
    </div>
  );
}
