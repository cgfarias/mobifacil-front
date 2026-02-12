// import { StrictMode } from 'react';
// import { createRoot } from 'react-dom/client';
// import './index.css';
// import App from './App.jsx';

// import { AuthProvider } from './context/AuthContext'; // ajuste o caminho se necessário
// import { BrowserRouter } from 'react-router-dom';

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <AuthProvider>
//       <BrowserRouter>
//         <App />
//       </BrowserRouter>
//     </AuthProvider>
//   </StrictMode>,
// );





import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)






// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )