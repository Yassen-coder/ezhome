/** Collect all product images for sliders. */
export const getProductImages = (product) => {
  if (!product) return [];
  if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
    return product.image_urls.filter(Boolean);
  }
  const images = [];
  if (product.image_url) images.push(product.image_url);
  if (
    product.secondary_image_url &&
    product.secondary_image_url !== product.image_url
  ) {
    images.push(product.secondary_image_url);
  }
  return images;
};

/** Short landing URL for ads and sharing */
export const productLandingPath = (productId) => `/p/${productId}`;

/** YouTube / Vimeo / direct MP4 embed URL */
export const getVideoEmbedUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const ytWatch = trimmed.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}`;

  const ytShort = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}`;

  const vimeo = trimmed.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

  if (/\.(mp4|webm|ogg)(\?|$)/i.test(trimmed)) return trimmed;

  return trimmed;
};

export const isDirectVideoFile = (url) =>
  url && /\.(mp4|webm|ogg)(\?|$)/i.test(url);
