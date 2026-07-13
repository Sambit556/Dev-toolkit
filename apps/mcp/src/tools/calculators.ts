import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withApiKeyCheck } from '../auth.js';
import {
  evaluateMathExpression,
  calculateEmi,
  convertSalaryFrequency,
  calculateDateInterval,
  addSubtractDate,
  calculateGst,
  calculateSip,
  calculateBmi,
} from '../lib/calculators.js';

export function registerCalculatorTools(server: McpServer): void {
  server.registerTool(
    'evaluate_math_expression',
    {
      title: 'Evaluate a Math Expression',
      description:
        'Evaluate an arithmetic/scientific expression (supports +-*/%, ^, sin/cos/tan/sinh/cosh/tanh, ' +
        'ln, log, sqrt, abs, factorial, π). Use this instead of doing arithmetic mentally or in prose — ' +
        'LLMs are unreliable at multi-step arithmetic, especially with many digits or nested operations.',
      inputSchema: { expression: z.string().min(1).describe('e.g. "2*(3+4)^2", "sin(π/2)", "fact(5)".') },
    },
    withApiKeyCheck(async ({ expression }) => ({ content: [{ type: 'text', text: String(evaluateMathExpression(expression)) }] })),
  );

  server.registerTool(
    'calculate_emi',
    {
      title: 'Calculate Loan EMI',
      description:
        'Compute the monthly EMI, total interest, and total payment for a loan (plus the full amortization ' +
        'schedule). Use this instead of manually applying the compound-interest EMI formula, which is easy ' +
        'to get wrong (rate/period unit mismatches are a common error).',
      inputSchema: {
        principal: z.number().positive().describe('Loan principal amount.'),
        annualRatePercent: z.number().positive().describe('Annual interest rate, as a percentage (e.g. 8.5).'),
        tenure: z.number().positive().describe('Loan tenure.'),
        tenureUnit: z.enum(['years', 'months']).describe('Unit of the tenure value.'),
      },
    },
    withApiKeyCheck(async ({ principal, annualRatePercent, tenure, tenureUnit }) => {
      const result = calculateEmi(principal, annualRatePercent, tenure, tenureUnit);
      return {
        content: [{
          type: 'text',
          text: `Monthly EMI: ${result.monthlyEmi.toFixed(2)}\nTotal interest: ${result.totalInterest.toFixed(2)}\nTotal payment: ${result.totalPayment.toFixed(2)}\n(${result.amortization.length}-month amortization schedule computed; ask for it explicitly if you need the full table.)`,
        }],
      };
    }),
  );

  server.registerTool(
    'convert_salary_frequency',
    {
      title: 'Convert Salary Between Pay Frequencies',
      description:
        'Convert a salary figure across annual/monthly/semi-monthly/bi-weekly/weekly/daily/hourly pay ' +
        'frequencies, with an estimated tax deduction. Use this instead of manually multiplying/dividing by ' +
        'the number of pay periods per year, which is easy to mix up (52 vs 26 vs 24).',
      inputSchema: {
        baseSalary: z.number().positive().describe('The salary amount at the given frequency.'),
        frequency: z.enum(['annual', 'monthly', 'weekly', 'hourly']).describe('Frequency of the baseSalary figure.'),
        hoursPerWeek: z.number().positive().optional().describe('Hours worked per week (used for hourly conversions). Defaults to 40.'),
        taxRatePercent: z.number().min(0).max(100).optional().describe('Estimated flat tax rate to apply. Defaults to 0.'),
      },
    },
    withApiKeyCheck(async ({ baseSalary, frequency, hoursPerWeek, taxRatePercent }) => {
      const breakdown = convertSalaryFrequency(baseSalary, frequency, hoursPerWeek ?? 40, taxRatePercent ?? 0);
      return { content: [{ type: 'text', text: JSON.stringify(breakdown, null, 2) }] };
    }),
  );

  server.registerTool(
    'calculate_date_interval',
    {
      title: 'Calculate Interval Between Two Dates',
      description:
        'Compute the exact years/months/days (plus total days/weeks/hours/minutes/seconds) between two ' +
        'dates. Use this instead of manually counting days across months of different lengths and leap ' +
        'years, which is a common source of off-by-one errors.',
      inputSchema: {
        startDate: z.string().describe('Start date, e.g. "1995-01-01".'),
        endDate: z.string().describe('End date, e.g. "2024-06-15".'),
      },
    },
    withApiKeyCheck(async ({ startDate, endDate }) => ({ content: [{ type: 'text', text: JSON.stringify(calculateDateInterval(startDate, endDate), null, 2) }] })),
  );

  server.registerTool(
    'add_subtract_date',
    {
      title: 'Add or Subtract Time From a Date',
      description:
        'Add or subtract a number of days/weeks/months/years from a date. Use this instead of manually ' +
        'counting forward/backward on a calendar, which is error-prone across month/year boundaries.',
      inputSchema: {
        startDate: z.string().describe('The base date, e.g. "2024-01-15".'),
        offset: z.number().describe('The amount to add or subtract.'),
        unit: z.enum(['days', 'weeks', 'months', 'years']).describe('Unit of the offset.'),
        operation: z.enum(['add', 'sub']).describe('Whether to add or subtract.'),
      },
    },
    withApiKeyCheck(async ({ startDate, offset, unit, operation }) => ({ content: [{ type: 'text', text: addSubtractDate(startDate, offset, unit, operation) }] })),
  );

  server.registerTool(
    'calculate_gst',
    {
      title: 'Add or Remove GST/Sales Tax',
      description:
        'Compute the net/tax/gross breakdown when adding GST to a net amount, or extracting it from a ' +
        'gross amount. Use this instead of manually applying the tax-inclusive formula, where dividing by ' +
        '(1 + rate) instead of multiplying is a common mistake when removing tax.',
      inputSchema: {
        amount: z.number().positive().describe('The amount to compute tax on.'),
        ratePercent: z.number().positive().describe('Tax rate as a percentage, e.g. 18.'),
        type: z.enum(['add', 'remove']).describe('"add" treats amount as net (pre-tax); "remove" treats amount as gross (tax-inclusive).'),
      },
    },
    withApiKeyCheck(async ({ amount, ratePercent, type }) => ({ content: [{ type: 'text', text: JSON.stringify(calculateGst(amount, ratePercent, type), null, 2) }] })),
  );

  server.registerTool(
    'calculate_sip',
    {
      title: 'Calculate SIP Investment Returns',
      description:
        'Estimate the future value of a recurring monthly investment (SIP) given an expected annual return ' +
        'rate and duration. Use this instead of manually compounding monthly returns over many periods, ' +
        'which is impractical to do accurately by hand.',
      inputSchema: {
        monthlyAmount: z.number().positive().describe('Amount invested per month.'),
        annualReturnPercent: z.number().positive().describe('Expected annual return rate, as a percentage.'),
        years: z.number().positive().describe('Investment duration in years.'),
      },
    },
    withApiKeyCheck(async ({ monthlyAmount, annualReturnPercent, years }) => ({ content: [{ type: 'text', text: JSON.stringify(calculateSip(monthlyAmount, annualReturnPercent, years), null, 2) }] })),
  );

  server.registerTool(
    'calculate_bmi',
    {
      title: 'Calculate BMI',
      description:
        'Compute Body Mass Index and category (underweight/normal/overweight/obese) from weight and height, ' +
        'in metric (kg/cm) or imperial (lbs/inches) units. Use this instead of applying the BMI formula ' +
        'mentally, especially the imperial-unit variant which uses a different constant (703).',
      inputSchema: {
        system: z.enum(['metric', 'imperial']).describe('Unit system.'),
        weight: z.number().positive().describe('Weight in kg (metric) or lbs (imperial).'),
        height: z.number().positive().describe('Height in cm (metric) or inches (imperial).'),
      },
    },
    withApiKeyCheck(async ({ system, weight, height }) => ({ content: [{ type: 'text', text: JSON.stringify(calculateBmi(system, weight, height), null, 2) }] })),
  );
}
