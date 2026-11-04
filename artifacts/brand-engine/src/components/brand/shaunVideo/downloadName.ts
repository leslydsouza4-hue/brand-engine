/** Same title + local date convention as thumbnails, with filesystem-safe separators. */
export function videoDownloadName(name: string, date = new Date()) {
  const title = name.replace(/\.(mp4|mov|webm)$/i, "").replace(/[^a-zA-Z0-9\s_-]/g, "").trim().replace(/\s+/g, "_").slice(0, 150) || "Shaun_Video";
  return `${title}_${date.getMonth()+1}-${date.getDate()}-${String(date.getFullYear()).slice(-2)}.mp4`;
}
