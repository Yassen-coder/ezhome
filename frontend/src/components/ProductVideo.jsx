import { getVideoEmbedUrl, isDirectVideoFile } from "../lib/productImages";

const ProductVideo = ({ url, title }) => {
  const embed = getVideoEmbedUrl(url);
  if (!embed) return null;

  if (isDirectVideoFile(embed)) {
    return (
      <div className="mt-4 rounded-2xl overflow-hidden bg-black" data-testid="product-video-native">
        <video
          src={embed}
          controls
          playsInline
          className="w-full max-h-[420px]"
          title={title}
        />
      </div>
    );
  }

  return (
    <div
      className="mt-4 relative w-full rounded-2xl overflow-hidden bg-black aspect-video"
      data-testid="product-video-embed"
    >
      <iframe
        src={embed}
        title={title ? `${title} video` : "Product video"}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default ProductVideo;
