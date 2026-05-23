/**
 * Payroll Calculation Utilities
 */

export const calculatePayroll = (baseSalary, taxRate = 0.1, deductions = 0, bonus = 0) => {
  const tax = baseSalary * taxRate;
  const netSalary = baseSalary - tax - deductions + bonus;
  
  return {
    baseSalary,
    tax,
    deductions,
    bonus,
    netSalary,
    grossSalary: baseSalary + bonus,
    taxRate: (tax / baseSalary * 100).toFixed(2)
  };
};

export const calculateMonthlyPayroll = (annualSalary, bonus = 0) => {
  const monthly = annualSalary / 12;
  return calculatePayroll(monthly, 0.1, 0, bonus);
};

export const generatePayrollReport = (payrollRecords) => {
  const totalBaseSalary = payrollRecords.reduce((sum, p) => sum + p.baseSalary, 0);
  const totalTax = payrollRecords.reduce((sum, p) => sum + p.tax, 0);
  const totalDeductions = payrollRecords.reduce((sum, p) => sum + p.deductions, 0);
  const totalBonus = payrollRecords.reduce((sum, p) => sum + p.bonus, 0);
  const totalNetSalary = payrollRecords.reduce((sum, p) => sum + p.netSalary, 0);

  return {
    count: payrollRecords.length,
    totalBaseSalary,
    totalTax,
    totalDeductions,
    totalBonus,
    totalNetSalary,
    averageBaseSalary: (totalBaseSalary / payrollRecords.length).toFixed(2),
    averageNetSalary: (totalNetSalary / payrollRecords.length).toFixed(2)
  };
};

export const formatCurrency = (amount, currency = 'GHS') => {
  const symbols = {
    'GHS': '₵',
    'USD': '$',
    'EUR': '€',
    'NGN': '₦'
  };
  
  return `${symbols[currency] || currency} ${parseFloat(amount).toFixed(2)}`;
};

export const parsePayrollPeriod = (period) => {
  const [year, month] = period.split('-');
  const date = new Date(year, parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
};
