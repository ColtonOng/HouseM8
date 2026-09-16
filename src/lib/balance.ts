export type BalanceExpense = {
  amount: number;
  owedPercent: number;
  settled: boolean;
  paidById: string | null;
};

/**
 * Net balance per person for unsettled expenses only.
 * Positive = other person owes them this much. Negative = they owe the other person.
 * Works for any number of people, but is meant for a two-person household.
 */
export function computeNetBalances(
  peopleIds: string[],
  expenses: BalanceExpense[]
): Record<string, number> {
  const net: Record<string, number> = {};
  for (const id of peopleIds) net[id] = 0;

  for (const exp of expenses) {
    if (exp.settled || !exp.paidById) continue;
    const owedAmount = exp.amount * (exp.owedPercent / 100);
    if (!(exp.paidById in net)) continue;
    net[exp.paidById] += owedAmount;
    for (const id of peopleIds) {
      if (id !== exp.paidById) {
        net[id] -= owedAmount / (peopleIds.length - 1 || 1);
      }
    }
  }

  return net;
}
