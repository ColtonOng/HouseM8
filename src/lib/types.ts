export type Person = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
};

export type MoveInItem = {
  id: string;
  name: string;
  category: string;
  estCost: number;
  purchased: boolean;
  notes: string | null;
  addedById: string | null;
  addedBy: Person | null;
  createdAt: string;
  updatedAt: string;
};

export type GroceryItem = {
  id: string;
  name: string;
  category: string;
  estPrice: number;
  quantity: number;
  purchased: boolean;
  addedById: string | null;
  addedBy: Person | null;
  createdAt: string;
  updatedAt: string;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  owedPercent: number;
  settled: boolean;
  paidById: string | null;
  paidBy: Person | null;
  date: string;
  createdAt: string;
};
