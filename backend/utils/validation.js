const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
const NAME_RE = /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/;
const PHONE_RE = /^\+?[\d\s\-()]{7,20}$/;
const MATRICULE_RE = /^[a-zA-Z0-9\-]{3,20}$/;
const NUMERIC_RE = /^[0-9]+(\.[0-9]{1,2})?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ALPHANUM_RE = /^[a-zA-Z0-9À-ÿ\s\-_.,;:'!?()]+$/;

function isValidEmail(v) { return EMAIL_RE.test(String(v)); }
function isValidPassword(v) { return PASSWORD_RE.test(String(v)); }
function isValidName(v) { return NAME_RE.test(String(v)); }
function isValidPhone(v) { return PHONE_RE.test(String(v)); }
function isValidMatricule(v) { return MATRICULE_RE.test(String(v)); }
function isValidNumeric(v, min, max) {
  const n = parseFloat(v);
  if (isNaN(n)) return false;
  if (min != null && n < min) return false;
  if (max != null && n > max) return false;
  return true;
}
function isValidDate(v) { return DATE_RE.test(String(v)) && !isNaN(Date.parse(v)); }
function isNotEmpty(v) { return v != null && String(v).trim().length > 0; }
function isValidLength(v, min, max) {
  const s = String(v || '');
  if (min != null && s.length < min) return false;
  if (max != null && s.length > max) return false;
  return true;
}
function sanitizeInput(v) {
  if (v == null) return '';
  return String(v).trim();
}

module.exports = {
  isValidEmail, isValidPassword, isValidName, isValidPhone,
  isValidMatricule, isValidNumeric, isValidDate, isNotEmpty,
  isValidLength, sanitizeInput, ALPHANUM_RE
};
