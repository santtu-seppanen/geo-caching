interface EdistymispalkkiProps {
  loydetty: number;
  yhteensa: number;
  teksti: string;
}

export function Edistymispalkki({ loydetty, yhteensa, teksti }: EdistymispalkkiProps) {
  if (yhteensa === 0) return null;

  const prosentti = Math.round((loydetty / yhteensa) * 100);

  return (
    <div
      className="edistymispalkki"
      role="progressbar"
      aria-valuenow={loydetty}
      aria-valuemin={0}
      aria-valuemax={yhteensa}
    >
      <div className="edistymispalkki-tausta">
        <div className="edistymispalkki-tayte" style={{ width: `${prosentti}%` }} />
      </div>
      <p className="edistymispalkki-teksti">
        {loydetty} / {yhteensa} {teksti}
      </p>
    </div>
  );
}
