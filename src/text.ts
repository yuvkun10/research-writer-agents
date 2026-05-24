const SMALL_WORDS = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "in", "of", "on", "or", "the", "to"]);

export function titleCase(value: string): string {
  const words = value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ");

  return words
    .map((word, index) =>
      word
        .split("-")
        .map((part) => capitalizeTitlePart(part, index))
        .join("-")
    )
    .join(" ");
}

export function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "report";
}

export function sentence(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, " ");

  if (trimmed.length === 0) {
    return "";
  }

  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export function firstSentence(value: string): string {
  const normalized = sentence(value);
  const match = normalized.match(/^.*?[.!?](?:\s|$)/);

  return match?.[0].trim() ?? normalized;
}

function capitalizeTitlePart(value: string, index: number): string {
  if (/^[A-Z0-9]{2,}$/.test(value)) {
    return value;
  }

  const lower = value.toLowerCase();

  if (index > 0 && SMALL_WORDS.has(lower)) {
    return lower;
  }

  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
