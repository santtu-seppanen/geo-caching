import { useEffect, useRef } from "react";
import type { MouseEvent, ReactNode } from "react";

interface ModaaliProps {
  onSulje: () => void;
  children: ReactNode;
}

/**
 * Täyden ruudun modaali-ikkuna natiivilla <dialog>-elementillä.
 *
 * Aiempi versio pyöri itse rakennetulla position:fixed-kerroksella ja
 * body { overflow: hidden } -vierityslukolla — se aiheutti toistuvia,
 * selainkohtaisia bugeja (mm. taustan vierityksen nollautuminen, sisällön
 * piiloutuminen näppäimistön/navigointipalkin taakse) sekä Androidilla että
 * Firefoxissa. <dialog>.showModal() renderöityy selaimen "top layerissa",
 * jonka selainvalmistajat ovat nimenomaan suunnitelleet väistämään
 * näytön näppäimistön/työkalurivin — sinne ei tarvitse itse rakentaa
 * vierityslukkoa tai kohdistuslogiikkaa.
 */
export function Modaali({ onSulje, children }: ModaaliProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.showModal();

    function kasitteleSulkeutuminen() {
      onSulje();
    }
    dialog.addEventListener("close", kasitteleSulkeutuminen);

    return () => {
      dialog.removeEventListener("close", kasitteleSulkeutuminen);
      dialog.close();
    };
  }, [onSulje]);

  function kasitteleTaustaKlikkaus(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) onSulje();
  }

  return (
    <dialog ref={dialogRef} className="modaali-tausta" onClick={kasitteleTaustaKlikkaus}>
      <div className="modaali-sisalto" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </dialog>
  );
}
