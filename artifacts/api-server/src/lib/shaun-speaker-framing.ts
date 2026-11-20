type Rect = { x: number; y: number; width: number; height: number };
type Pan = { x: number; y: number };
/** Match the preview: manual positioning wins; automatic framing protects hair. */
export function speakerFramingPan(crop: Rect, head: Rect | undefined, sourceWidth: number, sourceHeight: number,
  panelWidth: number, panelHeight: number, zoom: number, pan?: Pan): Pan {
  if (pan && (pan.x !== 0 || pan.y !== 0)) return pan;
  const sw = crop.width * sourceWidth, sh = crop.height * sourceHeight;
  const k = Math.max(panelWidth / sw, panelHeight / sh) * zoom;
  const w = sw * k, h = sh * k;
  const mx = Math.abs(w - panelWidth) / 2, my = Math.abs(h - panelHeight) / 2;
  const clamp = (n: number, max: number) => Math.max(-max, Math.min(max, n));
  if (!head || head.x < crop.x || head.y < crop.y ||
      head.x + head.width > crop.x + crop.width || head.y + head.height > crop.y + crop.height)
    return { x: 0, y: Math.max(0, h - panelHeight) * 0.375 / panelHeight };
  const headCentre = ((head.x + head.width / 2 - crop.x) / crop.width) * w + (panelWidth - w) / 2;
  const headTop = ((head.y - crop.y) / crop.height) * h + (panelHeight - h) / 2;
  return { x: clamp(panelWidth / 2 - headCentre, mx) / panelWidth,
    y: clamp(panelHeight * 0.07 - headTop, my) / panelHeight };
}
