import { useEffect, useState } from "react";
import { saveLayout, getLayout } from "../services/layoutStorage";

const layouts = [
  { id: "classic", name: "Clássico (Padrão)" },
  { id: "gray", name: "Cinza Profissional" },
  { id: "watermark", name: "Marca d’água (Premium)" },
];

export default function LayoutSelector() {
  const [selected, setSelected] = useState("classic");

  useEffect(() => {
    setSelected(getLayout());
  }, []);

  function handleChange(e) {
    const value = e.target.value;
    setSelected(value);
    saveLayout(value);
  }

  return (
    <div className="bg-white p-5 rounded-xl shadow border">
      <h3 className="text-lg font-semibold mb-1">
        Layout do Orçamento (PDF)
      </h3>

      <p className="text-sm text-gray-500 mb-4">
        Escolha o visual padrão dos seus orçamentos em PDF.
      </p>

      <select
        value={selected}
        onChange={handleChange}
        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {layouts.map((layout) => (
          <option key={layout.id} value={layout.id}>
            {layout.name}
          </option>
        ))}
      </select>
    </div>
  );
}
