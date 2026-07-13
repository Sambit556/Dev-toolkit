'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { MapPin, User, Mail, Phone, CreditCard, Briefcase, Download, Copy, RefreshCw, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// --- DATASETS ---
const MOCK_DATA = {
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
    phonePrefix: '+1 (555)',
    idLabel: 'SSN',
    idFormat: 'XXX-XX-XXXX',
  },
  UK: {
    firstNamesMale: ['Oliver', 'George', 'Harry', 'Noah', 'Jack', 'Leo', 'Arthur', 'Muhammad', 'Oscar', 'Charlie'],
    firstNamesFemale: ['Olivia', 'Amelia', 'Isla', 'Ava', 'Mia', 'Ivy', 'Lily', 'Isabella', 'Sophia', 'Grace'],
    lastNames: ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Davies', 'Evans', 'Thomas', 'Johnson'],
    streets: ['High St', 'Station Rd', 'London Rd', 'Church Rd', 'Park Rd', 'Queens Rd', 'Green Ln', 'Victoria Rd', 'Grange Rd'],
    locations: [
      { city: 'London', state: 'England', zip: 'EC1A 1BB' },
      { city: 'Birmingham', state: 'England', zip: 'B1 1AY' },
      { city: 'Manchester', state: 'England', zip: 'M1 1AE' },
      { city: 'Glasgow', state: 'Scotland', zip: 'G1 1QX' },
      { city: 'Cardiff', state: 'Wales', zip: 'CF10 1FS' },
    ],
    phonePrefix: '+44 7700',
    idLabel: 'NIN',
    idFormat: 'QQ XX XX XX Q',
  },
  IN: {
    firstNamesMale: ['Aarav', 'Vihaan', 'Vivaan', 'Ananya', 'Diya', 'Kabir', 'Sai', 'Arjun', 'Aryan', 'Krishna'],
    firstNamesFemale: ['Aadhya', 'Saanvi', 'Ananya', 'Diya', 'Pari', 'Prisha', 'Ira', 'Avani', 'Riya', 'Kiara'],
    lastNames: ['Sharma', 'Verma', 'Gupta', 'Patel', 'Reddy', 'Singh', 'Kumar', 'Joshi', 'Mehta', 'Nair'],
    streets: ['Mahatma Gandhi Rd', 'Link Road', 'Linking Rd', 'Park Street', 'Outer Ring Rd', 'JM Road', 'Race Course Rd', 'Vasant Kunj'],
    locations: [
      { city: 'Mumbai', state: 'Maharashtra', zip: '400001' },
      { city: 'New Delhi', state: 'Delhi', zip: '110001' },
      { city: 'Bangalore', state: 'Karnataka', zip: '560001' },
      { city: 'Hyderabad', state: 'Telangana', zip: '500001' },
      { city: 'Chennai', state: 'Tamil Nadu', zip: '600001' },
    ],
    phonePrefix: '+91 98765',
    idLabel: 'Aadhaar / PAN',
    idFormat: 'XXXX-XXXX-XXXX',
  },
  CA: {
    firstNamesMale: ['Liam', 'Jackson', 'Lucas', 'Benjamin', 'Logan', 'William', 'Ethan', 'Oliver', 'James', 'Lucas'],
    firstNamesFemale: ['Olivia', 'Emma', 'Charlotte', 'Amelia', 'Ava', 'Sophia', 'Chloe', 'Ella', 'Abigail', 'Emily'],
    lastNames: ['Smith', 'Brown', 'Tremblay', 'Martin', 'Roy', 'Wilson', 'Macdonald', 'Gagnon', 'Campbell', 'Taylor'],
    streets: ['Yonge St', 'Jasper Ave', 'Robson St', 'Portage Ave', 'Saint-Catherine St', 'Barrington St', 'Main St', 'King St'],
    locations: [
      { city: 'Toronto', state: 'ON', zip: 'M5V 2T6' },
      { city: 'Vancouver', state: 'BC', zip: 'V6B 1A1' },
      { city: 'Montreal', state: 'QC', zip: 'H3B 1A1' },
      { city: 'Calgary', state: 'AB', zip: 'T2P 1J1' },
      { city: 'Halifax', state: 'NS', zip: 'B3J 1A1' },
    ],
    phonePrefix: '+1 (555)',
    idLabel: 'SIN',
    idFormat: 'XXX-XXX-XXX',
  }
};

