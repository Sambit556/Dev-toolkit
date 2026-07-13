const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
  'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua',
  'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris',
  'nisi', 'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure',
  'in', 'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum', 'eu', 'fugiat',
  'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt',
  'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum',
];

const randomRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function generateSentence(startWithLorem = false): string {
  const len = randomRange(6, 14);
  const words: string[] = [];
  if (startWithLorem) {
    words.push('Lorem', 'ipsum', 'dolor', 'sit', 'amet');
    while (words.length < len) words.push(LOREM_WORDS[randomRange(0, LOREM_WORDS.length - 1)]);
  } else {
    for (let i = 0; i < len; i++) {
      const w = LOREM_WORDS[randomRange(0, LOREM_WORDS.length - 1)];
      words.push(i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w);
    }
  }
  return words.join(' ') + '.';
}

function generateParagraph(sentenceCount: number, startWithLorem: boolean): string {
  const sentences: string[] = [];
  for (let i = 0; i < sentenceCount; i++) sentences.push(generateSentence(i === 0 && startWithLorem));
  return sentences.join(' ');
}

export function generateLoremIpsum(qty: number, type: 'paragraphs' | 'sentences' | 'words' | 'list', startWithLorem = true, wrapHtml = false): string {
  const safeQty = Math.max(1, Math.min(250, qty));
  if (type === 'paragraphs') {
    const paragraphs: string[] = [];
    for (let i = 0; i < safeQty; i++) {
      const pText = generateParagraph(randomRange(4, 7), i === 0 && startWithLorem);
      paragraphs.push(wrapHtml ? `<p>${pText}</p>` : pText);
    }
    return paragraphs.join('\n\n');
  }
  if (type === 'sentences') {
    const sentences: string[] = [];
    for (let i = 0; i < safeQty; i++) sentences.push(generateSentence(i === 0 && startWithLorem));
    return sentences.join(' ');
  }
  if (type === 'words') {
    let words: string[] = startWithLorem ? ['lorem', 'ipsum', 'dolor', 'sit', 'amet'] : [];
    while (words.length < safeQty) words.push(LOREM_WORDS[randomRange(0, LOREM_WORDS.length - 1)]);
    words = words.slice(0, safeQty);
    if (words.length > 0) words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    return words.join(' ') + '.';
  }
  // list
  const listItems: string[] = [];
  for (let i = 0; i < safeQty; i++) {
    const item = generateSentence(i === 0 && startWithLorem).slice(0, -1);
    listItems.push(wrapHtml ? `  <li>${item}</li>` : `- ${item}`);
  }
  return wrapHtml ? `<ul>\n${listItems.join('\n')}\n</ul>` : listItems.join('\n');
}

// --- Fake persona generator ---

export type FakeCountry = 'US' | 'UK' | 'IN' | 'CA';

interface CountryMockData {
  firstNamesMale: string[];
  firstNamesFemale: string[];
  lastNames: string[];
  streets: string[];
  locations: { city: string; state: string; zip: string }[];
  phonePrefix: string;
  idLabel: string;
  idFormat: string;
  country: string;
}

