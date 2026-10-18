export function validationMessages(errors: unknown, path = ""): string[] {
  if (!errors || typeof errors !== "object") return [];
  const record = errors as Record<string, unknown>;
  const messages =
    typeof record.message === "string" ? [`${path}: ${record.message}`] : [];
  return messages.concat(
    Object.entries(record).flatMap(([key, value]) =>
      ["message", "type", "types", "ref"].includes(key)
        ? []
        : validationMessages(value, path ? `${path}.${key}` : key),
    ),
  );
}

export function validationFieldNames(errors: unknown): string[] {
  return validationMessages(errors)
    .map((message) => message.split(":")[0])
    .filter((path) =>
      /^(name|email|contactNumber|linkedin|github|personalWebsite|educations|skillGroups|experiences|projects)(\.[a-zA-Z0-9]+)*$/.test(
        path,
      ),
    );
}

const LABELS: Record<string, string> = {
  contactNumber: "Contact number",
  github: "GitHub",
  linkedin: "LinkedIn",
  personalWebsite: "Personal website",
};

/** "experiences.0.endDate" -> "Experience 1 › End date". */
export function validationFieldLabel(path: string): string {
  const parts: string[] = [];
  for (const segment of path.split(".")) {
    if (segment === "root") continue;
    if (/^\d+$/.test(segment) && parts.length) {
      parts[parts.length - 1] =
        `${parts[parts.length - 1].replace(/s$/, "")} ${Number(segment) + 1}`;
      continue;
    }
    const words =
      LABELS[segment] ?? segment.replace(/([A-Z])/g, " $1").toLowerCase();
    parts.push(words.charAt(0).toUpperCase() + words.slice(1));
  }
  return parts.join(" › ");
}
