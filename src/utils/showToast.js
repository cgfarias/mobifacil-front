export function showToast(message, type = "info") {
    const old = document.getElementById("mf-toast");
    if (old) old.remove();
  
    // 🌓 Detecta tema pelo localStorage ou pelo HTML
    let themeLS = localStorage.getItem("theme"); // "dark" ou "light"
  
    const dark =
      themeLS === "dark"
        ? true
        : themeLS === "light"
        ? false
        : document.documentElement.classList.contains("dark");
  
    const colors = {
      info: dark ? "text-blue-300" : "text-blue-600",
      success: dark ? "text-green-300" : "text-green-700",
      error: dark ? "text-red-300" : "text-red-600",
      warn: dark ? "text-yellow-300" : "text-yellow-600",
    };
  
    const bg = dark
      ? "bg-gray-800 border border-gray-700 shadow-2xl"
      : "bg-white border border-gray-200 shadow-xl";
  
    // container
    const toast = document.createElement("div");
    toast.id = "mf-toast";
  
    toast.innerHTML = `
      <div class="
        px-6 py-4 rounded-xl
        flex items-center gap-3
        text-sm font-medium
        ${bg}
        backdrop-blur-sm
        animate-toastSlide
      ">
        <span class="${colors[type]}">${message}</span>
      </div>
    `;
  
    toast.className = `
      fixed top-6 left-1/2 -translate-x-1/2
      z-[99999]
      transition-all duration-500
      opacity-0
    `;
  
    document.body.appendChild(toast);
  
    // 🔥 Fade-in
    setTimeout(() => {
      toast.classList.add("opacity-100");
    }, 10);
  
    // 🕒 Fade-out automático
    setTimeout(() => {
      toast.classList.remove("opacity-100");
      setTimeout(() => toast.remove(), 500);
    }, 3500);
  
    // 🔧 Keyframes
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes toastSlide {
        0% { opacity: 0; transform: translate(-50%, -20px); }
        50% { opacity: 1; transform: translate(-50%, 3px); }
        100% { opacity: 1; transform: translate(-50%, 0); }
      }
      .animate-toastSlide {
        animation: toastSlide .55s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
  }
  













// export function showToast(message, type = "info") {
//     const old = document.getElementById("mf-toast");
//     if (old) old.remove();
  
//     const dark = document.documentElement.classList.contains("dark");
  
//     const colors = {
//       info: dark ? "text-blue-300" : "text-blue-600",
//       success: dark ? "text-green-300" : "text-green-700",
//       error: dark ? "text-red-300" : "text-red-600",
//       warn: dark ? "text-yellow-300" : "text-yellow-600",
//     };
  
//     const bg = dark
//       ? "bg-gray-800 border border-gray-700 shadow-2xl"
//       : "bg-white border border-gray-200 shadow-xl";
  
//     // container
//     const toast = document.createElement("div");
//     toast.id = "mf-toast";
  
//     toast.innerHTML = `
//       <div class="
//         px-6 py-4 rounded-xl
//         flex items-center gap-3
//         text-sm font-medium
//         ${bg}
//         backdrop-blur-sm
//         animate-toastSlide
//       ">
//         <span class="${colors[type]}">${message}</span>
//       </div>
//     `;
  
//     toast.className = `
//       fixed top-6 left-1/2 -translate-x-1/2
//       z-[99999]
//       transition-all duration-500
//       opacity-0
//     `;
  
//     document.body.appendChild(toast);
  
//     // 🔥 Fade-in
//     setTimeout(() => {
//       toast.classList.add("opacity-100");
//     }, 10);
  
//     // 🕒 Fade-out automático
//     setTimeout(() => {
//       toast.classList.remove("opacity-100");
//       setTimeout(() => toast.remove(), 500);
//     }, 3500);
  
//     // 🔧 Keyframes
//     const style = document.createElement("style");
//     style.innerHTML = `
//       @keyframes toastSlide {
//         0% { opacity: 0; transform: translate(-50%, -20px); }
//         50% { opacity: 1; transform: translate(-50%, 3px); }
//         100% { opacity: 1; transform: translate(-50%, 0); }
//       }
//       .animate-toastSlide {
//         animation: toastSlide .55s ease-out forwards;
//       }
//     `;
//     document.head.appendChild(style);
//   }
  
  
  
  
  
  
  








// // src/utils/showToast.js
// export function showToast(message, type = "info") {
//     if (document.getElementById("toast")) return; // Evita duplicar
  
//     const colors = {
//       info: "bg-blue-500",
//       success: "bg-green-500",
//       error: "bg-red-500",
//     };
  
//     const toast = document.createElement("div");
//     toast.id = "toast";
//     toast.textContent = message;
//     toast.className = `fixed top-5 right-5 z-50 text-white ${colors[type]} px-4 py-3 rounded-lg shadow-md text-sm transition-all duration-500`;
//     document.body.appendChild(toast);
  
//     setTimeout(() => toast.remove(), 3000);
//   }