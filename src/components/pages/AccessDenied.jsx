import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';

const AccessDenied = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    if (user?.role === "comum") {
      navigate("/schedule-event");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <ShieldX className="mx-auto h-16 w-16 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Acesso Negado
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Você não tem permissão para acessar esta página com seu nível de usuário atual.
        </p>
        
        {user && (
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>Seu nível de acesso:</strong> {user.role}
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <button
            onClick={handleGoHome}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Home className="h-4 w-4" />
            Ir para página inicial
          </button>
          
          <button
            onClick={handleGoBack}
            className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
