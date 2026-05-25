/** Collect display images for sliders (primary + optional second). */
export const getProductImages = (product) => {
  if (!product) return [];
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
