export interface LoytoPyynto {
  paikkaId: string;
  nimi: string;
}

export type ValidointiTulos =
  | { ok: true; pyynto: LoytoPyynto }
  | { ok: false; virhe: string };

const NIMI_MAX_PITUUS = 50;

export function validoiLoytoPyynto(
  data: unknown,
  tunnetutPaikkaIdt: ReadonlySet<string>,
): ValidointiTulos {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { ok: false, virhe: "Pyyntö täytyy olla JSON-objekti" };
  }

  const { paikkaId, nimi } = data as Record<string, unknown>;

  if (typeof paikkaId !== "string" || !tunnetutPaikkaIdt.has(paikkaId)) {
    return { ok: false, virhe: "Tuntematon paikkaId" };
  }

  if (typeof nimi !== "string" || nimi.trim().length === 0) {
    return { ok: false, virhe: "nimi on pakollinen" };
  }

  if (nimi.length > NIMI_MAX_PITUUS) {
    return {
      ok: false,
      virhe: `nimi saa olla enintään ${NIMI_MAX_PITUUS} merkkiä`,
    };
  }

  return { ok: true, pyynto: { paikkaId, nimi: nimi.trim() } };
}
