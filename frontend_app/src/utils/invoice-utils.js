// utils/invoice-utils.js
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * by: 'count'  -> Total = #facturas, Paid = #paid
 * by: 'amount' -> Total = sum(paymentMade), Paid = sum(paymentMade de status=paid)
 * Not Paid = Total - Paid (puedes cambiarlo a balances si quieres)
 */
export function buildInvoicesChart(invoices, { year, by = 'count', top = 0 } = {}) {
  const safeDate = (s) => {
    if (!s || typeof s !== 'string') return null;
    const z = s.endsWith('Z') ? s : `${s}Z`;
    const d = new Date(z);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const first = (invoices || []).find(i => safeDate(i?.date));
  const fallbackYear = first ? safeDate(first.date).getUTCFullYear() : new Date().getUTCFullYear();
  const targetYear = year ?? fallbackYear;

  const filtered = (invoices || []).filter(i => {
    const d = safeDate(i?.date);
    return d && d.getUTCFullYear() === targetYear;
  });

  const { total, paid } = filtered.reduce(
    (acc, inv) => {
      const d = safeDate(inv.date);
      if (!d) return acc;
      const m = d.getUTCMonth();
      const isPaid = String(inv.status || '').toLowerCase() === 'paid';
      const val = by === 'amount' ? Number(inv.paymentMade || 0) : 1;

      acc.total[m] += val;
      if (isPaid) acc.paid[m] += val;
      return acc;
    },
    { total: Array(12).fill(0), paid: Array(12).fill(0) }
  );

  const notPaid = total.map((t, i) => t - paid[i]);

  if (top > 0) {
    const currentMonth = new Date().getUTCMonth();
    const initialIndex = currentMonth - top < 0 ? 0 : currentMonth - top;
    return {
      categories: MONTHS.slice(initialIndex + 1, currentMonth + 1),
      series: [
        { name: 'Total', data: total.slice(initialIndex + 1, currentMonth + 1) || [] },
        { name: 'Paid', data: paid.slice(initialIndex + 1, currentMonth + 1) || [] },
        { name: 'Not Paid', data: notPaid.slice(initialIndex + 1, currentMonth + 1) || [] },
      ],
    };
  }

  return {
    categories: MONTHS,
    series: [
      { name: 'Total', data: total || [] },
      { name: 'Paid', data: paid || [] },
      { name: 'Not Paid', data: notPaid || [] },
    ],
  };
}


export const reduceList = (list, conditions = null, { by = 'count' } = {}) => {
  const filtered = conditions ? list?.filter(conditions) : list;
  if (by === 'count') {
    return filtered?.length;
  }
  return filtered?.reduce((acc, item) => acc + (Number(item?.[by]) || 0), 0);
};
