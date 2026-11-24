export function getContactHref(
  method: string | null | undefined,
  value: string,
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const email = trimmed.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = trimmed.replace(/[^\d+]/g, "");

  switch (method) {
    case "email":
      return email ? `mailto:${email}` : null;
    case "whatsapp":
      return phone ? `https://wa.me/${phone.replace(/^\+/, "")}` : null;
    case "phone":
      return phone ? `tel:${phone}` : null;
    default:
      if (email) return `mailto:${email}`;
      return phone ? `tel:${phone}` : null;
  }
}
