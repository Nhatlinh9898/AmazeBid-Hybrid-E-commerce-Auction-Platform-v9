
import { Employee, LaborCost, Shareholder, ProfitDistribution } from '../types';

class EquityService {
  private employees: Employee[] = [];
  private laborCosts: LaborCost[] = [];
  private shareholders: Shareholder[] = [];
  private distributions: ProfitDistribution[] = [];
  private listeners: ((data: { 
    employees: Employee[], 
    laborCosts: LaborCost[], 
    shareholders: Shareholder[], 
    distributions: ProfitDistribution[] 
  }) => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const savedEmployees = localStorage.getItem('amazebid_employees');
    const savedLaborCosts = localStorage.getItem('amazebid_labor_costs');
    const savedShareholders = localStorage.getItem('amazebid_shareholders');
    const savedDistributions = localStorage.getItem('amazebid_distributions');

    if (savedEmployees) this.employees = JSON.parse(savedEmployees);
    if (savedLaborCosts) this.laborCosts = JSON.parse(savedLaborCosts);
    if (savedShareholders) this.shareholders = JSON.parse(savedShareholders);
    if (savedDistributions) this.distributions = JSON.parse(savedDistributions);
  }

  private saveToStorage() {
    localStorage.setItem('amazebid_employees', JSON.stringify(this.employees));
    localStorage.setItem('amazebid_labor_costs', JSON.stringify(this.laborCosts));
    localStorage.setItem('amazebid_shareholders', JSON.stringify(this.shareholders));
    localStorage.setItem('amazebid_distributions', JSON.stringify(this.distributions));
    this.notify();
  }

  private notify() {
    const data = {
      employees: this.employees,
      laborCosts: this.laborCosts,
      shareholders: this.shareholders,
      distributions: this.distributions
    };
    this.listeners.forEach(l => l(data));
  }

  subscribe(listener: (data: { 
    employees: Employee[], 
    laborCosts: LaborCost[], 
    shareholders: Shareholder[], 
    distributions: ProfitDistribution[] 
  }) => void) {
    this.listeners.push(listener);
    // Call immediately with current data
    listener({
      employees: this.employees,
      laborCosts: this.laborCosts,
      shareholders: this.shareholders,
      distributions: this.distributions
    });
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Employee Methods
  addEmployee(employee: Omit<Employee, 'id'>) {
    const newEmployee = { ...employee, id: `emp-${Math.random().toString(36).substring(2, 9)}` };
    this.employees.push(newEmployee);
    this.saveToStorage();
    return newEmployee;
  }

  deleteEmployee(id: string) {
    this.employees = this.employees.filter(e => e.id !== id);
    this.saveToStorage();
  }

  updateEmployee(id: string, data: Partial<Omit<Employee, 'id' | 'ownerId'>>) {
    const index = this.employees.findIndex(e => e.id === id);
    if (index === -1) return;
    this.employees[index] = { ...this.employees[index], ...data };
    this.saveToStorage();
  }

  getEmployeesByOwner(ownerId: string) {
    return this.employees.filter(e => e.ownerId === ownerId);
  }

  // Labor Cost Methods
  addLaborCost(cost: Omit<LaborCost, 'id'>) {
    const newCost = { ...cost, id: `lc-${Math.random().toString(36).substring(2, 9)}` };
    this.laborCosts.push(newCost);
    this.saveToStorage();
    return newCost;
  }

  getLaborCostsByOwner(ownerId: string) {
    return this.laborCosts.filter(lc => lc.ownerId === ownerId);
  }

  // Shareholder Methods
  addShareholder(shareholder: Omit<Shareholder, 'id' | 'sharePercentage'>) {
    const newShareholder: Shareholder = { 
      ...shareholder, 
      id: `sh-${Math.random().toString(36).substring(2, 9)}`,
      sharePercentage: 0, // Will be recalculated
      group: shareholder.group || (shareholder.role === 'FOUNDER' ? 'FOUNDER' : shareholder.role === 'EMPLOYEE' ? 'ESOP' : 'INVESTOR')
    };
    this.shareholders.push(newShareholder);
    this.recalculateShares(shareholder.ownerId);
    this.saveToStorage();
    return newShareholder;
  }

  deleteShareholder(id: string) {
    const sh = this.shareholders.find(s => s.id === id);
    if (!sh) return;
    const ownerId = sh.ownerId;
    this.shareholders = this.shareholders.filter(s => s.id !== id);
    this.recalculateShares(ownerId);
    this.saveToStorage();
  }

  updateShareholder(id: string, data: Partial<Omit<Shareholder, 'id' | 'ownerId' | 'sharePercentage'>>) {
    const index = this.shareholders.findIndex(s => s.id === id);
    if (index === -1) return;
    
    this.shareholders[index] = { ...this.shareholders[index], ...data };
    this.recalculateShares(this.shareholders[index].ownerId);
    this.saveToStorage();
  }

  private recalculateShares(ownerId: string) {
    const myShareholders = this.shareholders.filter(s => s.ownerId === ownerId);
    const now = new Date();

    const calculateVestedLabor = (sh: Shareholder) => {
      if (!sh.laborMonths || sh.laborMonths <= 0) return sh.laborContributionValue;
      
      const joinDate = new Date(sh.joinDate);
      const monthsPassed = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());
      const vestingFactor = Math.min(1, Math.max(0, monthsPassed / sh.laborMonths));
      
      return sh.laborContributionValue * vestingFactor;
    };

    const totalValue = myShareholders.reduce((sum, s) => {
      const vestedLabor = calculateVestedLabor(s);
      return sum + s.capitalContribution + s.assetContributionValue + vestedLabor + s.coreValueContributionValue;
    }, 0);

    if (totalValue > 0) {
      this.shareholders = this.shareholders.map(s => {
        if (s.ownerId === ownerId) {
          const vestedLabor = calculateVestedLabor(s);
          const myValue = s.capitalContribution + s.assetContributionValue + vestedLabor + s.coreValueContributionValue;
          return { ...s, sharePercentage: (myValue / totalValue) * 100 };
        }
        return s;
      });
    }
  }

