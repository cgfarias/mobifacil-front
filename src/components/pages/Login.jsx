import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useDarkMode } from "../../context/ThemeContext";
import API from "../../api/axios";
import { Loader2, Moon, Sun, Eye, EyeOff } from "lucide-react";

// ===== SPLASH SCREEN ANIMADA =====
const SplashScreen = ({ darkMode }) => {
  const [carPosition, setCarPosition] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const carTimer = setTimeout(() => setCarPosition(true), 300);
    const fadeTimer = setTimeout(() => setFadeOut(true), 3000);
    
    return () => {
      clearTimeout(carTimer);
      clearTimeout(fadeTimer);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        zIndex: 50,
        transition: 'opacity 700ms',
        opacity: fadeOut ? 0 : 1,
        background: darkMode 
          ? 'linear-gradient(to bottom right, #0f172a, #1e3a8a, #0f172a)'
          : 'linear-gradient(to bottom right, #dbeafe, #bae6fd, #dbeafe)'
      }}
    >
      {/* Estrada no fundo */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: '160px',
          backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.4)' : 'rgba(203, 213, 225, 0.4)'
        }}
      >
        <div style={{
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '100%',
          height: '4px',
          borderTop: '4px dashed #facc15',
          opacity: 0.6
        }}></div>
      </div>

      {/* Conteúdo central */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
        <h1
          style={{
            fontSize: 'clamp(3rem, 8vw, 4rem)',
            fontWeight: 'bold',
            letterSpacing: '0.05em',
            marginBottom: '1rem',
            transition: 'all 700ms',
            transform: fadeOut ? 'scale(1.1)' : 'scale(1)',
            opacity: fadeOut ? 0 : 1,
            color: darkMode ? '#60a5fa' : '#1d4ed8'
          }}
        >
          MobiFácil
        </h1>
        <p
          style={{
            fontSize: 'clamp(1rem, 3vw, 1.25rem)',
            fontStyle: 'italic',
            transition: 'all 700ms 100ms',
            transform: fadeOut ? 'translateY(1rem)' : 'translateY(0)',
            opacity: fadeOut ? 0 : 1,
            color: darkMode ? '#cbd5e1' : '#334155'
          }}
        >
          Simplificando o transporte
        </p>
      </div>

      {/* Carro animado */}
      <div
        style={{
          position: 'absolute',
          bottom: '6rem',
          transition: 'transform 7000ms ease-out',
          transform: carPosition ? 'translateX(150vw)' : 'translateX(-1080px)'
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 180 64"
          fill="none"
          style={{ width: '180px', height: '80px', filter: 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.5))' }}
        >
          {/* Faróis acesos - luz frontal */}
          <defs>
            <radialGradient id="headlight-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#FDE047" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#FDE047" stopOpacity="0" />
            </radialGradient>
          </defs>
          
          {/* Feixe de luz do farol direito (frente do carro) */}
          <ellipse cx="155" cy="35" rx="45" ry="12" fill="url(#headlight-glow)" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.5;0.7" dur="2s" repeatCount="indefinite" />
          </ellipse>
          
          {/* Corpo do carro */}
          <rect x="10" y="25" width="108" height="20" rx="4" fill="#2563EB" />
          <path d="M20 25 L40 10 H88 L108 25 Z" fill="#3B82F6" stroke="#1E40AF" strokeWidth="1.5" />
          
          {/* Janelas */}
          <rect x="42" y="13" width="18" height="10" rx="1" fill="#E0F2FE" opacity="0.95" />
          <rect x="64" y="13" width="18" height="10" rx="1" fill="#E0F2FE" opacity="0.95" />
          
          {/* Farol traseiro (pequeno e vermelho) */}
          <circle cx="16" cy="35" r="2.5" fill="#EF4444" opacity="0.8" />
          
          {/* Farol dianteiro (maior e amarelo brilhante) */}
          <circle cx="112" cy="35" r="4.5" fill="#FBBF24">
            <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="112" cy="35" r="3" fill="#FEF08A" />
          
          {/* Detalhe lateral */}
          <line x1="10" y1="35" x2="118" y2="35" stroke="#1E40AF" strokeWidth="1" opacity="0.5" />
          
          {/* Rodas */}
          <circle cx="32" cy="47" r="7" fill="#1F2937" />
          <circle cx="32" cy="47" r="4" fill="#374151" />
          <circle cx="96" cy="47" r="7" fill="#1F2937" />
          <circle cx="96" cy="47" r="4" fill="#374151" />
          
          {/* Reflexos nas rodas */}
          <circle cx="30" cy="45" r="2" fill="#6B7280" opacity="0.6" />
          <circle cx="94" cy="45" r="2" fill="#6B7280" opacity="0.6" />
        </svg>
      </div>
    </div>
  );
};

// ===== LOGIN =====
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useDarkMode();
  
  const [credentials, setCredentials] = useState({ nickname: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lastUser, setLastUser] = useState(null);
  const [animate, setAnimate] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Tema controlado globalmente pelo ThemeContext
  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
      setAnimate(true);
    }, 3500);
    return () => clearTimeout(splashTimer);
  }, []);

  // // Toast de sessão expirada vindo de logout automático
  // useEffect(() => {
  //   const expired = localStorage.getItem("expiredSession");

  //   if (expired === "true") {
  //     // Exibe imediatamente, mesmo com splash
  //     import("../../utils/showToast").then(({ showToast }) => {
  //       showToast("Sua sessão expirou. Faça login novamente.", "error");
  //     });

  //     // Limpa a flag para evitar repetição
  //     localStorage.removeItem("expiredSession");
  //   }
  // }, []);


  useEffect(() => {
    const authData = localStorage.getItem("authData");
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed?.user_data?.nickname || parsed?.user_data?.name) {
          setLastUser(parsed.user_data.nickname || parsed.user_data.name);
        }
      } catch {
        console.warn("Erro ao ler usuário salvo.");
      }
    }
  }, []);


  // Exibir toast SOMENTE após splash + animação + estabilizar a UI
  useEffect(() => {
    if (!showSplash && animate) {
      const expired = localStorage.getItem("expiredSession");

      if (expired === "true") {
        // Aguarda a tela estabilizar antes de mostrar
        const timer = setTimeout(() => {
          import("../../utils/showToast").then(({ showToast }) => {
            showToast("Sua sessão expirou. Faça login novamente.", "error");
          });

          localStorage.removeItem("expiredSession");
        }, 350); // delay perfeito para UI suave

        return () => clearTimeout(timer);
      }
    }
  }, [showSplash, animate]);





  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await API.post("/auth/me/", credentials, {
        headers: { "Content-Type": "application/json" },
      });
      const data = response?.data;
      if (!data || !data.user_data || !data.user_access_level_data) {
        setError(data?.message || "Usuário ou senha incorretos.");
        setLoading(false);
        return;
      }
      const userData = {
        ...data.user_data,
        role: data.user_access_level_data.role,
        token: data.user_access_level_data.user_access_token,
      };
      login(userData);

      const redirectPath = (() => {
        if (userData.role === "admin") return "/";
        if (userData.role === "moderator") return "/home";
        if (userData.role === "voucher") return "/voucher";
        return "/schedule-event";
      })();

      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (showSplash) return <SplashScreen darkMode={darkMode} />;

  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{
      background: darkMode 
        ? 'linear-gradient(to bottom right, #0f172a, #1e3a8a, #0f172a)'
        : 'linear-gradient(to bottom right, #eff6ff, #e0f2fe, #dbeafe)',
      transition: 'background 500ms'
    }}>
      {/* Toggle Tema */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="absolute top-6 right-6 p-3 rounded-full transition-all duration-300 shadow-lg"
        style={{
          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
          color: darkMode ? '#cbd5e1' : '#334155',
          border: darkMode ? 'none' : '1px solid #cbd5e1'
        }}
      >
        {darkMode ? <Sun size={20} className="cursor-pointer" /> : <Moon size={20} className="cursor-pointer" />}
      </button>

      {/* Card principal */}
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl border p-10"
        style={{
          backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: darkMode ? '#334155' : '#e2e8f0',
          backdropFilter: 'blur(12px)',
          transition: 'all 700ms',
          transform: animate ? 'translateY(0) scale(1)' : 'translateY(2rem) scale(0.95)',
          opacity: animate ? 1 : 0
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-8" style={{
          transition: 'all 700ms 100ms',
          transform: animate ? 'translateY(0)' : 'translateY(-1rem)',
          opacity: animate ? 1 : 0
        }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 128 128"
            width="90"
            height="90"
            fill={darkMode ? '#60a5fa' : '#2563eb'}
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
          >
            <circle cx="64" cy="64" r="58" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.2" />
            <path d="M40 70 L50 45 H78 L88 70 Z" />
            <circle cx="50" cy="76" r="4" fill="white" />
            <circle cx="78" cy="76" r="4" fill="white" />
            <path d="M46 58 H82" stroke="white" strokeWidth="2" opacity="0.9" />
            <path d="M35 85 Q64 100 93 85" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
          </svg>
        </div>

        <h2 className="text-3xl font-bold text-center mb-2" style={{
          color: darkMode ? '#ffffff' : '#1e293b',
          transition: 'all 700ms 200ms',
          opacity: animate ? 1 : 0
        }}>
          {lastUser ? `Bem-vindo de volta, ${lastUser}! 👋` : "Bem-vindo 👋"}
        </h2>
        
        <p className="text-center mb-8 text-sm" style={{
          color: darkMode ? '#94a3b8' : '#475569',
          transition: 'all 700ms 300ms',
          opacity: animate ? 1 : 0
        }}>
          Faça login para continuar
        </p>

        {error && (
          <div className="text-white text-center p-3 rounded-lg mb-5 shadow-md text-sm" style={{
            backgroundColor: 'rgba(239, 68, 68, 0.9)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium" style={{
              color: darkMode ? '#cbd5e1' : '#334155'
            }}>
              Usuário de rede
            </label>
            <input
              type="text"
              value={credentials.nickname}
              onChange={(e) => setCredentials({ ...credentials, nickname: e.target.value })}
              required
              placeholder="Digite seu usuário de rede"
              className="w-full p-3 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                borderColor: darkMode ? '#334155' : '#cbd5e1',
                color: darkMode ? '#e2e8f0' : '#1e293b'
              }}
            />
          </div>

          <div className="relative mb-6">
            <label className="block mb-2 text-sm font-medium" style={{
              color: darkMode ? '#cbd5e1' : '#334155'
            }}>
              Senha de rede
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
              placeholder="Digite sua senha de rede"
              className="w-full p-3 pr-11 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                borderColor: darkMode ? '#334155' : '#cbd5e1',
                color: darkMode ? '#e2e8f0' : '#1e293b'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 transition-colors"
              style={{ top: '42px', color: '#94a3b8' }}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} className="cursor-pointer" /> : <Eye size={20} className="cursor-pointer" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-lg font-semibold text-base shadow-lg text-white disabled:opacity-60 cursor-pointer"
            style={{
              backgroundColor: darkMode ? '#2563eb' : '#1e40af',
              transition: 'all 300ms'
            }}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        <div className="mt-10 text-center text-xs" style={{
          color: darkMode ? '#64748b' : '#94a3b8'
        }}>
          © {new Date().getFullYear()} MobiFácil — Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}