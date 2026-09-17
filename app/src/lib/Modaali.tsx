import { useEffect } from "react";
import type { ReactNode } from "react";

interface ModaaliProps {
  onSulje: () => void;
  children: ReactNode;
}

/**
 * Täyden ruudun modaali-ikkuna omana kerroksenaan sisällön päällä.
 * Sulkeutuu taustaa napauttamalla tai Esc-näppäimellä, ja lukitsee taustan
 * vierityksen niin kauan kuin se on auki.
 */
export function Modaali({ onSulje, children }: ModaaliProps) {
  useEffect(() => {
    const alkuperainenYlivuoto = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function kasitteleNappain(e: KeyboardEvent) {
      if (e.key === "Escape") onSulje();
    }
    window.addEventListener("keydown", kasitteleNappain);

    return () => {
      document.body.style.overflow = alkuperainenYlivuoto;
      window.removeEventListener("keydown", kasitteleNappain);
    };
  }, [onSulje]);

  return (
    <div className="modaali-tausta" onClick={onSulje}>
      <div
        className="modaali-sisalto"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
