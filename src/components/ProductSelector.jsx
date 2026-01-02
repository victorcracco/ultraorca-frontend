export default function ProductSelector({ products, onSelect }) {
  return (
    <select
      className="border rounded p-2 w-full"
      defaultValue=""
      onChange={(e) => {
        const product = products.find(
          (p) => p.id === e.target.value
        );
        if (product) onSelect(product);
      }}
    >
      <option value="" disabled>
        Selecione um produto ou serviço
      </option>

      {products.map((product) => (
        <option key={product.id} value={product.id}>
          {product.name} — R$ {product.price.toFixed(2)}
        </option>
      ))}
    </select>
  );
}