const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'Finance', 'Human Resources', 'Operations', 'Product Management'];
const OCCUPATIONS = ['Software Engineer', 'Systems Analyst', 'Product Designer', 'Marketing Director', 'Sales Representative', 'HR Specialist', 'Financial Analyst', 'Project Manager'];
const COMPANIES = ['TechFlow Inc', 'Stellar Media', 'Apex Logistics', 'Quantum Solutions', 'Vortex Systems', 'Infinity Global', 'Nexus Finance'];
const CARDS = ['Visa', 'MasterCard', 'Amex', 'Discover'];

const pickRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const generateRandomDigits = (pattern: string) => {
  return pattern.replace(/X/g, () => Math.floor(Math.random() * 10).toString());
};

function generatePersona(country: 'US' | 'UK' | 'IN' | 'CA', gender: 'random' | 'male' | 'female') {
  const data = MOCK_DATA[country];

  // Gender
  const finalGender = gender === 'random' ? (Math.random() > 0.5 ? 'male' : 'female') : gender;
  const firstNames = finalGender === 'male' ? data.firstNamesMale : data.firstNamesFemale;

  const firstName = pickRandom(firstNames);
  const lastName = pickRandom(data.lastNames);
  const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${generateRandomDigits('XX')}`;

  // Age & Birthday
  const age = Math.floor(Math.random() * 50) + 20; // 20-70
  const birthYear = new Date().getFullYear() - age;
  const birthMonth = Math.floor(Math.random() * 12) + 1;
  const birthDay = Math.floor(Math.random() * 28) + 1;
  const birthday = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`;

  // Address
  const streetNo = Math.floor(Math.random() * 900) + 100;
  const street = `${streetNo} ${pickRandom(data.streets)}`;
  const location = pickRandom(data.locations);

  // CC
  const ccType = pickRandom(CARDS);
  let ccPattern = '4XXX XXXX XXXX XXXX'; // Visa
  if (ccType === 'MasterCard') ccPattern = '5XXX XXXX XXXX XXXX';
  else if (ccType === 'Amex') ccPattern = '37XX XXXXXX XXXXX';
  else if (ccType === 'Discover') ccPattern = '6011 XXXX XXXX XXXX';

  const ccNumber = generateRandomDigits(ccPattern);
  const ccExp = `${(Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0')}/${Math.floor(Math.random() * 5) + 27}`; // expiry 2027-2031
  const ccCvv = generateRandomDigits('XXX');

  return {
    gender: finalGender.charAt(0).toUpperCase() + finalGender.slice(1),
    name: `${firstName} ${lastName}`,
    birthday,
    age,
    nationalId: `${data.idLabel}: ${generateRandomDigits(data.idFormat)}`,
    address: {
      street,
      city: location.city,
      state: location.state,
      zip: location.zip,
      country: country === 'US' ? 'United States' : country === 'UK' ? 'United Kingdom' : country === 'IN' ? 'India' : 'Canada',
    },
    email: `${username}@example.com`,
    phone: `${data.phonePrefix} ${generateRandomDigits('XXX XXXX')}`,
    username,
    password: Math.random().toString(36).substring(2, 10) + generateRandomDigits('XX') + '!',
    employment: {
      company: pickRandom(COMPANIES),
      occupation: pickRandom(OCCUPATIONS),
      department: pickRandom(DEPARTMENTS),
    },
    finance: {
      cardType: ccType,
      cardNumber: ccNumber,
      expiry: ccExp,
      cvv: ccCvv,
    }
  };
}

