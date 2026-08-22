/**
 * Compresses and scales an image file/base64 to a lightweight web-friendly data URL.
 * Automatically reduces dimensions to fit within maxWidth/maxHeight and compresses quality.
 */
export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export const compressImageFile = (
  file: File,
  options: CompressOptions = {}
): Promise<string> => {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.75,
    mimeType = 'image/webp'
  } = options;

  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return reject(new Error('File is not an image'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image data'));
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect ratio scaling
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context unavailable'));
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export as compressed WebP or fallback to JPEG
        let dataUrl = canvas.toDataURL(mimeType, quality);
        if (!dataUrl.startsWith(`data:${mimeType}`)) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Validates whether a base64 string is a valid raster image within safe byte bounds.
 */
export const isValidRasterDataUrl = (dataUrl: unknown, maxBytes = 1024 * 1024): boolean => {
  if (typeof dataUrl !== 'string') return false;
  const allowedHeaders = [
    'data:image/webp;base64,',
    'data:image/jpeg;base64,',
    'data:image/jpg;base64,',
    'data:image/png;base64,',
    'data:image/gif;base64,'
  ];
  return allowedHeaders.some(h => dataUrl.startsWith(h)) && dataUrl.length <= maxBytes;
};
