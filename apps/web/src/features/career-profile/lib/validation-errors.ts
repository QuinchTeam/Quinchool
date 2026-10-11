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
