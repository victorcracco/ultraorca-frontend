export default function BudgetSummary({ total }) {
  return <h2>Total: R$ {total.toFixed(2)}</h2>;
}
