
import { Employee, LaborCost, Shareholder, ProfitDistribution } from '../types';

class EquityService {
  private employees: Employee[] = [];
  private laborCosts: LaborCost[] = [];
  private shareholders: Shareholder[] = [];
  private distributions: ProfitDistribution[] = [];
  private listeners: (() => void)[] = [];

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
    this.listeners.forEach(l => l());
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
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
      sharePercentage: 0 // Will be recalculated
    };
    this.shareholders.push(newShareholder);
    this.recalculateShares(shareholder.ownerId);
    this.saveToStorage();
    return newShareholder;
  }

  deleteShareholder(id: string, ownerId: string) {
    this.shareholders = this.shareholders.filter(s => s.id !== id);
    this.recalculateShares(ownerId);
    this.saveToStorage();
  }

  private recalculateShares(ownerId: string) {
    const myShareholders = this.shareholders.filter(s => s.ownerId === ownerId);
    const totalValue = myShareholders.reduce((sum, s) => 
      sum + s.capitalContribution + s.laborContributionValue + s.otherContributionValue, 0);

    if (totalValue > 0) {
      this.shareholders = this.shareholders.map(s => {
        if (s.ownerId === ownerId) {
          const myValue = s.capitalContribution + s.laborContributionValue + s.otherContributionValue;
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
  distributeProfit(ownerId: string, totalProfit: number, distributedAmount: number, retainedAmount: number, period: string) {
    const myShareholders = this.getShareholdersByOwner(ownerId);
    const distributions = myShareholders.map(s => ({
      shareholderId: s.id,
      amount: (distributedAmount * s.sharePercentage) / 100
    }));

    const newDist: ProfitDistribution = {
      id: `dist-${Math.random().toString(36).substring(2, 9)}`,
      ownerId,
      totalProfit,
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
}

export const equityService = new EquityService();
