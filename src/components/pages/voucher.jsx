import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  CircleArrowLeft,
  ThumbsUp,
  ArrowLeftCircle,
  XCircle,
  ArrowLeftFromLine,
  Loader2,
  Copy
} from "lucide-react";
import { Link } from "react-router-dom";
import Sidebar from "../includes/Sidebar";
import NavBar from "../includes/NavBar";
import Footer from "../includes/Footer";
import api from "../../api/axios";
import { useDarkMode } from "../../context/ThemeContext";

// === Funções utilitárias ===
const maskPhone = (value) => {
  const digits = (value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  if (digits.length === 9) return digits.replace(/(\d{5})(\d{4})/, "$1-$2");
  return digits;
};

const pickFieldFrom = (source, paths) => {
  if (!source) return "";
  for (const path of paths) {
    const segments = Array.isArray(path) ? path : [path];
    let value = source;
    for (const segment of segments) {
      if (value == null) break;
      value = value[segment];
    }
    if (value !== undefined && value !== null) {
      const str = String(value).trim();
      if (str) return str;
    }
  }
  return "";
};

const extractContact = (event) => {
  const ownerPassenger =
    Array.isArray(event?.passengers) && event.passengers.length > 0
      ? event.passengers.find((p) => p?.is_owner) || event.passengers[0]
      : null;

  const name =
    pickFieldFrom(event, [
      ["owner_social_name"],
      ["owner_name"],
      ["owner", "name"],
      ["owner", "user_fullname"],
      ["owner_user", "user_nickname"],
      ["owner_user", "user_fullname"],
      ["request_user", "user_nickname"],
      ["request_user", "user_fullname"],
      ["requester", "name"],
      ["requester", "fullname"],
      ["user", "user_fullname"],
      ["user", "name"],
      ["user_fullname"],
      ["user_name"],
      ["responsible_name"],
    ]) ||
    pickFieldFrom(ownerPassenger, [
      ["user_nickname"],
      ["nickname"],
      ["full_name"],
      ["name"],
    ]) ||
    (event?.code ? `Responsável ${event.code}` : "Não informado");

  const email =
    pickFieldFrom(event, [
      ["owner_email"],
      ["contact_email"],
      ["user_email"],
      ["owner", "email"],
      ["owner_user", "user_email"],
      ["request_user", "user_email"],
      ["requester", "email"],
      ["user", "user_email"],
      ["email"],
    ]) ||
    pickFieldFrom(ownerPassenger, [["email"], ["user_email"], ["contact_email"]]);

  const phone =
    pickFieldFrom(event, [
      ["owner_phone"],
      ["contact_phone"],
      ["user_phone"],
      ["phone_contact"],
      ["owner", "phone"],
      ["owner", "user_phone"],
      ["owner_user", "phone"],
      ["owner_user", "user_phone"],
      ["request_user", "phone"],
      ["request_user", "whatsapp"],
      ["requester", "phone"],
      ["requester", "whatsapp"],
      ["phone"],
      ["whatsapp"],
    ]) ||
    pickFieldFrom(ownerPassenger, [["phone"], ["whatsapp"], ["contact_phone"]]);

  return {
    name: name || "Não informado",
    email: email || "",
    phone: phone || "",
  };
};

// === Função para obter o status do voucher ===
const getVoucherStatus = (event) => {
  const startStatus = event?.voucher_start || "pending";
  const endStatus = event?.voucher_end || "pending";
  const canShowActions = startStatus === "pending" || endStatus === "pending";
  return {
    start: startStatus,
    end: endStatus,
    canShowActions,
    hasStart: true,
    hasEnd: true,
  };
};

// === Componente de Badge de Status ===
const StatusBadge = ({ status, type }) => {
  const getStatusConfig = () => {
    if (status === "generated") {
      return {
        bg: "bg-green-100 dark:bg-green-100",
        text: "text-green-700 dark:text-green-700",
        icon: "✓",
        label: "Gerado",
      };
    }

    if (status === "denied") {
      return {
        bg: "bg-red-100 dark:bg-red-100",
        text: "text-red-700 dark:text-red-700",
        icon: "✗",
        label: "Negado",
      };
    }

    return {
      bg: "bg-yellow-100 dark:bg-yellow-100",
      text: "text-yellow-700 dark:text-yellow-700",
      icon: "⏳",
      label: "Pendente",
    };
  };

  const config = getStatusConfig();
  const typeLabel = type === "start" ? "Ida" : "Retorno";

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.icon} {typeLabel}: {config.label}
    </span>
  );
};

