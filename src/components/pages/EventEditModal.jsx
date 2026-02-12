import { useEffect, useState } from "react";
import { X, Calendar, FileText, MapPin, User, Crown, ShieldCheck } from "lucide-react";
import api from "../../api/axios";

const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

function EventEditModal({ isOpen, onClose, event, darkMode, onUpdated }) {
  const [show, setShow] = useState(false);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);

  // Destino
  const [destinies, setDestinies] = useState([]);
  const [destinyInput, setDestinyInput] = useState("");
  const [selectedDestinyId, setSelectedDestinyId] = useState(null);

  // Passageiros
  const [allPassengers, setAllPassengers] = useState([]);
  const [passengerInput, setPassengerInput] = useState("");
  const [filteredPassengers, setFilteredPassengers] = useState([]);
  const [editPassengers, setEditPassengers] = useState([]);
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);

  // Conversores de data
  const toInputDateTime = (str) => {
    if (!str) return "";
    if (str.includes("T")) return str.slice(0, 16);
    const [datePart, timePart] = String(str).split(" ");
    if (!datePart || !timePart) return "";
    const [yyyy, mm, dd] = datePart.includes("-")
      ? datePart.split("-")
      : datePart.split("/").reverse();
    const [HH, MM] = timePart.split(":");
    return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}T${String(
      HH
    ).padStart(2, "0")}:${String(MM).padStart(2, "0")}`;
  };

  const formatDateToApi = (value) => {
    if (!value || (typeof value === "string" && value.trim() === "")) {
      return "1900-01-01T00:00:00";
    }
    if (typeof value === "string") {
      if (value.includes("T")) {
        const [datePart, timeRaw] = value.split("T");
        const time = timeRaw?.length === 5 ? `${timeRaw}:00` : timeRaw || "00:00:00";
        return `${datePart}T${time}`;
      }
      if (value.includes(" ")) {
        const [datePart, timeRaw] = value.split(" ");
        const time = timeRaw?.length === 5 ? `${timeRaw}:00` : timeRaw || "00:00:00";
        return `${datePart}T${time}`;
      }
    }
    return value;
  };

  useEffect(() => setShow(isOpen), [isOpen]);

  useEffect(() => {
    if (!event) return;
    setDateStart(toInputDateTime(event.date_start) || "");
    setDateEnd(toInputDateTime(event.date_end) || "");
    setDetails(event.details || "");

    setDestinyInput(event.destiny?.name || "");
    setSelectedDestinyId(event.destiny?.id || null);

    const current = (event.passengers || []).map((p) => {
      const display = p.user_nickname || p.nickname || p.full_name || p.name || "Passageiro";
      return {
        id: p.id ?? p.user_id ?? p.passenger_id,
        user_nickname: display,
        nickname: display,
        full_name: display,
        name: display,
        avatar: p.avatar,
        email: p.email || p.user_email,
        is_owner: Boolean(p.is_owner),
      };
    });
    setEditPassengers(current);
  }, [event]);

  // Carrega dados
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [destRes, usersRes] = await Promise.all([
          api.get("/destiny/get"),
          api.get("/show-users/get"),
        ]);

        if (destRes.status === 200) {
          const list = (destRes.data.destiny_data || []).map((d) => ({
            id: d.destiny_id,
            name: d.destiny_name,
          }));
          setDestinies(list);
        }

        if (usersRes.status === 200) {
          const list = (usersRes.data.user_data || []).map((u) => ({
            id: u.user_id,
            user_nickname:
              u.user_nickname || u.user_socialname || u.user_fullname || "Usuário",
            name: u.user_nickname || u.user_socialname || u.user_fullname || "Usuário",
            avatar: u.user_avatar,
            email: u.user_email || u.email,
          }));
          setAllPassengers(list);
          setFilteredPassengers(list);
        }
      } catch (e) {
        console.warn("Falha ao carregar destinos/usuários", e);
      }
    };
    if (isOpen) loadOptions();
  }, [isOpen]);

  const handleDestinySelect = (value) => {
    setDestinyInput(value);
    const found = destinies.find((d) => d.name === value);
    setSelectedDestinyId(found ? found.id : null);
  };

  const handlePassengerInput = (value) => {
    setPassengerInput(value);
    setShowPassengerDropdown(Boolean(value));
    const term = value.toLowerCase();
    const filtered = allPassengers.filter(
      (p) => p.name.toLowerCase().includes(term) && !editPassengers.some((ep) => ep.id === p.id)
    );
    setFilteredPassengers(filtered);
  };

  const handlePassengerSelect = (user) => {
    if (!editPassengers.some((p) => p.id === user.id)) {
      const nick = user.user_nickname || user.name;
      setEditPassengers((prev) => [
        ...prev,
        { ...user, nickname: nick, is_owner: false },
      ]);
    }
    setPassengerInput("");
    setShowPassengerDropdown(false);
  };

  const removePassenger = (id) => setEditPassengers((p) => p.filter((x) => x.id !== id));
  const makeResponsible = (id) =>
    setEditPassengers((prev) => prev.map((p) => ({ ...p, is_owner: p.id === id })));

  if (!isOpen || !event) return null;

  const handleSave = async () => {
    const payload = {
      destiny: parseInt(selectedDestinyId || event?.destiny?.id || 0),
      details: (details || "").trim(),
      date_start: formatDateToApi(dateStart),
      date_end: formatDateToApi(dateEnd),
      passengers: editPassengers.map((p) => ({
        id: p.id,
        is_owner: Boolean(p.is_owner),
        nickname: p.nickname || p.name,
        email: p.email,
      })),
    };

    try {
      setSaving(true);
      await api.put(`/events/${event.id}`, payload);
      onUpdated?.();
      onClose?.();
    } catch (err) {
      console.error("❌ Erro ao atualizar evento:", err);
      alert("Erro ao atualizar evento.");
    } finally {
      setSaving(false);
    }
  };

  const status = (event?.status_event || "").toLowerCase();
  const statusLabel =
    status === "approved" || status === "pre approved"
      ? "Aprovado"
      : status === "pending"
      ? "Pendente"
      : status === "denied"
      ? "Negado"
      : status === "canceled"
      ? "Cancelado"
      : "Desconhecido";

  const badgeColor =
    status === "approved" || status === "pre approved"
      ? "bg-green-100 text-green-700 border-green-600"
      : status === "pending"
      ? "bg-yellow-100 text-yellow-700 border-yellow-500"
      : status === "denied"
      ? "bg-red-100 text-red-700 border-red-600"
      : "bg-gray-100 text-gray-700 border-gray-500";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        show ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto ${
          darkMode ? "bg-gray-900" : "bg-white"
        } transition-all duration-300`}
      >
        {/* Botão fechar */}
        <button
          className={`absolute right-3 top-3 cursor-pointer ${
            darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-800"
          }`}
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="p-6 pb-4 flex justify-between items-center flex-wrap gap-2">
          <h2 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
            Editar Evento
          </h2>
        </div>

        {/* Conteúdo */}
        <div className="space-y-4">
          {/* Cabeçalho informativo */}
          <div className="px-6 flex items-center justify-between flex-wrap gap-2">
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Código:{" "}
              <span
                className={`font-semibold ${darkMode ? "text-blue-400" : "text-blue-600"}`}
              >
                {event.code}
              </span>
              {event.created_at && (
                <>
                  {" "}
                  <span className={`${darkMode ? "text-gray-500" : "text-gray-500"}`}>—</span>{" "}
                  <span
                    className={`italic ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Criado em {event.created_at}
                  </span>
                </>
              )}
              <span className={`${darkMode ? "text-gray-500" : "text-gray-500"}`}> — </span>
              <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Solicitante:{" "}
                {(() => {
                  const getName = (p) =>
                    p?.user_nickname || p?.nickname || p?.full_name || p?.name;
                  const owner = (event?.passengers || []).find((p) => p?.is_owner);
                  return event?.requester_name || getName(owner) || "-";
                })()}
              </span>
            </p>

            <span
              className={`px-4 py-1 text-sm font-semibold rounded-full border shadow-md ${badgeColor}`}
            >
              {statusLabel}
            </span>
          </div>

          {/* Corpo */}
          <div className="px-6 pb-4 space-y-4">
            {/* Datas */}
            <div
              className={`p-4 rounded-lg border ${
                darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Calendar
                    size={18}
                    className={`mt-1 ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                  />
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Data de Início
                    </p>
                    <input
                      type="datetime-local"
                      step="60"
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                      className={`w-full mt-1 px-3 py-2 rounded border ${
                        darkMode
                          ? "bg-gray-900 border-gray-700 text-gray-100"
                          : "bg-white border-gray-300 text-gray-800"
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar
                    size={18}
                    className={`mt-1 ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                  />
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Data de Término
                    </p>
                    <input
                      type="datetime-local"
                      step="60"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                      className={`w-full mt-1 px-3 py-2 rounded border ${
                        darkMode
                          ? "bg-gray-900 border-gray-700 text-gray-100"
                          : "bg-white border-gray-300 text-gray-800"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Destino */}
            <div
              className={`p-4 rounded-lg border ${
                darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <MapPin
                  className={`mt-1 ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                  size={20}
                />
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Destino
                  </p>
                  <input
                    list="destinies"
                    value={destinyInput}
                    onChange={(e) => handleDestinySelect(e.target.value)}
                    placeholder="Selecione ou busque um destino"
                    className={`w-full mt-1 px-3 py-2 rounded border ${
                      darkMode
                        ? "bg-gray-900 border-gray-700 text-gray-100"
                        : "bg-white border-gray-300 text-gray-800"
                    }`}
                  />
                  <datalist id="destinies">
                    {destinies.map((d) => (
                      <option key={d.id} value={d.name} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            {/* Passageiros */}
            <div
              className={`p-4 rounded-lg border ${
                darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <User
                  className={`mt-1 ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                  size={20}
                />
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium mb-3 ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Passageiros
                  </p>

                  <div className="mb-3 relative">
                    <input
                      type="text"
                      placeholder="Adicionar passageiro..."
                      value={passengerInput}
                      onChange={(e) => handlePassengerInput(e.target.value)}
                      className={`w-full px-3 py-2 rounded border ${
                        darkMode
                          ? "bg-gray-900 border-gray-700 text-gray-100"
                          : "bg-white border-gray-300 text-gray-800"
                      }`}
                    />
                    {showPassengerDropdown && filteredPassengers.length > 0 && (
                      <div
                        className={`absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded border ${
                          darkMode
                            ? "bg-gray-900 border-gray-700"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        {filteredPassengers.map((u) => (
                          <button
                            type="button"
                            key={u.id}
                            onClick={() => handlePassengerSelect(u)}
                            className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-blue-50 ${
                              darkMode
                                ? "hover:bg-gray-800 text-gray-200"
                                : "text-gray-800"
                            }`}
                          >
                            <img
                              src={u.avatar || defaultAvatar}
                              className="w-5 h-5 rounded-full object-cover"
                              onError={(e) => (e.target.src = defaultAvatar)}
                            />
                            <span>{u.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {editPassengers.map((p, i) => (
                      <div
                        key={p.id ?? i}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm ${
                          p.is_owner
                            ? "border-blue-600 bg-blue-600 text-white"
                            : darkMode
                            ? "border-gray-600 bg-gray-700 text-gray-200"
                            : "border-gray-300 bg-white text-gray-700"
                        }`}
                      >
                        <img
                          src={p.avatar || defaultAvatar}
                          alt={p.name}
                          className="w-6 h-6 rounded-full object-cover"
                          onError={(e) => (e.target.src = defaultAvatar)}
                        />
                        <span className="text-sm font-medium">
                          {p.user_nickname || p.name}
                        </span>
                        {p.is_owner && <Crown size={12} className="text-yellow-300" />}
                        <button
                          type="button"
                          onClick={() => makeResponsible(p.id)}
                          className={`text-xs underline ${
                            darkMode ? "text-yellow-300" : "text-yellow-600"
                          }`}
                          title="Tornar responsável"
                        >
                          <ShieldCheck size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removePassenger(p.id)}
                          className={`text-xs underline ${
                            darkMode ? "text-red-300" : "text-red-600"
                          }`}
                          title="Remover"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Detalhes */}
            <div
              className={`p-4 rounded-lg border ${
                darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <FileText
                  className={`${darkMode ? "text-blue-400" : "text-blue-600"} mt-1`}
                  size={18}
                />
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Detalhes
                  </p>
                  <textarea
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className={`w-full px-3 py-2 rounded border ${
                      darkMode
                        ? "bg-gray-900 border-gray-700 text-gray-100"
                        : "bg-white border-gray-300 text-gray-800"
                    }`}
                    placeholder="Descreva os detalhes do evento..."
                  />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pb-4 pt-4">
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-md font-medium text-sm cursor-pointer ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-4 py-2 rounded-md font-medium text-sm cursor-pointer ${
                  saving ? "opacity-70 cursor-not-allowed" : ""
                } ${
                  darkMode
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "bg-blue-600 hover:bg-blue-500 text-white"
                }`}
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default EventEditModal;