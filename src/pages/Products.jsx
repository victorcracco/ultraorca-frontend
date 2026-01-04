import React, { useState, useEffect } from "react";
import { getProducts, saveProducts } from "../services/storage";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setProducts(getProducts());
  }, []);

  function addProduct(e) {
    e.preventDefault();
    if (!name || !price) return;

    const newProducts = [
      ...products,
      {
        id: crypto.randomUUID(),
        name,
        price: Number(price),
      },
    ];

    setProducts(newProducts);
    saveProducts(newProducts);
    setName("");
    setPrice("");
    setFeedback("Produto adicionado com sucesso!");
    setTimeout(() => setFeedback(""), 2000);
  }

  function removeProduct(id) {
    const newProducts = products.filter((p) => p.id !== id);
    setProducts(newProducts);
    saveProducts(newProducts);
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Produtos & Serviços</h1>
          <p className="text-gray-500 mt-1">Gerencie os itens que você oferece.</p>
        </div>
        {feedback && (
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded shadow-sm text-sm font-semibold animate-fade-in-down">
            {feedback}
          </div>
        )}
      </div>

      {/* ÁREA SUPERIOR: Formulário de Cadastro (Barra Horizontal) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-600 p-1.5 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </span>
          Novo Item
        </h2>
        
        <form onSubmit={addProduct} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Campo Descrição - Ocupa metade da linha no desktop */}
          <div className="md:col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Ex: Consultoria Técnica"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          
          {/* Campo Valor - Ocupa 3 colunas no desktop */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="0,00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          {/* Botão - Ocupa o restante */}
          <div className="md:col-span-3">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors shadow flex justify-center items-center gap-2 h-[46px]" // Altura fixa para alinhar com inputs
            >
              <span>Adicionar</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* ÁREA INFERIOR: Listagem dos Produtos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {products.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-block p-4 rounded-full bg-gray-100 text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            </div>
            <p className="text-gray-500 font-medium">Nenhum produto cadastrado.</p>
            <p className="text-sm text-gray-400">Utilize o formulário acima para adicionar itens.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase font-semibold">
              <tr>
                <th className="p-4 pl-6">Descrição</th>
                <th className="p-4 text-right">Valor Unitário</th>
                <th className="p-4 text-center w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4 pl-6 font-medium text-gray-800">{product.name}</td>
                  <td className="p-4 text-right font-mono text-gray-600">
                    {product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                      title="Excluir item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}