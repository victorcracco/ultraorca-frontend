import React from "react";
import { Helmet } from "react-helmet-async";

export default function Tutorials() {
  const tutorials = [
    {
      id: 1,
      title: "Como criar seu primeiro orçamento",
      duration: "2 min",
      videoId: "EXEMPLO_ID_YOUTUBE_1", 
      desc: "Passo a passo completo desde o cadastro do cliente até a geração do PDF.",
    },
    {
      id: 2,
      title: "Cadastrando produtos e serviços",
      duration: "1 min",
      videoId: "EXEMPLO_ID_YOUTUBE_2",
      desc: "Ganhe tempo! Aprenda a deixar seus preços salvos para usar sempre.",
    },
    {
      id: 3,
      title: "Enviando pelo WhatsApp",
      duration: "45 seg",
      videoId: "EXEMPLO_ID_YOUTUBE_3",
      desc: "A forma correta de baixar e compartilhar o PDF com seu cliente.",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Helmet>
        <title>Tutoriais | UltraOrça</title>
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Central de Ajuda</h1>
        <p className="text-gray-500 mt-2">Aprenda a usar o UltraOrça ao máximo em poucos minutos.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tutorials.map((video) => (
          <div key={video.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-video bg-gray-100 relative group">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${video.videoId}`}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800 text-lg leading-tight">{video.title}</h3>
                <span className="text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-1 rounded">
                  {video.duration}
                </span>
              </div>
              <p className="text-gray-600 text-sm">{video.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-blue-50 rounded-xl p-8 text-center border border-blue-100">
        <h3 className="text-xl font-bold text-blue-800 mb-2">Ainda com dúvidas?</h3>
        <p className="text-blue-600 mb-6">Nosso time de suporte está pronto para te ajudar no WhatsApp.</p>
        <a 
          href="https://wa.me/5514998469800" 
          target="_blank"
          rel="noopener noreferrer" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
        >
          Falar com Suporte Humano
        </a>
      </div>
    </div>
  );
}