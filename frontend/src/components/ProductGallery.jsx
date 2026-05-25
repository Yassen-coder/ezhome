import { useState } from "react";
import { Play } from "lucide-react";
import { getVideoEmbedUrl } from "../lib/productImages";

/**
 * Landing page gallery: fixed frame, manual switch, thumbs + video in strip.
 */
const ProductGallery = ({ images = [], videoUrl = null, alt = "" }) => {
  const embed = videoUrl ? getVideoEmbedUrl(videoUrl) : null;
  const slides = [
    ...images.map((src, i) => ({ type: "image", src, key: `img-${i}` })),
    ...(embed ? [{ type: "video", src: embed, key: "video" }] : []),
  ];

  const [index, setIndex] = useState(0);
  const active = slides[index] || slides[0];

  if (slides.length === 0) {
    return <div className="aspect-[3/4] w-full rounded-2xl bg-muted" />;
  }

  return (
    <div data-testid="product-gallery">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900">
        {active?.type === "video" ? (
          <iframe
            src={active.src}
            title={`${alt} video`}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <img
            src={active?.src}
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>

      {slides.length > 1 && (
        <div
          className="mt-3 flex gap-2 overflow-x-auto pb-1 snap-x"
          data-testid="product-gallery-thumbs"
        >
          {slides.map((slide, i) => (
            <button
              key={slide.key}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative shrink-0 snap-start w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                i === index ? "border-[#FA6338]" : "border-transparent opacity-80 hover:opacity-100"
              }`}
              aria-label={slide.type === "video" ? "Show video" : `Image ${i + 1}`}
            >
              {slide.type === "video" ? (
                <span className="absolute inset-0 flex items-center justify-center bg-neutral-900 text-white">
                  <Play className="w-6 h-6 fill-white" />
                </span>
              ) : (
                <img src={slide.src} alt="" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
