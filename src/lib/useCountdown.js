import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

/**
 * Compte à rebours calé sur l'heure de fin réelle (même correctif que sur le site) :
 * il reste exact même si l'élève tape beaucoup, verrouille son téléphone ou change d'application.
 */
export function useCountdown(totalSec, running = true) {
  const deadline = useRef(Date.now() + totalSec * 1000);
  const compute = () => Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
  const [left, setLeft] = useState(compute);

  useEffect(() => {
    if (!running) return undefined;
    const tick = () => setLeft(compute());
    tick();
    const id = setInterval(tick, 250);
    const sub = AppState.addEventListener("change", (s) => s === "active" && tick());
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [running]);

  return left;
}

/** Chrono qui monte (quiz des professeurs). */
export function useStopwatch(running = true) {
  const start = useRef(Date.now());
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setSec(Math.floor((Date.now() - start.current) / 1000)), 500);
    return () => clearInterval(id);
  }, [running]);
  return sec;
}
