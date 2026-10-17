/** Muotoilee keston muotoon m:ss, tai h:mm:ss tunnista alkaen. */
export function muotoileKesto(ms: number): string {
  const sekunnit = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(sekunnit / 3600);
  const min = Math.floor((sekunnit % 3600) / 60);
  const s = String(sekunnit % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(min).padStart(2, "0")}:${s}` : `${min}:${s}`;
}
