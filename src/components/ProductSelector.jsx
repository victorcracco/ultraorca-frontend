import React from 'react';
import { Link } from 'react-router-dom';

export default function ProductSelector({ products, onSelect }) {
  
  const handleChange = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    const product = products.find((p) => p.id === selectedId);
    if (product) {
      onSelect(product);
      e.target.value = ""; 
    }
  };

  if (!products || products.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded border border-dashed border-gray-300">
        Nenhum item salvo. <Link to="/app/products" className="text-blue-600 font-bold hover:underline">Cadastrar agora</Link>
      </div>
    );
  }

  const services = products.filter(p => p.type !== 'product');
  const goods = products.filter(p => p.type === 'product');

  return (
    <div className="relative group">
      <select 
        onChange={handleChange}
        defaultValue=""
        className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer hover:border-blue-300"
      >
        {/* TEXTO LIMPO AQUI (Sem emoji) */}
        <option value="" disabled>Selecione um item salvo...</option>
        
        {services.length > 0 && (
          <optgroup label="SERVIÇOS">
            {services.map((product) => (
              <option key={product.id} value={product.id}>
                 {product.name} — {Number(product.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </option>
            ))}
          </optgroup>
        )}

        {goods.length > 0 && (
          <optgroup label="PRODUTOS / PEÇAS">
            {goods.map((product) => (
              <option key={product.id} value={product.id}>
                 {product.name} — {Number(product.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </option>
            ))}
          </optgroup>
        )}

      </select>
      
      {/* Seta simples e fina na direita */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 group-hover:text-blue-500 transition-colors">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
    </div>
  );
}