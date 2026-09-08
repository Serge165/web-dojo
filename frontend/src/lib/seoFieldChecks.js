// Google's SERP width is what actually truncates a title, not a fixed char
// count — but char count is a solid proxy: 50-60 is the sweet spot, and the
// thresholds below flag "probably fine" vs "will likely get cut/rewritten".
export const truncateForSerp = (title) => (title.length > 60 ? `${title.slice(0, 57).trimEnd()}…` : title);

export const titleCountColor = (len) => {
  if (len === 0) return "text-gray-600";
  if (len >= 50 && len <= 60) return "text-emerald-500";
  if ((len >= 40 && len < 50) || (len > 60 && len <= 70)) return "text-amber-500";
  return "text-red-500";
};

// Same idea for the meta description: Google's snippet clips around 155-160
// chars on desktop, and the 150-160 window is the standard "won't get cut"
// target.
export const truncateDescriptionForSerp = (desc) => (desc.length > 160 ? `${desc.slice(0, 157).trimEnd()}…` : desc);

export const descriptionCountColor = (len) => {
  if (len === 0) return "text-gray-600";
  if (len >= 150 && len <= 160) return "text-emerald-500";
  if ((len >= 120 && len < 150) || (len > 160 && len <= 175)) return "text-amber-500";
  return "text-red-500";
};