  getShareholdersByOwner(ownerId: string) {
    return this.shareholders.filter(s => s.ownerId === ownerId);
  }

  // Profit Distribution
  distributeProfit(ownerId: string, totalProfit: number, period: string) {
    const myShareholders = this.getShareholdersByOwner(ownerId);
    if (myShareholders.length === 0) return;

    // Tier 1: Fund Allocation (50% of Total Profit)
    const reserveFund = totalProfit * 0.10;
    const salaryFund = totalProfit * 0.20;
    const bonusFund = totalProfit * 0.05;
    const devFund = totalProfit * 0.15;
    const totalFunds = reserveFund + salaryFund + bonusFund + devFund;

    // Tier 2: Net Profit
    const netProfit = totalProfit - totalFunds;

    // Tier 3: Distribution (50% of Net Profit)
    const distributedAmount = netProfit * 0.50;
    const retainedAmount = netProfit * 0.50;

    const distributions = myShareholders.map(s => ({
      shareholderId: s.id,
      amount: (distributedAmount * s.sharePercentage) / 100
    }));

    const newDist: ProfitDistribution = {
      id: `dist-${Math.random().toString(36).substring(2, 9)}`,
      ownerId,
      totalProfit,
      reserveFund,
      salaryFund,
      bonusFund,
      devFund,
      totalFunds,
      netProfit,
      distributedAmount,
      retainedAmount,
      period,
      distributions,
      createdAt: new Date().toISOString()
    };

    this.distributions.push(newDist);
    this.saveToStorage();
    return newDist;
  }

  getDistributionsByOwner(ownerId: string) {
    return this.distributions.filter(d => d.ownerId === ownerId);
  }

  exitShareholder(shareholderId: string, exitPercentage: number, exitValue: number, note: string) {
    const index = this.shareholders.findIndex(s => s.id === shareholderId);
    if (index !== -1) {
      const sh = this.shareholders[index];
      const isFullExit = exitPercentage >= 100;
      const factor = Math.max(0, (100 - exitPercentage) / 100);

      this.shareholders[index] = {
        ...sh,
        status: isFullExit ? 'EXITED' : sh.status,
        exitDate: new Date().toISOString().split('T')[0],
        exitValue: (sh.exitValue || 0) + exitValue,
        exitNote: isFullExit ? note : `Thoái ${exitPercentage}%: ${note}`,
        capitalContribution: sh.capitalContribution * factor,
        assetContributionValue: sh.assetContributionValue * factor,
        laborContributionValue: sh.laborContributionValue * factor,
        coreValueContributionValue: sh.coreValueContributionValue * factor,
      };
      
      this.recalculateShares(sh.ownerId);
      this.saveToStorage();
      return this.shareholders[index];
    }
    return null;
  }
}

export const equityService = new EquityService();
