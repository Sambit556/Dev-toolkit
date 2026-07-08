export interface Unit {
  value: string;
  label: string;
  multiplier: number; // Multiplier to base unit
}

export interface UnitCategory {
  id: string;
  name: string;
  baseUnit: string;
  units: Unit[];
}

export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: 'length',
    name: 'Length',
    baseUnit: 'm',
    units: [
      { value: 'm', label: 'Meters (m)', multiplier: 1 },
      { value: 'km', label: 'Kilometers (km)', multiplier: 1000 },
      { value: 'cm', label: 'Centimeters (cm)', multiplier: 0.01 },
      { value: 'mm', label: 'Millimeters (mm)', multiplier: 0.001 },
      { value: 'mile', label: 'Miles (mi)', multiplier: 1609.344 },
      { value: 'yard', label: 'Yards (yd)', multiplier: 0.9144 },
      { value: 'foot', label: 'Feet (ft)', multiplier: 0.3048 },
      { value: 'inch', label: 'Inches (in)', multiplier: 0.0254 },
    ],
  },
  {
    id: 'mass',
    name: 'Mass & Weight',
    baseUnit: 'kg',
    units: [
      { value: 'kg', label: 'Kilograms (kg)', multiplier: 1 },
      { value: 'g', label: 'Grams (g)', multiplier: 0.001 },
      { value: 'mg', label: 'Milligrams (mg)', multiplier: 0.000001 },
      { value: 'lb', label: 'Pounds (lb)', multiplier: 0.45359237 },
      { value: 'oz', label: 'Ounces (oz)', multiplier: 0.028349523 },
      { value: 'stone', label: 'Stones (st)', multiplier: 6.35029318 },
    ],
  },
  {
    id: 'area',
    name: 'Area',
    baseUnit: 'm2',
    units: [
      { value: 'm2', label: 'Square Meters (m²)', multiplier: 1 },
      { value: 'km2', label: 'Square Kilometers (km²)', multiplier: 1000000 },
      { value: 'cm2', label: 'Square Centimeters (cm²)', multiplier: 0.0001 },
      { value: 'mile2', label: 'Square Miles (mi²)', multiplier: 2589988.11 },
      { value: 'foot2', label: 'Square Feet (ft²)', multiplier: 0.09290304 },
      { value: 'inch2', label: 'Square Inches (in²)', multiplier: 0.00064516 },
      { value: 'acre', label: 'Acres (ac)', multiplier: 4046.85642 },
      { value: 'hectare', label: 'Hectares (ha)', multiplier: 10000 },
    ],
  },
  {
    id: 'volume',
    name: 'Volume',
    baseUnit: 'L',
    units: [
      { value: 'L', label: 'Liters (L)', multiplier: 1 },
      { value: 'mL', label: 'Milliliters (mL)', multiplier: 0.001 },
      { value: 'm3', label: 'Cubic Meters (m³)', multiplier: 1000 },
      { value: 'gal', label: 'US Gallons (gal)', multiplier: 3.78541178 },
      { value: 'qt', label: 'US Quarts (qt)', multiplier: 0.946352946 },
      { value: 'pt', label: 'US Pints (pt)', multiplier: 0.473176473 },
      { value: 'cup', label: 'US Cups', multiplier: 0.24 },
      { value: 'fl_oz', label: 'US Fluid Ounces (fl oz)', multiplier: 0.029573529 },
    ],
  },
  {
    id: 'temperature',
    name: 'Temperature',
    baseUnit: 'C',
    units: [
      { value: 'C', label: 'Celsius (°C)', multiplier: 1 },
      { value: 'F', label: 'Fahrenheit (°F)', multiplier: 1 },
      { value: 'K', label: 'Kelvin (K)', multiplier: 1 },
    ],
  },
  {
    id: 'speed',
    name: 'Speed',
    baseUnit: 'm_s',
    units: [
      { value: 'm_s', label: 'Meters per second (m/s)', multiplier: 1 },
      { value: 'km_h', label: 'Kilometers per hour (km/h)', multiplier: 0.277777778 },
      { value: 'mph', label: 'Miles per hour (mph)', multiplier: 0.44704 },
      { value: 'knots', label: 'Knots (kt)', multiplier: 0.514444444 },
    ],
  },
  {
    id: 'time',
    name: 'Time Duration',
    baseUnit: 's',
    units: [
      { value: 'ns', label: 'Nanoseconds (ns)', multiplier: 0.000000001 },
      { value: 'us', label: 'Microseconds (µs)', multiplier: 0.000001 },
      { value: 'ms', label: 'Milliseconds (ms)', multiplier: 0.001 },
      { value: 's', label: 'Seconds (s)', multiplier: 1 },
      { value: 'min', label: 'Minutes (min)', multiplier: 60 },
      { value: 'hr', label: 'Hours (h)', multiplier: 3600 },
      { value: 'day', label: 'Days (d)', multiplier: 86400 },
      { value: 'week', label: 'Weeks (w)', multiplier: 604800 },
      { value: 'year', label: 'Years (yr - 365 days)', multiplier: 31536000 },
    ],
  },
  {
    id: 'storage',
    name: 'Digital Storage',
    baseUnit: 'B',
    units: [
      { value: 'bit', label: 'Bits (b)', multiplier: 0.125 },
      { value: 'B', label: 'Bytes (B)', multiplier: 1 },
      { value: 'KB', label: 'Kilobytes (KB - 10³)', multiplier: 1000 },
      { value: 'MB', label: 'Megabytes (MB - 10⁶)', multiplier: 1000000 },
      { value: 'GB', label: 'Gigabytes (GB - 10⁹)', multiplier: 1000000000 },
      { value: 'TB', label: 'Terabytes (TB - 10¹²)', multiplier: 1000000000000 },
      { value: 'PB', label: 'Petabytes (PB - 10¹⁵)', multiplier: 1000000000000000 },
      { value: 'KiB', label: 'Kibibytes (KiB - 2¹⁰)', multiplier: 1024 },
      { value: 'MiB', label: 'Mebibytes (MiB - 2²⁰)', multiplier: 1048576 },
      { value: 'GiB', label: 'Gibibytes (GiB - 2³⁰)', multiplier: 1073741824 },
      { value: 'TiB', label: 'Tebibytes (TiB - 2⁴⁰)', multiplier: 1099511627776 },
    ],
  },
  {
    id: 'energy',
    name: 'Energy',
    baseUnit: 'J',
    units: [
      { value: 'J', label: 'Joules (J)', multiplier: 1 },
      { value: 'kJ', label: 'Kilojoules (kJ)', multiplier: 1000 },
      { value: 'cal', label: 'Gram Calories (cal)', multiplier: 4.184 },
      { value: 'kcal', label: 'Food Calories (kcal)', multiplier: 4184 },
      { value: 'Wh', label: 'Watt Hours (Wh)', multiplier: 3600 },
      { value: 'kWh', label: 'Kilowatt Hours (kWh)', multiplier: 3600000 },
    ],
  },
  {
    id: 'pressure',
    name: 'Pressure',
    baseUnit: 'Pa',
    units: [
      { value: 'Pa', label: 'Pascals (Pa)', multiplier: 1 },
      { value: 'kPa', label: 'Kilopascals (kPa)', multiplier: 1000 },
      { value: 'bar', label: 'Bar', multiplier: 100000 },
      { value: 'psi', label: 'Pounds per sq inch (psi)', multiplier: 6894.75729 },
      { value: 'atm', label: 'Standard Atmosphere (atm)', multiplier: 101325 },
    ],
  },
];

export function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: string,
  categoryId: string
): number {
  if (isNaN(value)) return 0;
  if (fromUnit === toUnit) return value;

  // Temperature has non-linear conversions due to offsets
  if (categoryId === 'temperature') {
    return convertTemperature(value, fromUnit, toUnit);
  }

  const category = UNIT_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return 0;

  const from = category.units.find((u) => u.value === fromUnit);
  const to = category.units.find((u) => u.value === toUnit);

  if (!from || !to) return 0;

  const valueInBase = value * from.multiplier;
  return valueInBase / to.multiplier;
}

function convertTemperature(value: number, from: string, to: string): number {
  let celsius = value;
  
  // 1. Convert to Base (Celsius)
  if (from === 'F') {
    celsius = ((value - 32) * 5) / 9;
  } else if (from === 'K') {
    celsius = value - 273.15;
  }

  // 2. Convert from Celsius to Target
  if (to === 'C') {
    return celsius;
  } else if (to === 'F') {
    return (celsius * 9) / 5 + 32;
  } else if (to === 'K') {
    return celsius + 273.15;
  }

  return celsius;
}