function generateBulkList(country: 'US' | 'UK' | 'IN' | 'CA', gender: 'random' | 'male' | 'female', bulkQty: number) {
  const list: any[] = [];
  const count = Math.max(1, Math.min(100, bulkQty));

  for (let i = 0; i < count; i++) {
    const data = MOCK_DATA[country];
    const finalGender = gender === 'random' ? (Math.random() > 0.5 ? 'male' : 'female') : gender;
    const firstNames = finalGender === 'male' ? data.firstNamesMale : data.firstNamesFemale;
    const firstName = pickRandom(firstNames);
    const lastName = pickRandom(data.lastNames);
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${generateRandomDigits('XX')}`;
    const location = pickRandom(data.locations);
    const streetNo = Math.floor(Math.random() * 900) + 100;

    list.push({
      id: i + 1,
      name: `${firstName} ${lastName}`,
      gender: finalGender,
      email: `${username}@example.com`,
      phone: `${data.phonePrefix} ${generateRandomDigits('XXXXXX')}`,
      street: `${streetNo} ${pickRandom(data.streets)}`,
      city: location.city,
      state: location.state,
      zip: location.zip,
      country: country,
      company: pickRandom(COMPANIES),
      occupation: pickRandom(OCCUPATIONS),
    });
  }

  return list;
}

export function FakeAddressTool() {
  const [country, setCountry] = useState<'US' | 'UK' | 'IN' | 'CA'>('US');
  const [gender, setGender] = useState<'random' | 'male' | 'female'>('random');
  const [viewMode, setViewMode] = useState<'single' | 'bulk'>('single');
  const [bulkQty, setBulkQty] = useState<number>(10);

  const [persona, setPersona] = useState<any | null>(null);
  const [bulkResult, setBulkResult] = useState<string>('');

  // Math.random()-based generation must run client-only: this page is statically
  // prerendered, so a useMemo here would bake one random draw into the static HTML
  // and mismatch every visitor's client-side hydration.
  const regenerate = useCallback(() => {
    if (viewMode === 'single') {
      setPersona(generatePersona(country, gender));
    } else {
      setBulkResult(JSON.stringify(generateBulkList(country, gender, bulkQty), null, 2));
    }
  }, [country, gender, viewMode, bulkQty]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    regenerate();
  }, [regenerate]);

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleDownloadJson = () => {
    const data = viewMode === 'single' ? JSON.stringify(persona, null, 2) : bulkResult;
    if (!data) return;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mock_profiles_${country.toLowerCase()}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Mock profiles downloaded as JSON!');
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Controls Card */}
      <Card className="border bg-card/60 backdrop-blur-sm shadow-sm md:col-span-1 h-fit">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center pb-2 border-b">
            <Label className="font-bold text-sm">Generator Filters</Label>
          </div>

          <div className="space-y-1.5">
            <Label>Target Country / Region</Label>
            <Select value={country} onValueChange={(v: any) => setCountry(v)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">🇺🇸 United States (US)</SelectItem>
                <SelectItem value="UK">🇬🇧 United Kingdom (UK)</SelectItem>
                <SelectItem value="IN">🇮🇳 India (IN)</SelectItem>
                <SelectItem value="CA">🇨🇦 Canada (CA)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Gender Profile</Label>
            <Select value={gender} onValueChange={(v: any) => setGender(v)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="random">Random Mix</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 pt-1 border-t">
            <Label>Generation Mode</Label>
            <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Persona Sheet</SelectItem>
                <SelectItem value="bulk">Bulk List Generation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {viewMode === 'bulk' && (
            <div className="space-y-1.5">
              <Label htmlFor="bulk-qty">Generation Size (Max 100)</Label>
              <Input
                id="bulk-qty"
                type="number"
                min={1}
                max={100}
                value={bulkQty}
                onChange={(e) => setBulkQty(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                className="h-9 text-xs"
              />
            </div>
          )}

          <Button onClick={regenerate} className="w-full gap-1.5 text-xs font-bold pt-1">
            <RefreshCw className="h-3.5 w-3.5" />
            Generate New
          </Button>
        </CardContent>
      </Card>

      {/* Output Display Card */}
      <div className="md:col-span-2 space-y-6">
        {viewMode === 'single' && persona ? (
          /* Single Detailed Sheet */
          <Card className="border shadow-md">
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                  <User className="h-4.5 w-4.5 text-primary" />
                  Mock Identity Persona Profile
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleCopy(JSON.stringify(persona, null, 2), 'JSON')} className="h-7 text-[10px] gap-1">
                    <Copy className="h-3 w-3" /> Copy JSON
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadJson} className="h-7 text-[10px] text-primary gap-1">
                    <Download className="h-3 w-3" /> Download
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 text-xs">
                {/* 1. Personal */}
                <div className="space-y-3">
                  <h4 className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider border-b pb-1">Personal Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Full Name:</span><span className="font-bold">{persona.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Gender:</span><span className="font-semibold">{persona.gender}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Birth Date (Age):</span><span className="font-mono">{persona.birthday} ({persona.age})</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">National ID:</span><span className="font-mono font-bold text-primary">{persona.nationalId}</span></div>
                  </div>
                </div>

                {/* 2. Contact / Online */}
                <div className="space-y-3">
                  <h4 className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider border-b pb-1">Contact & Credentials</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Email:</span><span className="font-mono select-all">{persona.email}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Phone:</span><span className="font-mono">{persona.phone}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Username:</span><span className="font-mono">{persona.username}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Password:</span><span className="font-mono font-bold text-primary">{persona.password}</span></div>
                  </div>
                </div>

                {/* 3. Address */}
                <div className="space-y-3">
                  <h4 className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider border-b pb-1">Physical Address</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Street:</span><span className="font-semibold">{persona.address.street}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">City:</span><span className="font-semibold">{persona.address.city}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">State / Province:</span><span className="font-semibold">{persona.address.state}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Postal / ZIP:</span><span className="font-mono font-bold">{persona.address.zip}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Country:</span><span className="font-semibold">{persona.address.country}</span></div>
                  </div>
                </div>

                {/* 4. Employment */}
                <div className="space-y-3">
                  <h4 className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider border-b pb-1">Employment Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Company:</span><span className="font-semibold">{persona.employment.company}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Occupation:</span><span className="font-semibold text-primary">{persona.employment.occupation}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Department:</span><span className="font-semibold">{persona.employment.department}</span></div>
                  </div>
                </div>

                {/* 5. Finance */}
                <div className="space-y-3 sm:col-span-2">
                  <h4 className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider border-b pb-1">Mock Credit Card (Dev Testing)</h4>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-muted-foreground">Card Type:</span><span className="font-semibold flex items-center gap-1"><CreditCard className="h-3.5 w-3.5 text-primary" /> {persona.finance.cardType}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Card Number:</span><span className="font-mono font-bold select-all">{persona.finance.cardNumber}</span></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-muted-foreground">Expiry Date:</span><span className="font-mono font-bold">{persona.finance.expiry}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">CVV/Security Code:</span><span className="font-mono font-bold text-primary">{persona.finance.cvv}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Bulk List Output */
          <Card className="border shadow-md">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <Label className="font-bold text-sm flex items-center gap-1.5">
                  <Layers className="h-4.5 w-4.5 text-primary" />
                  Bulk Generated Dataset JSON
                </Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleCopy(bulkResult, 'Dataset')} className="h-8 gap-1 text-xs">
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadJson} className="h-8 gap-1 text-xs text-primary">
                    <Download className="h-3.5 w-3.5" /> Download
                  </Button>
                </div>
              </div>
              <Textarea
                value={bulkResult}
                readOnly
                className="min-h-[420px] text-xs leading-normal font-mono"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