const MOCK_DATA: Record<FakeCountry, CountryMockData> = {
  US: {
    firstNamesMale: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles'],
    firstNamesFemale: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen'],
    lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'],
    streets: ['Oak St', 'Pine St', 'Maple Ave', 'Cedar Rd', 'Elm St', 'View Rd', 'Washington Blvd', 'Broadway', 'Main St', 'Park Ln'],
    locations: [
      { city: 'New York', state: 'NY', zip: '10001' },
      { city: 'Los Angeles', state: 'CA', zip: '90001' },
      { city: 'Chicago', state: 'IL', zip: '60601' },
      { city: 'Houston', state: 'TX', zip: '77001' },
      { city: 'Miami', state: 'FL', zip: '33101' },
    ],
    phonePrefix: '+1 (555)', idLabel: 'SSN', idFormat: 'XXX-XX-XXXX', country: 'United States',
  },
  UK: {
    firstNamesMale: ['Oliver', 'George', 'Harry', 'Noah', 'Jack', 'Leo', 'Arthur', 'Muhammad', 'Oscar', 'Charlie'],
    firstNamesFemale: ['Olivia', 'Amelia', 'Isla', 'Ava', 'Mia', 'Ivy', 'Lily', 'Isabella', 'Sophia', 'Grace'],
    lastNames: ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Davies', 'Evans', 'Thomas', 'Johnson'],
    streets: ['High St', 'Station Rd', 'London Rd', 'Church Rd', 'Park Rd', 'Queens Rd', 'Green Ln', 'Victoria Rd'],
    locations: [
      { city: 'London', state: 'England', zip: 'EC1A 1BB' },
      { city: 'Birmingham', state: 'England', zip: 'B1 1AY' },
      { city: 'Manchester', state: 'England', zip: 'M1 1AE' },
      { city: 'Glasgow', state: 'Scotland', zip: 'G1 1QX' },
      { city: 'Cardiff', state: 'Wales', zip: 'CF10 1FS' },
    ],
    phonePrefix: '+44 7700', idLabel: 'NIN', idFormat: 'QQ XX XX XX Q', country: 'United Kingdom',
  },
  IN: {
    firstNamesMale: ['Aarav', 'Vihaan', 'Vivaan', 'Kabir', 'Sai', 'Arjun', 'Aryan', 'Krishna'],
    firstNamesFemale: ['Aadhya', 'Saanvi', 'Ananya', 'Diya', 'Pari', 'Prisha', 'Ira', 'Avani', 'Riya', 'Kiara'],
    lastNames: ['Sharma', 'Verma', 'Gupta', 'Patel', 'Reddy', 'Singh', 'Kumar', 'Joshi', 'Mehta', 'Nair'],
    streets: ['Mahatma Gandhi Rd', 'Link Road', 'Park Street', 'Outer Ring Rd', 'JM Road', 'Race Course Rd'],
    locations: [
      { city: 'Mumbai', state: 'Maharashtra', zip: '400001' },
      { city: 'New Delhi', state: 'Delhi', zip: '110001' },
      { city: 'Bangalore', state: 'Karnataka', zip: '560001' },
      { city: 'Hyderabad', state: 'Telangana', zip: '500001' },
      { city: 'Chennai', state: 'Tamil Nadu', zip: '600001' },
    ],
    phonePrefix: '+91 98765', idLabel: 'Aadhaar / PAN', idFormat: 'XXXX-XXXX-XXXX', country: 'India',
  },
  CA: {
    firstNamesMale: ['Liam', 'Jackson', 'Lucas', 'Benjamin', 'Logan', 'William', 'Ethan', 'Oliver'],
    firstNamesFemale: ['Olivia', 'Emma', 'Charlotte', 'Amelia', 'Ava', 'Sophia', 'Chloe', 'Ella'],
    lastNames: ['Smith', 'Brown', 'Tremblay', 'Martin', 'Roy', 'Wilson', 'Macdonald', 'Gagnon'],
    streets: ['Yonge St', 'Jasper Ave', 'Robson St', 'Portage Ave', 'Saint-Catherine St', 'Main St'],
    locations: [
      { city: 'Toronto', state: 'ON', zip: 'M5V 2T6' },
      { city: 'Vancouver', state: 'BC', zip: 'V6B 1A1' },
      { city: 'Montreal', state: 'QC', zip: 'H3B 1A1' },
      { city: 'Calgary', state: 'AB', zip: 'T2P 1J1' },
      { city: 'Halifax', state: 'NS', zip: 'B3J 1A1' },
    ],
    phonePrefix: '+1 (555)', idLabel: 'SIN', idFormat: 'XXX-XXX-XXX', country: 'Canada',
  },
};

const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'Finance', 'Human Resources', 'Operations', 'Product Management'];
const OCCUPATIONS = ['Software Engineer', 'Systems Analyst', 'Product Designer', 'Marketing Director', 'Sales Representative', 'HR Specialist', 'Financial Analyst', 'Project Manager'];
const COMPANIES = ['TechFlow Inc', 'Stellar Media', 'Apex Logistics', 'Quantum Solutions', 'Vortex Systems', 'Infinity Global', 'Nexus Finance'];
const CARDS = ['Visa', 'MasterCard', 'Amex', 'Discover'];

const pickRandom = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomDigits = (pattern: string) => pattern.replace(/X/g, () => Math.floor(Math.random() * 10).toString());

export type FakeGender = 'random' | 'male' | 'female';

