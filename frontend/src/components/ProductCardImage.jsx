import { useRef, useState } from "react";

/** Grid card image: fixed size, zoom only on hover / long-press. */
const ProductCardImage = ({ src, alt, rounded = "rounded-xl sm:rounded-2xl" }) => {
  const [zoomed, setZoomed] = useState(false);
  const pressTimer = useRef(null);

  const startPress = () => {
    pressTimer.current = setTimeout(() => setZoomed(true), 280);
  };

  const endPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    setZoomed(false);
  };

  if (!src) {
    return (
      <div className={`aspect-[3/4] w-full bg-neutral-100 ${rounded}`} />
    );
  }

  return (
    <div
      className={`relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 ${rounded}`}
      onMouseEnter={() => setZoomed(true)}
      onMouseLeave={() => setZoomed(false)}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      onPointerCancel={endPress}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        className={`h-full w-full object-cover transition-transform duration-500 ease-out ${
          zoomed ? "scale-[1.06]" : "scale-100"
        }`}
      />
    </div>
  );
};

export default ProductCardImage;
