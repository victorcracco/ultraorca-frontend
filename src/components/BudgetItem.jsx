export default function BudgetItem({ item, onChange }) {
  return (
    <div>
      <strong>{item.name}</strong>
      <input
        type="number"
        value={item.quantity}
        onChange={(e) =>
          onChange("quantity", Number(e.target.value))
        }
      />
      <input
        type="number"
        value={item.price}
        onChange={(e) =>
          onChange("price", Number(e.target.value))
        }
      />
    </div>
  );
}
