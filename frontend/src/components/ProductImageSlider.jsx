import { useCallback, useEffect, useRef, useState } from "react";

/**
 * SHEIN-style image area: height follows image aspect ratio; subtle motion when idle.
 */
const ProductImageSlider = ({
  images = [],
  alt = "",
  className = "",
  rounded = "rounded-xl",
  autoPlay = true,
  intervalMs = 3800,
  showDots = true,
  enableMotion = true,
}) => {
  const list = images.filter(Boolean);
  const [index, setIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(null);
  const touchStart = useRef(null);

  const activeSrc = list[index] || list[0];

  const onImageLoad = useCallback(
    (e) => {
      const { naturalWidth, naturalHeight } = e.currentTarget;
      if (naturalWidth > 0 && naturalHeight > 0) {
        setAspectRatio(naturalWidth / naturalHeight);
      }
    },
    []
  );

  useEffect(() => {
    setAspectRatio(null);
  }, [activeSrc]);

  useEffect(() => {
    if (!autoPlay || list.length <= 1) return undefined;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % list.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [autoPlay, intervalMs, list.length]);

  const go = (dir) => {
    if (list.length <= 1) return;
    setIndex((i) => (i + dir + list.length) % list.length);
  };

  const onTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    if (touchStart.current == null || list.length <= 1) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) go(diff > 0 ? 1 : -1);
    touchStart.current = null;
  };

  if (list.length === 0) {
    return (
      <div
        className={`relative w-full bg-neutral-100 ${rounded} ${className}`}
        style={{ aspectRatio: "3/4" }}
      />
    );
  }

  const motionClass =
    enableMotion && list.length === 1
      ? "product-slider-kenburns"
      : enableMotion
        ? "product-slider-drift"
        : "";

  return (
    <div
      className={`relative w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900 ${rounded} ${className}`}
      style={aspectRatio ? { aspectRatio: `${aspectRatio}` } : { aspectRatio: "3/4" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      data-testid="product-image-slider"
    >
      {list.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={src}
          alt={i === index ? alt : ""}
          loading={i === 0 ? "eager" : "lazy"}
          decoding="async"
          onLoad={i === index ? onImageLoad : undefined}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
            i === index ? `opacity-100 ${motionClass}` : "opacity-0"
          }`}
          draggable={false}
        />
      ))}

      {list.length > 1 && showDots && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
          {list.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Image ${i + 1}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIndex(i);
              }}
              className={`h-1 rounded-full transition-all ${
                i === index ? "w-4 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageSlider;
