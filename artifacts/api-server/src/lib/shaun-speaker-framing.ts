type Rect = { x: number; y: number; width: number; height: number };
type Pan = { x: number; y: number };
/** Let a drag move freely: enlarge only as needed to keep the camera's outer edge hidden. */
export function speakerFramingZoom(crop: Rect, sourceWidth: number, sourceHeight: number,
  panelWidth: number, panelHeight: number, zoom: number, pan?: Pan, shape?: "circle" | "rectangle"): number {
  const sw = crop.width * sourceWidth, sh = crop.height * sourceHeight;
  const circular = shape === "circle" || (!shape && sw / sh >= 0.85 && sw / sh <= 1.15);
  if (!circular || !pan || (!pan.x && !pan.y)) return zoom;
  const cover = Math.max(panelWidth / sw, panelHeight / sh);
  const required = Math.hypot(
    (panelWidth + 2 * Math.abs(pan.x * panelWidth)) / (sw * cover),
    (panelHeight + 2 * Math.abs(pan.y * panelHeight)) / (sh * cover),
  ) / 0.975;
  return Math.max(zoom, required);
}
/** Match the preview: protect hair and constrain circular cameras to their inner area. */
export function speakerFramingPan(crop: Rect, head: Rect | undefined, sourceWidth: number, sourceHeight: number,
  panelWidth: number, panelHeight: number, zoom: number, pan?: Pan, shape?: "circle" | "rectangle"): Pan {
  const sw = crop.width * sourceWidth, sh = crop.height * sourceHeight;
  const k = Math.max(panelWidth / sw, panelHeight / sh) * zoom;
  const w = sw * k, h = sh * k;
  const mx = Math.abs(w - panelWidth) / 2, my = Math.abs(h - panelHeight) / 2;
  const clamp = (n: number, max: number) => Math.max(-max, Math.min(max, n));
  const safePan = (desired: Pan): Pan => {
    const circular = shape === "circle" || (!shape && sw / sh >= 0.85 && sw / sh <= 1.15);
    if (!circular) return desired;
    // Rectangular crop bounds are not sufficient for a circular camera:
    // every output corner must stay INSIDE the source ellipse, even after a drag.
    const inside = (t: number) =>
      ((panelWidth / 2 + Math.abs(desired.x * panelWidth) * t) / (w / 2)) ** 2 +
      ((panelHeight / 2 + Math.abs(desired.y * panelHeight) * t) / (h / 2)) ** 2 <= 0.98 ** 2;
    if (inside(1)) return desired;
    let lo = 0, hi = 1;
    for (let i = 0; i < 32; i++) {
      const mid = (lo + hi) / 2;
      if (inside(mid)) lo = mid; else hi = mid;
    }
    return { x: desired.x * lo, y: desired.y * lo };
  };
  if (pan && (pan.x !== 0 || pan.y !== 0)) return safePan(pan);
  if (!head || head.x < crop.x || head.y < crop.y ||
      head.x + head.width > crop.x + crop.width || head.y + head.height > crop.y + crop.height)
    return safePan({ x: 0, y: Math.max(0, h - panelHeight) * 0.375 / panelHeight });
  const headCentre = ((head.x + head.width / 2 - crop.x) / crop.width) * w + (panelWidth - w) / 2;
  const headTop = ((head.y - crop.y) / crop.height) * h + (panelHeight - h) / 2;
  return safePan({ x: clamp(panelWidth / 2 - headCentre, mx) / panelWidth,
    y: clamp(panelHeight * 0.07 - headTop, my) / panelHeight });
}
