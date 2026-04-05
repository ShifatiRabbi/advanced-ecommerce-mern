const INVALID_PHONE_PATTERNS = [
  /^(.)\1{9,}$/,
  /^0{10,}$/,
  /^1234567890$/,
  /^0{1}1{9}$/,
];

const BD_PHONE_REGEX = /^(?:\+?88)?01[3-9]\d{8}$/;

const HIGH_RISK_CITIES = ['test', 'fake', 'abc', 'xxx'];

export const detectFakeOrder = ({ phone, address, city, items, total }) => {
  const reasons = [];

  const cleanPhone = phone?.replace(/\s|-/g, '');

  if (!BD_PHONE_REGEX.test(cleanPhone)) {
    reasons.push('Invalid Bangladeshi phone number format');
  }

  for (const pattern of INVALID_PHONE_PATTERNS) {
    if (pattern.test(cleanPhone)) {
      reasons.push('Suspicious phone number pattern');
      break;
    }
  }

  if (HIGH_RISK_CITIES.some((c) => city?.toLowerCase().includes(c))) {
    reasons.push('Suspicious city name');
  }

  if (address && address.length < 5) {
    reasons.push('Address too short');
  }

  if (total > 500000) {
    reasons.push('Unusually high order total');
  }

  if (items?.length > 20) {
    reasons.push('Too many items in single order');
  }

  return {
    isFake: reasons.length > 0,
    reasons,
  };
};