import { useEffect, useState } from "react";
import { useCurrency } from "../lib/currencyContext";

/** Cycles promo text on product cards — no image movement. */
const AnimatedPromoBadge = ({ discount, originalPrice, discountedPrice }) => {
  const { formatPrice } = useCurrency();
  const [step, setStep] = useState(0);

  const save =
    originalPrice > discountedPrice ? originalPrice - discountedPrice : 0;

  const steps =
    discount > 0
      ? [
          { key: "pct", text: `-${discount}%`, className: "bg-[#FA6338] text-white" },
          ...(save > 0
            ? [
                {
                  key: "save",
                  text: `SAVE ${formatPrice(save)}`,
                  className: "bg-emerald-600 text-white",
                },
              ]
            : []),
          { key: "deal", text: "LIMITED", className: "bg-neutral-900 text-white" },
        ]
      : [];

  useEffect(() => {
    if (steps.length <= 1) return undefined;
    const id = setInterval(() => setStep((s) => (s + 1) % steps.length), 2600);
    return () => clearInterval(id);
  }, [steps.length]);

  if (steps.length === 0) return null;

  const current = steps[step % steps.length];

  return (
    <span
      className={`absolute top-2 left-2 z-10 rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-none transition-opacity duration-300 ${current.className}`}
      data-testid="animated-promo-badge"
    >
      {current.text}
    </span>
  );
};

export default AnimatedPromoBadge;
