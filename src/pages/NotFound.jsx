import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-extrabold text-blue-600 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Página não encontrada</h1>
        <p className="text-gray-500 mb-8">
          O endereço que você acessou não existe ou foi removido.
        </p>
        <Link
          to="/app"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg"
        >
          Voltar ao Painel
        </Link>
      </div>
    </div>
  );
}
