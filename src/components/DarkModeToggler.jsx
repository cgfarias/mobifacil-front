

import React from 'react';
import { useDarkMode } from '../context/ThemeContext';
import { Moon, Sun } from "lucide-react";


const DarkModeToggler = () => {
    const { darkMode, setDarkMode } = useDarkMode();
    
    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };
    
    return (
        <button
        onClick={toggleDarkMode}
        className={`
            w-14 h-7 flex items-center rounded-full p-1 cursor-pointer
            transition-colors duration-300 ease-in-out
            ${darkMode ? 'bg-gray-600' : 'bg-yellow-500'}
            `}
            aria-pressed={darkMode} // Para acessibilidade
            role="switch"          // Para acessibilidade
            >
            {/* Knob do Toggle */}
            <div
                className={`
                    bg-blue-50 w-5 h-5 rounded-full shadow-md transform
                    transition-transform duration-300 ease-in-out
                    ${darkMode ? 'translate-x-7 bg-gray-800' : 'translate-x-0 bg-yellow-700'}
                    `}
                    >
                {/* Opcional: Ícones dentro do knob, se desejar */}
                {/* <span className="text-xs">{darkMode ? '🌙' : '☀️'}</span> */}
                {/* <span className="text-xs">{darkMode ? <Moon size={16} /> : <Sun size={16} />}</span> */}
                <span className="text-xs">{darkMode ? '🌑' : '☀️'}</span>
                {/* <span className="text-xs">{darkMode ? '🌚' : '🌤️'}</span> */}
            </div>
        </button>
    );
};

export default DarkModeToggler;









// import React, { useState } from 'react';
// import { useDarkMode } from '../context/ThemeContext';

// const DarkModeToggler = () => {

//     const {darkMode, setDarkMode} = useDarkMode();

//     return (
//         <button onClick={() => setDarkMode(!darkMode)} className='px-2 py-1 bg-gray-200 rounded-md transition-all dark:text-gray-900'>
//             { darkMode ? '🌚' : '🌤️'}
//         </button>
//     )
// }
// export default DarkModeToggler