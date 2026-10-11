const personalFields = ["name", "email", "contactNumber"] as const;

export function syncPersonalDetails(
  data: FormData,
  setValue: (name: (typeof personalFields)[number], value: string) => void,
) {
  for (const name of personalFields) {
    const value = data.get(name);
    if (typeof value === "string") setValue(name, value);
  }
}