// === Componente principal ===
function VoucherPage() {
  const { darkMode } = useDarkMode();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [processing, setProcessing] = useState(false);

  // const [copied, setCopied] = useState("");
  const [toast, setToast] = useState({ show: false, message: "" });


  const [confirmModal, setConfirmModal] = useState({
    show: false,
    action: null,
    eventId: null,
    title: "",
    message: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // === FETCH EVENTS COM FILTRO DE VOUCHERS !== NULL ===
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/events/get");
      const list = Array.isArray(response.data?.events) ? response.data.events : [];

      // ✅ Filtro: apenas eventos com voucher_start ou voucher_end diferentes de null
      const filteredList = list.filter(
        (e) => e.voucher_start !== null || e.voucher_end !== null
      );

      setEvents(filteredList);

      // 🧾 Log colorido no console
      // console.groupCollapsed("%c[VOUCHER FETCH]", "color:#3b82f6;font-weight:bold;");
      // console.log("📦 Total de eventos recebidos:", list.length);
      // console.log("🎟️ Eventos com status de voucher:", filteredList.length);
      // console.log("📅 Atualizado em:", new Date().toLocaleString());
      // console.groupEnd();
    } catch (err) {
      console.error("❌ Erro ao carregar vouchers:", err);
      setError("Não foi possível carregar os dados de vouchers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // === Execução da ação ===
  const executeAction = async () => {
    if (!confirmModal.eventId || !confirmModal.action) return;
    setProcessing(true);
    try {
      const { eventId, action } = confirmModal;
      const url =
        action.type === "approve"
          ? `/voucher/${eventId}/approve`
          : `/voucher/${eventId}/deny`;

      let payload = {};
      if (action.type === "approve") {
        payload = {
          approve_start: !!action.approve_start,
          approve_end: !!action.approve_end,
        };
      } else {
        payload = {
          deny_start: !!action.deny_start,
          deny_end: !!action.deny_end,
        };
      }

      console.groupCollapsed(
        `%c[VoucherAction] ${action.type === "approve" ? "APROVAÇÃO" : "NEGAÇÃO"} - Evento ${eventId}`,
        "color:#3b82f6;font-weight:bold;"
      );
      console.log("🔗 Endpoint:", `${api.defaults.baseURL}${url}`);
      console.log("📦 Método:", "PUT");
      console.log("🧾 Payload Enviado:", payload);
      console.groupEnd();

      const response = await api.put(url, payload);

      console.groupCollapsed("%c[VoucherAction Response]", "color:#22c55e;font-weight:bold;");
      console.log("✅ Status:", response.status);
      console.log("📨 Data Recebida:", response.data);
      console.groupEnd();

      await fetchEvents();
    } catch (err) {
      console.groupCollapsed("%c[VoucherAction Error]", "color:#ef4444;font-weight:bold;");
      console.error("❌ Erro ao executar ação:", err);
      if (err.response) {
        console.error("🔻 Status Code:", err.response.status);
        console.error("🔻 Response Data:", err.response.data);
      }
      console.groupEnd();
    } finally {
      setProcessing(false);
      setConfirmModal({
        show: false,
        action: null,
        eventId: null,
        title: "",
        message: "",
      });
    }
  };

  const openConfirm = (event, type, isStart, isEnd) => {
    const action =
      type === "approve"
        ? { type, approve_start: isStart, approve_end: isEnd }
        : { type, deny_start: isStart, deny_end: isEnd };

    const actionName =
      type === "approve"
        ? isStart
          ? "Aprovar IDA"
          : "Aprovar Retorno"
        : isStart
        ? "Negar IDA"
        : "Negar Retorno";

    const responsible = extractContact(event).name;
    const destiny = event.destiny?.name || "Destino não informado";

    setConfirmModal({
      show: true,
      action,
      eventId: event.id,
      title: `${actionName}`,
      message: `Deseja realmente ${actionName.toLowerCase()} do voucher de ${responsible} para ${destiny}?`,
    });
  };

  // === Filtro e paginação ===
  const eventRows = useMemo(
    () =>
      events.map((event) => ({
        event,
        contact: extractContact(event),
        status: getVoucherStatus(event),
      })),
    [events]
  );

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return eventRows;
    return eventRows.filter(({ event, contact }) => {
      const values = [
        contact.name,
        contact.email,
        contact.phone,
        event.destiny?.name,
        event.destiny?.sector,
        event.sector,
        event.setor,
        event.code,
        event.date_start,
      ];
      return values.some((value) =>
        (value || "").toString().toLowerCase().includes(term)
      );
    });
  }, [eventRows, searchTerm]);

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRows = filteredRows.slice(startIndex, endIndex);
  useEffect(() => setCurrentPage(1), [searchTerm]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // const copyToClipboard = (text) => {
  //   navigator.clipboard.writeText(text);
  //   setCopied(text);
  //   setTimeout(() => setCopied(""), 1500); // reseta feedback
  // };

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: "" });
    }, 1500);
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Copiado para a área de transferência!");
  };

  


  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <NavBar />

        {/* === TOAST GLOBAL === */}
        {toast.show && (
          <div className="fixed bottom-6 mb-8 left-1/2 -translate-x-1/2 z-[9999]">
            <div className="px-4 py-3 bg-green-600 text-white rounded-lg shadow-lg animate-slide-down">
              {toast.message}
            </div>
          </div>
        )}



        {/* === Modal de confirmação === */}
        {confirmModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div
              className={`relative rounded-xl p-6 shadow-lg w-96 ${
                darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"
              }`}
            >
              <h3 className="text-lg font-semibold mb-2">{confirmModal.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                {confirmModal.message}
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() =>
                    setConfirmModal({
                      show: false,
                      action: null,
                      eventId: null,
                      title: "",
                      message: "",
                    })
                  }
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 transition-all"
                  disabled={processing}
                >
                  Cancelar
                </button>

                <button
                  onClick={executeAction}
                  disabled={processing}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all inline-flex items-center gap-2"
                >
                  {processing ? <Loader2 className="animate-spin" size={16} /> : null}
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === Conteúdo principal === */}
        <div className="min-h-screen bg-blue-50 text-gray-700 dark:bg-gray-700 dark:text-white">
          <div className="bg-blue-100 text-blue-700 dark:bg-gray-600 dark:text-blue-100 px-6 py-6 shadow-sm flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-100 dark:hover:text-blue-400 hover:text-blue-800 transition-colors duration-200"
            >
              <CircleArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-semibold">Listando Vouchers</h1>
          </div>

          {/* 🔍 Filtros e Busca */}
          <div className="p-6">
            <div className="bg-[#f7f9fc] dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center flex-wrap gap-4">
                {/* Controle de quantidade */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-blue-50">Mostrar</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm dark:text-blue-600"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm font-medium text-gray-700 dark:text-blue-50">registros</span>
                </div>

                {/* Campo de busca + botão recarregar */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-blue-50">Buscar:</span>
                  <div className="relative flex items-center">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm dark:text-blue-600"
                      placeholder="Digite para buscar..."
                    />
                    <button
                      onClick={fetchEvents}
                      disabled={processing}
                      className={`ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors duration-200 text-sm font-medium inline-flex items-center gap-2 ${
                        processing ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <RefreshCw size={16} />
                      Recarregar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 📋 Tabela */}
            <div className="bg-[#f7f9fc] dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-6">
              {loading ? (
                <div className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-300">
                  Carregando vouchers...
                </div>
              ) : error ? (
                <div className="px-6 py-12 text-center text-sm text-red-500">{error}</div>
              ) : currentRows.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Search size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 dark:text-blue-200 mb-2">
                      Nenhum voucher encontrado
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                      {searchTerm
                        ? `Não foi possível encontrar resultados para "${searchTerm}".`
                        : "Não há vouchers cadastrados no sistema."}
                    </p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="mt-4 px-4 py-2 bg-blue-500 text-gray-50 text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-300"
                      >
                        Limpar busca
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#f7f9fc] dark:bg-gray-800">
                        <th className="text-left px-6 py-5 text-sm font-bold uppercase text-gray-800 dark:text-blue-50">
                          Nome de Rede
                        </th>
                        <th className="text-left px-6 py-5 text-sm font-bold uppercase text-gray-800 dark:text-blue-50">
                          Contato
                        </th>
                        <th className="text-left px-6 py-5 text-sm font-bold uppercase text-gray-800 dark:text-blue-50">
                          Código do Evento
                        </th>
                        <th className="text-left px-6 py-5 text-sm font-bold uppercase text-gray-800 dark:text-blue-50">
                          Destino
                        </th>
                        <th className="text-left px-6 py-5 text-sm font-bold uppercase text-gray-800 dark:text-blue-50">
                          Início do Evento
                        </th>
                        <th className="text-left px-6 py-5 text-sm font-bold uppercase text-gray-800 dark:text-blue-50">
                          Setor
                        </th>
                        <th className="text-left px-6 py-5 text-sm font-bold uppercase text-gray-800 dark:text-blue-50">
                          Status
                        </th>
                        <th className="text-center px-6 py-5 text-sm font-bold uppercase text-gray-800 dark:text-blue-50">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRows.map(({ event, contact, status }) => (
                        <tr
                          key={event.id ?? `${event.code}-${event.date_start}`}
                          className="group dark:hover:bg-gray-900 hover:bg-blue-100 transition-all duration-300 ease-in-out hover:shadow-sm transform"
                        >
                          <td className="px-6 py-5 font-semibold text-sm text-gray-500 dark:text-blue-100">
                            {contact.name}
                          </td>

                          <td className="px-6 py-5 text-sm text-gray-600 dark:text-blue-100 font-medium">

  {/* EMAIL + botão copiar */}
  <div className="flex items-center gap-2">
  <span className="text-gray-500 dark:text-blue-300 font-semibold">{contact.email || "Não informado"}</span>

    {contact.email && (
      <button
        onClick={() => copyToClipboard(contact.email)}
        className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer hover:scale-120 duration-200"
        title="Copiar e-mail"
      >
        <Copy size={14} />
      </button>
    )}
  </div>

  {/* TELEFONE */}
  <div className="flex items-center gap-2 mt-1">
    {event.tel_voucher_start ? (
      <>
        <span className="text-gray-500 dark:text-blue-300 font-semibold">
          {maskPhone(event.tel_voucher_start)} 
          {/* (Voucher IDA) */}
        </span>
        <button
          onClick={() => copyToClipboard(event.tel_voucher_start)}
          className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer hover:scale-110 duration-200"
          title="Copiar telefone"
        >
          <Copy size={14} />
        </button>
      </>
    ) : event.tel_voucher_end ? (
      <>
        <span className="text-blue-500 dark:text-blue-300 font-semibold">
          {maskPhone(event.tel_voucher_end)} 
          {/* (Voucher Retorno) */}
        </span>
        <button
          onClick={() => copyToClipboard(event.tel_voucher_end)}
          className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer hover:scale-110 duration-200"
          title="Copiar telefone"
        >
          <Copy size={14} />
        </button>
      </>
    ) : (
      <>
        <span className="text-gray-400">
          {maskPhone(contact.phone)}
        </span>
        <button
          onClick={() => copyToClipboard(contact.phone)}
          className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer hover:scale-110 duration-200"
          title="Copiar telefone"
        >
          <Copy size={14} />
        </button>
      </>
    )}
  </div>

</td>



                          <td className="text-sm text-gray-500 dark:text-blue-200 px-6 py-5 font-semibold ">
                            {event.code}
                          </td>

                          <td className="px-6 py-5 text-sm text-gray-500 dark:text-blue-200">
                            {event.destiny?.name || "Não informado"}
                          </td>

                          <td className="px-6 py-5 text-sm text-gray-500 dark:text-blue-200">{event.date_start || "Não informado"}</td>

                          <td className="px-6 py-5 text-sm text-gray-500 dark:text-blue-200">
                            {event.destiny?.sector ||
                              event.sector ||
                              event.setor ||
                              "Não informado"}
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-1">
                              <StatusBadge status={status.start} type="start" />
                              <StatusBadge status={status.end} type="end" />
                            </div>
                          </td>

                          {/* === ÍCONES DE AÇÃO === */}
                          <td className="px-6 py-5 text-center">
                            {status.canShowActions ? (
                              <div className="flex justify-center gap-3">
                                {/* ✅ Aprovar IDA - só aparece se status for pending */}
                                {status.start === "pending" && (
                                  <button
                                    onClick={() => openConfirm(event, "approve", true, false)}
                                    className="text-green-400 hover:text-green-500 hover:scale-110 transition-all duration-200"
                                    title="Aprovar IDA"
                                  >
                                    <ThumbsUp size={18} />
                                  </button>
                                )}

                                {/* ❌ Negar IDA - só aparece se status for pending */}
                                {status.start === "pending" && (
                                  <button
                                    onClick={() => openConfirm(event, "deny", true, false)}
                                    className="text-red-400 hover:text-red-500 hover:scale-110 transition-all duration-200"
                                    title="Negar IDA"
                                  >
                                    <XCircle size={18} />
                                  </button>
                                )}

                                {/* ✅ Aprovar RETORNO - só aparece se status for pending */}
                                {status.end === "pending" && (
                                  <button
                                    onClick={() => openConfirm(event, "approve", false, true)}
                                    className="text-green-400 hover:text-green-600 hover:scale-110 transition-all duration-200"
                                    title="Aprovar Retorno"
                                  >
                                    <ArrowLeftCircle size={18} />
                                  </button>
                                )}

                                {/* ❌ Negar RETORNO - só aparece se status for pending */}
                                {status.end === "pending" && (
                                  <button
                                    onClick={() => openConfirm(event, "deny", false, true)}
                                    className="text-red-400 hover:text-red-600 hover:scale-110 transition-all duration-200"
                                    title="Negar Retorno"
                                  >
                                    <ArrowLeftFromLine size={18} />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                Sem ações
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 📄 Paginação Inferior */}
            {!loading && !error && filteredRows.length > 0 && (
              <div className="bg-[#f7f9fc] dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-gray-600 dark:text-blue-50">
                    Exibindo de {startIndex + 1} à {Math.min(endIndex, filteredRows.length)} de {filteredRows.length} registros
                    {searchTerm && (
                      <span className="text-blue-500 dark:text-blue-300 ml-2">
                        (Filtrado de {events.length} registros)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 cursor-pointer text-sm font-medium border border-gray-200 rounded-lg hover:bg-blue-200 hover:text-blue-400 dark:hover:bg-gray-600 dark:text-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                    >
                      Anterior
                    </button>

                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 cursor-pointer text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm ${
                          currentPage === page
                            ? 'bg-blue-500 dark:bg-blue-400 text-white dark:text-blue-200 border border-blue-600 dark:border-blue-600'
                            : 'border border-gray-200 hover:bg-blue-200 hover:text-blue-400 dark:hover:bg-gray-600 dark:text-blue-200'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 cursor-pointer text-sm font-medium border border-gray-200 rounded-lg hover:bg-blue-200 hover:text-blue-400 dark:hover:bg-gray-600 dark:text-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default VoucherPage;