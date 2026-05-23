export interface EmailValidationResult {
  valid: boolean;
  message: string;
  severity: "ok" | "warn" | "error";
}

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "yopmail.com",
  "dropmail.me",
]);

export function validateEmail(email: string): EmailValidationResult {
  const trimmed = email.trim();
  
  if (!trimmed) {
    return { valid: false, message: "", severity: "error" };
  }

  if (!trimmed.includes("@")) {
    return { valid: false, message: "Must include an @ sign", severity: "error" };
  }

  const [localPart, domainPart] = trimmed.split("@");

  if (!localPart) {
    return { valid: false, message: "Missing username before @", severity: "error" };
  }

  if (!domainPart) {
    return { valid: false, message: "Domain is missing after @", severity: "error" };
  }

  if (!domainPart.includes(".")) {
    return { valid: false, message: "Email domain looks invalid", severity: "error" };
  }

  const tld = domainPart.split(".").pop();
  if (!tld || tld.length < 2) {
    return { valid: false, message: "Email domain looks invalid", severity: "error" };
  }

  if (DISPOSABLE_DOMAINS.has(domainPart.toLowerCase())) {
    return { valid: true, message: "Disposable emails are not accepted", severity: "warn" };
  }

  // Basic regex check for overall structure just to be sure
  const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicRegex.test(trimmed)) {
    return { valid: false, message: "Invalid email format", severity: "error" };
  }

  return { valid: true, message: "Looks good", severity: "ok" };
}
