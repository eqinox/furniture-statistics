import { format, parse } from "date-fns";
import { bg } from "date-fns/locale";

const DATE_PATTERNS = ["yyyy-MM-dd", "yyyy-MM-dd HH:mm:ss"] as const;

function parseDateValue(value: string): Date | null {
  for (const pattern of DATE_PATTERNS) {
    const parsed = parse(value, pattern, new Date());
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
}

type FormatOptions = {
  placeholder?: string;
};

export function formatBgDate(value: string | null, options: FormatOptions = {}) {
  const placeholder = options.placeholder ?? "-";
  if (!value) return placeholder;

  const date = parseDateValue(value);
  if (!date) return placeholder;

  const formatted = format(date, "dd MMMM yyyy", { locale: bg });
  const parts = formatted.split(" ");
  if (parts.length >= 3) {
    parts[1] = `${parts[1].charAt(0).toUpperCase()}${parts[1].slice(1)}`;
    return parts.join(" ");
  }
  return formatted;
}

export function formatBgDateTime(
  value: string | null,
  options: FormatOptions = {},
) {
  const placeholder = options.placeholder ?? "-";
  if (!value) return placeholder;

  const date = parseDateValue(value);
  if (!date) return placeholder;

  const formatted = format(date, "dd MMMM yyyy, HH:mm", { locale: bg });
  const parts = formatted.split(" ");
  if (parts.length >= 3) {
    parts[1] = `${parts[1].charAt(0).toUpperCase()}${parts[1].slice(1)}`;
    return parts.join(" ");
  }
  return formatted;
}
