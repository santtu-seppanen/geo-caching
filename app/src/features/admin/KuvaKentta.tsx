import { useRef, useState } from "react";
import type { ChangeEvent } from "react";

interface KuvaKenttaProps {
  /** Näytettävä esikatselukuva ennen kuin käyttäjä on valinnut uutta (esim. muokattavan kätkön nykyinen kuva). */
  alkuperainenEsikatseluUrl?: string | null;
  onValitse: (tiedosto: File | null) => void;
  vihjeTeksti: string;
}

/** Kuvan valintakenttä: oma nappi kameralla ottamiseen (oletus) ja toinen tiedoston/galleriasta valintaan. */
export function KuvaKentta({
  alkuperainenEsikatseluUrl = null,
  onValitse,
  vihjeTeksti,
}: KuvaKenttaProps) {
  const [esikatselu, setEsikatselu] = useState<string | null>(alkuperainenEsikatseluUrl);
  const kameraInputRef = useRef<HTMLInputElement>(null);
  const tiedostoInputRef = useRef<HTMLInputElement>(null);

  async function kasitteleValinta(e: ChangeEvent<HTMLInputElement>) {
    const tiedosto = e.target.files?.[0] ?? null;
    e.target.value = "";
    onValitse(tiedosto);

    if (!tiedosto) {
      setEsikatselu(alkuperainenEsikatseluUrl);
      return;
    }
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Kuvan luku epäonnistui"));
        reader.readAsDataURL(tiedosto);
      });
      setEsikatselu(dataUrl);
    } catch {
      setEsikatselu(alkuperainenEsikatseluUrl);
    }
  }

  return (
    <div className="kentta">
      <span className="kentan-nimi">kuva</span>

      <div className="kuva-valinta-napit">
        <button
          type="button"
          className="nappi nappi-toissijainen"
          onClick={() => kameraInputRef.current?.click()}
        >
          📷 Ota kuva
        </button>
        <button
          type="button"
          className="nappi nappi-toissijainen"
          onClick={() => tiedostoInputRef.current?.click()}
        >
          🖼️ Valitse tiedostosta
        </button>
      </div>

      <input
        ref={kameraInputRef}
        className="tiedostosyote-piilotettu"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={kasitteleValinta}
      />
      <input
        ref={tiedostoInputRef}
        className="tiedostosyote-piilotettu"
        type="file"
        accept="image/*"
        onChange={kasitteleValinta}
      />

      <span className="kentan-vihje">{vihjeTeksti}</span>

      {esikatselu && (
        <img className="admin-kuva-esikatselu" src={esikatselu} alt="Esikatselu kätkön kuvasta" />
      )}
    </div>
  );
}