export function generateFakePersona(country: FakeCountry, gender: FakeGender) {
  const data = MOCK_DATA[country];
  const finalGender = gender === 'random' ? (Math.random() > 0.5 ? 'male' : 'female') : gender;
  const firstNames = finalGender === 'male' ? data.firstNamesMale : data.firstNamesFemale;
  const firstName = pickRandom(firstNames);
  const lastName = pickRandom(data.lastNames);
  const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomDigits('XX')}`;
  const age = Math.floor(Math.random() * 50) + 20;
  const birthYear = new Date().getFullYear() - age;
  const birthMonth = Math.floor(Math.random() * 12) + 1;
  const birthDay = Math.floor(Math.random() * 28) + 1;
  const streetNo = Math.floor(Math.random() * 900) + 100;
  const location = pickRandom(data.locations);
  const ccType = pickRandom(CARDS);
  let ccPattern = '4XXX XXXX XXXX XXXX';
  if (ccType === 'MasterCard') ccPattern = '5XXX XXXX XXXX XXXX';
  else if (ccType === 'Amex') ccPattern = '37XX XXXXXX XXXXX';
  else if (ccType === 'Discover') ccPattern = '6011 XXXX XXXX XXXX';

  return {
    gender: finalGender.charAt(0).toUpperCase() + finalGender.slice(1),
    name: `${firstName} ${lastName}`,
    birthday: `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`,
    age,
    nationalId: `${data.idLabel}: ${randomDigits(data.idFormat)}`,
    address: { street: `${streetNo} ${pickRandom(data.streets)}`, city: location.city, state: location.state, zip: location.zip, country: data.country },
    email: `${username}@example.com`,
    phone: `${data.phonePrefix} ${randomDigits('XXX XXXX')}`,
    username,
    password: Math.random().toString(36).substring(2, 10) + randomDigits('XX') + '!',
    employment: { company: pickRandom(COMPANIES), occupation: pickRandom(OCCUPATIONS), department: pickRandom(DEPARTMENTS) },
    finance: { cardType: ccType, cardNumber: randomDigits(ccPattern), expiry: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${Math.floor(Math.random() * 5) + 27}`, cvv: randomDigits('XXX') },
  };
}

export function generateBulkFakePersonas(country: FakeCountry, gender: FakeGender, count: number) {
  const safeCount = Math.max(1, Math.min(100, count));
  const list = [];
  for (let i = 0; i < safeCount; i++) {
    const data = MOCK_DATA[country];
    const finalGender = gender === 'random' ? (Math.random() > 0.5 ? 'male' : 'female') : gender;
    const firstNames = finalGender === 'male' ? data.firstNamesMale : data.firstNamesFemale;
    const firstName = pickRandom(firstNames);
    const lastName = pickRandom(data.lastNames);
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomDigits('XX')}`;
    const location = pickRandom(data.locations);
    const streetNo = Math.floor(Math.random() * 900) + 100;
    list.push({
      id: i + 1, name: `${firstName} ${lastName}`, gender: finalGender,
      email: `${username}@example.com`, phone: `${data.phonePrefix} ${randomDigits('XXXXXX')}`,
      street: `${streetNo} ${pickRandom(data.streets)}`, city: location.city, state: location.state, zip: location.zip,
      country, company: pickRandom(COMPANIES), occupation: pickRandom(OCCUPATIONS),
    });
  }
  return list;
}

// --- Random pick / teams / wheel winner ---

export function pickRandomItems(options: string[], count: number, allowDuplicates: boolean): string[] {
  if (options.length === 0) throw new Error('No options provided');
  const safeCount = allowDuplicates ? Math.max(1, count) : Math.max(1, Math.min(options.length, count));
  const picked: string[] = [];
  const pool = [...options];
  for (let i = 0; i < safeCount; i++) {
    if (pool.length === 0) break;
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool[idx]);
    if (!allowDuplicates) pool.splice(idx, 1);
  }
  return picked;
}

export function generateRandomTeams(names: string[], teamCount: number): string[][] {
  if (names.length === 0) throw new Error('No participant names provided');
  if (teamCount < 1) throw new Error('Team count must be at least 1');
  const pool = [...names];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const teams: string[][] = Array.from({ length: teamCount }, () => []);
  pool.forEach((name, idx) => teams[idx % teamCount].push(name));
  return teams.filter((t) => t.length > 0);
}

export function pickWheelWinner(entries: string[]): string {
  if (entries.length === 0) throw new Error('No wheel entries provided');
  return entries[Math.floor(Math.random() * entries.length)];
}
