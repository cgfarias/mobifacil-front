// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    // Padrão: light (sem respeitar prefers-color-scheme)
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useDarkMode = () => useContext(ThemeContext);















// import { createContext, useContext, useEffect, useState } from "react";

// const ThemeContext = createContext('light');

// export const ThemeProvider = ({children}) => {

//     const [darkMode, setDarkMode] = useState(
//         localStorage.getItem("theme") === "dark"
//     );

//     useEffect(() => {
//         if (darkMode) {
//             document.documentElement.classList.add("dark");
//             localStorage.setItem("theme", "dark")
//         } else {
//             document.documentElement.classList.remove("dark");
//             localStorage.setItem("theme", "light")
//         }
//     }, [darkMode])

//     return (
//         <ThemeContext.Provider value={{darkMode, setDarkMode}}>
//             {children}
//         </ThemeContext.Provider>
//     )
// }

// export const useDarkMode = () => useContext(ThemeContext)
