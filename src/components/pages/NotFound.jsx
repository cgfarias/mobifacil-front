import Sidebar from "../includes/Sidebar";
import Footer from "../includes/Footer";
import { Link } from "react-router-dom";

import UserAvatar from "../user-avatar/UserAvatar";

function NotFound() {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar fixa à esquerda */}
            {/* <Sidebar /> */}
            
            {/* Container principal + footer à direita */}
            <div className="flex flex-col flex-1">
                {/* Conteúdo principal */}
                <div className="flex-1 bg-blue-50 text-gray-700 dark:bg-gray-700 dark:text-white p-6 flex flex-col items-center justify-center">
                    <h1 className="text-3xl font-bold mb-3">Página não encontrada - 404</h1>
                    <p>Clique no botão para voltar à página inicial</p>
                    
                    <div className="mt-5">
                        <Link to="/" className="bg-blue-500 text-white px-4 py-2 rounded-md">página inicial</Link>
                    </div>
                    
                </div>
                
                {/* Footer - agora só na área direita */}
                <Footer />
            </div>
        </div>
    )
}

export default NotFound;