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
    // Pelkkä overflow:hidden body:ssä nollaa vierityksen monissa
    // mobiiliselaimissa (selain laskee vieritettävän alueen uusiksi kun
    // overflow muuttuu), jolloin taustasivu hyppää sivun ylälaitaan
    // riippumatta siitä mihin kohtaan oli vieritetty. Jäädytetään body sen
    // sijaan nykyiseen vierityskohtaan position:fixed-tempulla, ja
    // palautetaan vieritys suljettaessa.
    const vieritysY = window.scrollY;
    const body = document.body;
    const alkuperainen = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = "fixed";
    body.style.top = `-${vieritysY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";

    function kasitteleNappain(e: KeyboardEvent) {
      if (e.key === "Escape") onSulje();
    }
    window.addEventListener("keydown", kasitteleNappain);

    return () => {
      body.style.position = alkuperainen.position;
      body.style.top = alkuperainen.top;
      body.style.width = alkuperainen.width;
      body.style.overflow = alkuperainen.overflow;
      window.scrollTo(0, vieritysY);
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
