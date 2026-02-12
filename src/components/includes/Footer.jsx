import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-blue-50 text-gray-700 py-8 px-4 dark:bg-gray-700">
      <div className="">

        {/* Direitos Autorais */}
        <div className="border-gray-700 pt-4 text-center text-gray-500 dark:text-blue-200">
          <p>&copy; 2024 - {new Date().getFullYear()} Cehab PE. Todos os direitos reservados.</p>
          <p>Desenvolvido por: NDI - Núcleo de Desenvolvimento de Inovação</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;