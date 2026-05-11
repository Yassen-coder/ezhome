import { useEffect, useState } from "react";

/** Returns { days, hours, minutes, seconds } counting down to target (Date | number). */
export function useCountdown(target) {
  const targetMs = target instanceof Date ? target.getTime() : target;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, targetMs - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, done: diff === 0 };
}

/** Get the next midnight (end-of-day) timestamp */
export function getEndOfDay() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}
