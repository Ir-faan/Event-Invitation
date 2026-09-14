const fallbackOrigin = "https://www.paperless-invites.com";

export function customerWhatsAppUrl(phone: string, name: string, invitationUrl?: string): string {
  const number = phone.trim();
  if (!/^5\d{7}$/.test(number)) return "";
  const customer = name.trim() || "there";
  const message = invitationUrl
    ? `Hello ${customer}. This is Paperless Invites. Thank you for choosing us! Your invitation is ready to share with your guests.\n\nLink: ${invitationUrl}\n\nWe'd love to hear what you think. Please follow us on social media, and leave a review or send us your feedback when you have a moment.`
    : `Hello ${customer}, this is paperless invite.`;
  return `https://wa.me/230${number}?text=${encodeURIComponent(message)}`;
}

export function invitationPublicUrl(origin: string, slug: string): string {
  return `${origin || fallbackOrigin}/${slug}`;
}
