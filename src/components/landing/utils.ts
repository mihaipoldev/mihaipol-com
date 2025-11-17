export function formatEventDate(dateString?: string) {
  if (!dateString) return "TBA";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "TBA";
  const day = date.getDate();
  const month = date.toLocaleDateString("en", { month: "short" }).toUpperCase();
  return `${day} ${month}`;
}

export function formatUpdateDate(dateString?: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
