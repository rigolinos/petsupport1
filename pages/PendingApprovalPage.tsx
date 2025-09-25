
import React from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

const PendingApprovalPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto bg-white p-12 rounded-lg shadow-lg">
        <Clock size={64} className="text-yellow-500 mb-4" />
        <h1 className="text-3xl font-bold text-gray-800">Cadastro em Análise</h1>
        <p className="text-lg text-gray-600 mt-4">
            Obrigado por cadastrar sua ONG na PetConnect!
        </p>
        <p className="text-md text-gray-600 mt-2">
            Seu perfil está sendo analisado por nossa equipe. Você receberá uma notificação por e-mail assim que o processo for concluído. Isso geralmente leva até 48 horas.
        </p>
        <Link to="/" className="mt-8 bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors">
            Voltar para a Página Inicial
        </Link>
    </div>
  );
};

export default PendingApprovalPage;
