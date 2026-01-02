import React from "react";

export default function SupportButton() {
  // Seu número atualizado (Formato internacional: 55 + DDD + Numero)
  const whatsappNumber = "5514998469800"; 
  const message = encodeURIComponent("Olá! Preciso de ajuda com o UltraOrça.");

  return (
    <a
      href={`https://wa.me/${whatsappNumber}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full shadow-lg transition-all hover:-translate-y-1 group"
      title="Falar com Suporte"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-8.683-2.031-.967-.272-.297-.471-.445-.446-.149.025.297.074.495.124.868.521 1.485 1.486 1.955 2.153.396.57.891 1.139 1.436 1.955.446.669.595.892.817.892 1.04.0 1.979-.371 2.647-1.336l.272-.421c.074-.124.322-.05.595.074.272.124 1.758.868 2.056 1.016.297.149.495.223.57.347.074.124.074.718-.198 1.016-.272.297-1.584 1.436-3.861 1.386-2.005-.049-3.415-1.163-3.663-1.411-.247-.247-2.327-2.92-2.327-5.865 0-2.921 1.609-4.307 1.93-4.653.297-.347.742-.421 1.089-.421.346 0 .693.001.99.001.297 0 .594.124.841.718.247.594.841 2.153.916 2.327z"/>
      </svg>
      <span className="font-semibold hidden group-hover:block transition-all text-sm">
        Suporte
      </span>
    </a>
  );
}