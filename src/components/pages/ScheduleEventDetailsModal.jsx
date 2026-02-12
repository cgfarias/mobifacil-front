import { useState, useEffect } from "react";
import {
    X,
    Calendar,
    MapPin,
    User,
    FileText,
    Car,
    Crown,
    MessageCircle,
    ShieldCheck,
} from "lucide-react";
import api from "../../api/axios";

const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

function ScheduleEventDetailsModal({ isOpen, onClose, event, darkMode, allowEdit = false, allowEditApproved = false, allowTransportEdit = false, onSave }) {
    const [showModal, setShowModal] = useState(false);
    const [dateStartValue, setDateStartValue] = useState("");
    const [dateEndValue, setDateEndValue] = useState("");
    const [detailsValue, setDetailsValue] = useState("");
    const [saving, setSaving] = useState(false);

    // Destino editável
    const [destinies, setDestinies] = useState([]);
    const [destinyInput, setDestinyInput] = useState("");
    const [selectedDestinyId, setSelectedDestinyId] = useState(null);

    // Passageiros editáveis
    const [allPassengers, setAllPassengers] = useState([]); // opções
    const [passengerInput, setPassengerInput] = useState("");
    const [filteredPassengers, setFilteredPassengers] = useState([]);
    const [editPassengers, setEditPassengers] = useState([]); // atuais do evento
    const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);

    // Transporte (IDA/RETORNO)
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [driverStartInput, setDriverStartInput] = useState("");
    const [vehicleStartInput, setVehicleStartInput] = useState("");
    const [driverEndInput, setDriverEndInput] = useState("");
    const [vehicleEndInput, setVehicleEndInput] = useState("");

    // Converte "dd/mm/yyyy HH:MM" para "yyyy-MM-ddTHH:MM" (compatível com input datetime-local)
    const toInputDateTime = (str) => {
        if (!str) return "";
        if (str.includes("T")) return str.slice(0, 16);
        const [datePart, timePart] = str.split(" ");
        if (!datePart || !timePart) return "";
        const [dd, mm, yyyy] = datePart.split("/");
        const [HH, MM] = timePart.split(":");
        return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}T${String(HH).padStart(2, "0")}:${String(MM).padStart(2, "0")}`;
    };

    // Controle de edição baseado no status
    const statusNormalized = (event?.status_event || "").toLowerCase();
    const isPendingStatus = statusNormalized === "pending" || statusNormalized === "pendente";
    const isApprovedStatus = statusNormalized === "approved" || statusNormalized === "aprovado";
    const canEdit = Boolean(allowEdit && (isPendingStatus || (allowEditApproved && isApprovedStatus)));
    const getDisplayName = (p) => p?.user_nickname || p?.nickname || p?.full_name || p?.name;
    const ownerFromEvent = (event?.passengers || []).find((p) => p?.is_owner);
    const ownerFromLocal = (editPassengers || []).find((p) => p?.is_owner);
    const requesterDisplay = getDisplayName(ownerFromEvent || ownerFromLocal);

    useEffect(() => {

        // console.log('-----');
        // console.log(event);

        if (isOpen) setShowModal(true);
        else setShowModal(false);
    }, [isOpen]);

    useEffect(() => {
        if (!event) return;
        setDateStartValue(toInputDateTime(event.date_start) || "");
        setDateEndValue(toInputDateTime(event.date_end) || "");
        setDetailsValue(event.details || "");

        // Prepara destino inicial
        const initialDestName = event.destiny?.name || "";
        setDestinyInput(initialDestName);
        setSelectedDestinyId(event.destiny?.id || null);

        // Prepara passageiros atuais
        const current = (event.passengers || []).map((p) => {
            const display = p.user_nickname || p.nickname || p.full_name || p.name || "Passageiro";
            return {
                id: p.id ?? p.user_id ?? p.passenger_id,
                user_nickname: display,
                nickname: display,
                full_name: display,
                name: display,
                avatar: p.avatar,
                is_owner: Boolean(p.is_owner),
            };
        });
        setEditPassengers(current);

        // Pré-popula motoristas e veículos a partir do evento (quando vierem como objeto)
        setDriverStartInput(event.driver_start?.driver_name || "");
        setDriverEndInput(event.driver_end?.driver_name || "");
        setVehicleStartInput(event.vehicle_start?.plate || "");
        setVehicleEndInput(event.vehicle_end?.plate || "");

    }, [event, allowEdit]);

    // Carrega opções (destinos e usuários) quando abrir e for editável
    useEffect(() => {
        const loadOptions = async () => {
            try {
                // Destinos
                const destiniesResponse = await api.get("/destiny/get");
                
                if (destiniesResponse.status === 200) {
                    const list = (destiniesResponse.data.destiny_data || []).map((d) => ({
                        id: d.destiny_id,
                        name: d.destiny_name,
                    }));
                    setDestinies(list);
                    // tenta casar o destino atual por nome
                    if (!selectedDestinyId && destinyInput) {
                        const found = list.find((d) => d.name === destinyInput);
                        if (found) setSelectedDestinyId(found.id);
                    }
                }

                // Passageiros (usuários)
                const passengersResponse = await api.get("/show-users/get");
                if (passengersResponse.status === 200) {
                    const list = (passengersResponse.data.user_data || []).map((u) => {
                        const nick = u.user_nickname || u.user_socialname || u.user_fullname || "Usuário";
                        return {
                            id: u.user_id,
                            user_nickname: nick,
                            nickname: nick,
                            name: nick,
                            avatar: u.user_avatar,
                            email: u.user_email || u.email,
                        };
                    });
                    setAllPassengers(list);
                    setFilteredPassengers(list);
                }
            } catch (err) {
                // Apenas loga; a exibição em modo "visualizar" continua funcionando
                console.warn("Falha ao carregar destinos/usuários para edição", err);
            }
        };

        if (isOpen && canEdit) loadOptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, canEdit]);

    // Carrega motoristas e veículos quando for possível editar transporte
    useEffect(() => {
        const fetchTransportOptions = async () => {
            try {
                const [driversRes, vehiclesRes] = await Promise.all([
                    api.get('/driver/get'),
                    api.get('/vehicle/get'),
                ]);

                if (driversRes.status === 200) {
                    setDrivers(driversRes.data?.driver_data || driversRes.data || []);
                }
                if (vehiclesRes.status === 200) {
                    const list = vehiclesRes.data?.vehicle_data || vehiclesRes.data || [];
                    setVehicles(list);
                    // Preenche placa atual a partir do objeto ou do ID
                    if (!event?.vehicle_start?.plate && event?.vehicle_start) {
                        const id = typeof event.vehicle_start === 'object' ? event.vehicle_start?.vehicle_id : event.vehicle_start;
                        const v = list.find((x) => x.vehicle_id === id);
                        if (v?.plate) setVehicleStartInput(v.plate);
                    }
                    if (!event?.vehicle_end?.plate && event?.vehicle_end) {
                        const id = typeof event.vehicle_end === 'object' ? event.vehicle_end?.vehicle_id : event.vehicle_end;
                        const v = list.find((x) => x.vehicle_id === id);
                        if (v?.plate) setVehicleEndInput(v.plate);
                    }
                }
            } catch (e) {
                console.warn('Falha ao carregar motoristas/veículos', e);
            }
        };

        if (isOpen && canEdit && allowTransportEdit) fetchTransportOptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, canEdit, allowTransportEdit, event]);

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
        if (editPassengers.length >= 4) return; // mesmo limite do criador
        if (!editPassengers.some((p) => p.id === user.id)) {
            const nick = user.user_nickname || user.nickname || user.name;
            setEditPassengers((prev) => [
                ...prev,
                { id: user.id, user_nickname: nick, nickname: nick, full_name: nick, name: nick, avatar: user.avatar, is_owner: false },
            ]);
        }
        setPassengerInput("");
        setShowPassengerDropdown(false);
    };

    const removePassenger = (id) => {
        setEditPassengers((prev) => prev.filter((p) => p.id !== id));
    };

    const makeResponsible = (id) => {
        setEditPassengers((prev) => prev.map((p) => ({ ...p, is_owner: p.id === id })));
    };

    if (!isOpen || !event) return null;

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "approved":
            case "pre approved":
                return "green";
            case "pending":
                return "yellow";
            case "canceled":
                return "gray";
            case "denied":
                return "red";
            default:
                return "gray";
        }
    };

    const translateStatus = (status) => {
        switch (status?.toLowerCase()) {
            case "pre approved":
            case "approved":
                return "Aprovado";
            case "pending":
                return "Pendente";
            case "canceled":
                return "Cancelado";
            case "denied":
                return "Negado";
            default:
                return "Desconhecido";
        }
    };

    const color = getStatusColor(event.status_event);
    const translatedStatus = translateStatus(event.status_event);

    const statusBadgeClasses =
        color === "green"
            ? "bg-green-100 text-green-700 border-green-600"
            : color === "yellow"
                ? "bg-yellow-100 text-yellow-700 border-yellow-500"
                : color === "gray"
                    ? "bg-gray-100 text-gray-700 border-gray-500"
                    : color === "red"
                        // ? console.log('testando...')
                        ? "bg-red-100 text-red-700 border-red-600"
                        : "bg-gray-100 text-gray-700 border-gray-400";


    const openWhatsApp = (phone) => {
        if (!phone) return;
        const phoneClean = phone.replace(/\D/g, "");
        window.open(`https://wa.me/55${phoneClean}`, "_blank");
    };

    // === Normaliza para o formato usado no ScheduleEventModal ===
    // Retorna "1900-01-01T00:00:00" quando vazio; caso contrário, "YYYY-MM-DDTHH:MM:SS".
const formatDateToApi = (value) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
        return '1900-01-01T00:00:00';
    }
    if (typeof value === 'string') {
        if (value.includes('T')) {
            const [datePart, timeRaw] = value.split('T');
            const time = timeRaw?.length === 5 ? `${timeRaw}:00` : (timeRaw || '00:00:00');
            return `${datePart}T${time}`;
        }
        if (value.includes(' ')) {
            const [datePart, timeRaw] = value.split(' ');
            const time = timeRaw?.length === 5 ? `${timeRaw}:00` : (timeRaw || '00:00:00');
            return `${datePart}T${time}`;
        }
    }
    return value;
  };
  
    // === Função principal de salvar alterações ===
    const handleSave = async () => {
        // Validações básicas
        const hasStart = Boolean(dateStartValue && String(dateStartValue).trim() !== '');
        const hasEnd = Boolean(dateEndValue && String(dateEndValue).trim() !== '');
        const start = hasStart ? new Date(dateStartValue) : null;
        const end = hasEnd ? new Date(dateEndValue) : null;

        if (!selectedDestinyId && !event?.destiny?.id) {
            alert("Selecione um destino válido.");
            return;
        }
        if (!detailsValue || !detailsValue.trim()) {
            alert("Descreva os detalhes do evento.");
            return;
        }
        if (!hasStart && !hasEnd) {
            alert("Preencha pelo menos a data/hora de início ou de fim.");
            return;
        }
        // Permite envio quando alguma data for sentinela de 1900
        const sVal = String(dateStartValue || "");
        const eVal = String(dateEndValue || "");
        const isSentinelStart = sVal.startsWith("1900-") || sVal === "1900-01-01T00:00:00";
        const isSentinelEnd = eVal.startsWith("1900-") || eVal === "1900-01-01T00:00:00";
        if (hasStart && hasEnd && !isSentinelStart && !isSentinelEnd && start >= end) {
            alert("A data de fim deve ser posterior à de início.");
            return;
        }

        // Prepara passageiros
        const passengersPayload = (editPassengers || []).map((p) => {
            const userInfo = allPassengers.find((u) => u.id === p.id) || {};
            const fallback = (event.passengers || []).find(
                (u) => (u.id ?? u.user_id ?? u.passenger_id) === p.id
            ) || {};

            const nickname =
                p.user_nickname ||
                p.nickname ||
                p.name ||
                userInfo.user_nickname ||
                userInfo.nickname ||
                userInfo.name ||
                fallback.nickname ||
                fallback.user_nickname;

            const email =
                userInfo.email || userInfo.user_email || fallback.email || fallback.user_email;

            return { id: p.id, is_owner: Boolean(p.is_owner), nickname, email };
        });

        // Monta payload no formato esperado pelo backend
        const payload = {
            destiny: parseInt(selectedDestinyId || event.destiny?.id || 0),
            details: detailsValue.trim(),
            date_start: formatDateToApi(dateStartValue),
            date_end: formatDateToApi(dateEndValue),
            passengers: passengersPayload,
        };

        // Se o pai passou onSave (modo de edição em cascata)
        if (onSave) {
            onSave(payload);
            return;
        }

        try {
            setSaving(true);

            // ✅ Endpoint correto: /events/{id}
            const response = await api.put(`/events/${event.id}`, payload);

            if (response.status === 200) {
                // Se permitido editar transporte, envia atribuição de motorista/veículo
                if (allowTransportEdit) {
                    const getVehicleIdByPlate = (plate) => vehicles.find((v) => v.plate === plate)?.vehicle_id || null;
                    const getDriverIdByName = (name) => drivers.find((d) => d.driver_name === name)?.driver_id || null;

                    const vStartId = getVehicleIdByPlate(vehicleStartInput);
                    const dStartId = getDriverIdByName(driverStartInput);
                    const vEndId = getVehicleIdByPlate(vehicleEndInput);
                    const dEndId = getDriverIdByName(driverEndInput);

                    const assignPayload = {};
                    if (vStartId && dStartId) {
                        assignPayload.vehicle_start_id = vStartId;
                        assignPayload.driver_start_id = dStartId;
                    }
                    if (vEndId && dEndId) {
                        assignPayload.vehicle_end_id = vEndId;
                        assignPayload.driver_end_id = dEndId;
                    }

                    if (Object.keys(assignPayload).length > 0) {
                        await api.put(`/events/${event.id}/vehicles-driver-assignment`, assignPayload);
                    }
                }

                alert("Evento atualizado com sucesso!");
                onClose?.(); // fecha o modal se existir essa prop
            } else {
                alert("Não foi possível atualizar o evento. Tente novamente.");
            }
        } catch (err) {
            console.error("Erro ao atualizar evento:", err);
            alert("Erro ao atualizar evento. Verifique sua conexão ou tente novamente.");
        } finally {
            setSaving(false);
        }
    };
  

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${showModal ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
        >
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            <div
                className={`relative rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto ${darkMode ? "bg-gray-900" : "bg-white"
                    } transition-all duration-300`}
            >
                {/* Botão fechar */}
                <button
                    className={`absolute right-3 top-3 z-10 cursor-pointer ${darkMode
                        ? "text-gray-400 hover:text-gray-200"
                        : "text-gray-500 hover:text-gray-800"
                        }`}
                    onClick={onClose}
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="p-6 pb-4 flex justify-between items-center flex-wrap gap-2">
                    <h2
                        className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"
                            }`}
                    >
                        Detalhes do Evento
                    </h2>
                </div>

                {/* Conteúdo */}
                <div className="px-6 space-y-4">
                    {/* Código e status */}
                    <div className="flex flex-direction items-center justify-between">
                        <p
                            className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                        >
                            Código:{" "}
                            <span
                                className={`font-semibold ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                            >
                                {event.code}
                            </span>

                            {event.created_at && (
                                <>
                                    {" "}
                                    <span className={`${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                                        —
                                    </span>{" "}
                                    <span
                                        className={`text-sm italic ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                                    >
                                        Criado em {event.created_at}
                                    </span>
                                </>
                            )}

                            {!canEdit && requesterDisplay && (
                                <>
                                    {" "}
                                    <span className={`${darkMode ? "text-gray-500" : "text-gray-500"}`}>—</span>{" "}
                                    <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                        Solicitante: {requesterDisplay}
                                    </span>
                                </>
                            )}
                        </p>

                        <span
                            className={`px-4 py-1 text-sm font-semibold rounded-full border shadow-md ${statusBadgeClasses}`}
                        >
                            {translatedStatus}
                        </span>
                    </div>

                    {/* Datas */}
                    <div
                        className={`p-4 rounded-lg border ${darkMode
                            ? "border-gray-700 bg-gray-800"
                            : "border-gray-200 bg-gray-50"
                            }`}
                    >
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex items-start gap-2">
                                <Calendar
                                    size={18}
                                    className={`mt-1 ${darkMode ? "text-blue-400" : "text-blue-600"
                                        }`}
                                />
                                <div className="flex-1">
                                    <p
                                        className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"
                                            }`}
                                    >
                                        Data de Início
                                    </p>
                                    {canEdit ? (
                                        <input
                                            type="datetime-local"
                                            step="60"
                                            value={dateStartValue}
                                            onChange={(e) => setDateStartValue(e.target.value)}
                                            className={`w-full mt-1 px-3 py-2 rounded border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}
                                        />
                                    ) : (
                                        <div className={`w-full mt-1 px-3 py-2 rounded border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}>
                                            {event?.date_start || "-"}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Calendar
                                    size={18}
                                    className={`mt-1 ${darkMode ? "text-blue-400" : "text-blue-600"
                                        }`}
                                />
                                <div className="flex-1">
                                    <p
                                        className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"
                                            }`}
                                    >
                                        Data de Término
                                    </p>
                                    {canEdit ? (
                                        <input
                                            type="datetime-local"
                                            step="60"
                                            value={dateEndValue}
                                            onChange={(e) => setDateEndValue(e.target.value)}
                                            className={`w-full mt-1 px-3 py-2 rounded border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}
                                        />
                                    ) : (
                                        <div className={`w-full mt-1 px-3 py-2 rounded border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}>
                                            {event?.date_end || "-"}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Destino */}
                    <div
                        className={`p-4 rounded-lg border ${darkMode
                            ? "border-gray-700 bg-gray-800"
                            : "border-gray-200 bg-gray-50"
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <MapPin
                                className={`mt-1 ${darkMode ? "text-blue-400" : "text-blue-600"
                                    }`}
                                size={20}
                            />
                            <div className="flex-1">
                                <p
                                    className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"
                                        }`}
                                >
                                    Destino
                                </p>
                                <div>
                                    {canEdit ? (
                                        <>
                                            <input
                                                list="destinies"
                                                value={destinyInput}
                                                onChange={(e) => handleDestinySelect(e.target.value)}
                                                placeholder="Selecione ou busque um destino"
                                                className={`w-full mt-1 px-3 py-2 rounded border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}
                                            />
                                            <datalist id="destinies">
                                                {destinies.map((d) => (
                                                    <option key={d.id} value={d.name} />
                                                ))}
                                            </datalist>
                                        </>
                                    ) : (
                                        <div className={`w-full mt-1 px-3 py-2 rounded border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}>
                                            {event?.destiny?.name || "-"}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Passageiros */}
                    {(editPassengers && editPassengers.length >= 0) && (
                        <div
                            className={`p-4 rounded-lg border ${darkMode
                                ? "border-gray-700 bg-gray-800"
                                : "border-gray-200 bg-gray-50"
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <User
                                    className={`mt-1 ${darkMode ? "text-blue-400" : "text-blue-600"
                                        }`}
                                    size={20}
                                />
                                <div className="flex-1">
                                    <p
                                        className={`text-sm font-medium mb-3 ${darkMode ? "text-gray-400" : "text-gray-600"
                                            }`}
                                    >
                                        Passageiros
                                    </p>

                                    {canEdit && (
                                        <div className="mb-3 relative">
                                            <input
                                                type="text"
                                                placeholder="Adicionar passageiro..."
                                                value={passengerInput}
                                                onChange={(e) => handlePassengerInput(e.target.value)}
                                                className={`w-full px-3 py-2 rounded border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}
                                            />
                                            {showPassengerDropdown && filteredPassengers.length > 0 && (
                                                <div className={`absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
                                                    {filteredPassengers.map((u) => (
                                                        <button
                                                            type="button"
                                                            key={u.id}
                                                            onClick={() => handlePassengerSelect(u)}
                                                            className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-blue-50 ${darkMode ? "hover:bg-gray-800 text-gray-200" : "text-gray-800"}`}
                                                        >
                                                            <img src={u.avatar || defaultAvatar} className="w-5 h-5 rounded-full object-cover" onError={(e) => (e.target.src = defaultAvatar)} />
                                                            <span>{u.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        {(editPassengers || []).map((p, i) => (
                                            <div
                                                key={p.id ?? i}
                                                className={`flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm ${p.is_owner
                                                    ? "border-blue-600 bg-blue-600 text-white"
                                                    : darkMode
                                                        ? "border-gray-600 bg-gray-700 text-gray-200"
                                                        : "border-gray-300 bg-white text-gray-700"
                                                    }`}
                                            >
                                                <img
                                                    src={p.avatar || defaultAvatar}
                                                    alt={p.user_nickname || p.nickname || p.full_name || p.name}
                                                    className="w-6 h-6 rounded-full object-cover"
                                                    onError={(e) => (e.target.src = defaultAvatar)}
                                                />
                                                <span className="text-sm font-medium">
                                                    {p.user_nickname || p.nickname || p.full_name || p.name || `Passageiro ${i + 1}`}
                                                </span>
                                                {canEdit ? (
                                                    <>
                                                        {p.is_owner ? (
                                                            <Crown
                                                                size={15}
                                                                className="text-yellow-300"
                                                                title="Responsável atual"
                                                            />
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => makeResponsible(p.id)}
                                                                className="text-xs text-yellow-500 hover:text-yellow-400"
                                                                title="Tornar responsável"
                                                            >
                                                                <Crown size={12} className="text-gray-500" />
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => removePassenger(p.id)}
                                                            className={`text-xs underline ${darkMode ? "text-red-300 hover:text-red-200" : "text-red-600 hover:text-red-500"
                                                                } ml-2`}
                                                            title="Remover passageiro"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    p.is_owner && <Crown size={15} className="text-yellow-300" title="Responsável" />
                                                )}

                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Detalhes do Evento */}
                    <div
                        className={`p-4 rounded-lg border ${darkMode
                            ? "border-gray-700 bg-gray-800"
                            : "border-gray-200 bg-gray-50"
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <FileText className={`${darkMode ? "text-blue-400" : "text-blue-600"} mt-1`} size={18} />
                            <div className="flex-1">
                                <p className={`text-sm font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                    Detalhes do Evento
                                </p>
                                {canEdit ? (
                                    <textarea
                                        rows={3}
                                        value={detailsValue}
                                        onChange={(e) => setDetailsValue(e.target.value)}
                                        className={`w-full px-3 py-2 rounded border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}
                                        placeholder="Descreva os detalhes do evento..."
                                    />
                                ) : (
                                    <div className={`w-full px-3 py-2 rounded border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}>
                                        {detailsValue || event?.details || "-"}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Motoristas lado a lado */}
                    {(event.driver_start || event.driver_end) && (
                        <div
                            className={`p-4 rounded-lg border ${darkMode
                                ? "border-gray-700 bg-gray-800"
                                : "border-gray-200 bg-gray-50"
                                }`}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Início */}
                                {event.driver_start && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <User
                                                size={18}
                                                className={`${darkMode ? "text-blue-400" : "text-blue-600"
                                                    }`}
                                            />
                                            <p
                                                className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"
                                                    }`}
                                            >
                                                Motorista de Ida
                                            </p>
                                        </div>
                                        <p
                                            className={`font-medium ${darkMode ? "text-white" : "text-gray-800"
                                                }`}
                                        >
                                            {event.driver_start?.driver_name || "Não informado"}
                                        </p>
                                        {event.driver_start?.driver_phone && (
                                            <button
                                                onClick={() =>
                                                    openWhatsApp(event.driver_start.driver_phone)
                                                }
                                                className={`flex items-center gap-1 mt-1 text-sm transition-colors cursor-pointer ${darkMode
                                                    ? "text-green-400 hover:text-green-300"
                                                    : "text-green-600 hover:text-green-500"
                                                    }`}
                                            >
                                                <MessageCircle size={14} />
                                                {event.driver_start.driver_phone}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Retorno */}
                                {event.driver_end && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <User
                                                size={18}
                                                className={`${darkMode ? "text-blue-400" : "text-blue-600"
                                                    }`}
                                            />
                                            <p
                                                className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"
                                                    }`}
                                            >
                                                Motorista de Retorno
                                            </p>
                                        </div>
                                        <p
                                            className={`font-medium ${darkMode ? "text-white" : "text-gray-800"
                                                }`}
                                        >
                                            {event.driver_end?.driver_name || "Não informado"}
                                        </p>
                                        {event.driver_end?.driver_phone && (
                                            <button
                                                onClick={() =>
                                                    openWhatsApp(event.driver_end.driver_phone)
                                                }
                                                className={`flex items-center gap-1 mt-1 text-sm transition-colors cursor-pointer ${darkMode
                                                    ? "text-green-400 hover:text-green-300"
                                                    : "text-green-600 hover:text-green-500"
                                                    }`}
                                            >
                                                <MessageCircle size={14} />
                                                {event.driver_end.driver_phone}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Edição de Transporte (IDA/RETORNO) */}
                    {canEdit && allowTransportEdit && (
                        <div
                            className={`p-4 rounded-lg border ${darkMode
                                ? "border-gray-700 bg-gray-800"
                                : "border-gray-200 bg-gray-50"
                                }`}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* IDA */}
                                <div>
                                    <p className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Transporte de IDA</p>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Veículo (placa)</p>
                                            <input
                                                list="vehicles_start"
                                                value={vehicleStartInput}
                                                onChange={(e) => setVehicleStartInput(e.target.value)}
                                                placeholder="Selecione o veículo"
                                                className={`w-full mt-1 px-3 py-2 rounded border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}
                                            />
                                            <datalist id="vehicles_start">
                                                {vehicles.map((v) => (
                                                    <option key={v.vehicle_id} value={v.plate} />
                                                ))}
                                            </datalist>
                                        </div>
                                        <div>
                                            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Motorista</p>
                                            <input
                                                list="drivers_start"
                                                value={driverStartInput}
                                                onChange={(e) => setDriverStartInput(e.target.value)}
                                                placeholder="Selecione o motorista"
                                                className={`w-full mt-1 px-3 py-2 rounded border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}
                                            />
                                            <datalist id="drivers_start">
                                                {drivers.map((d) => (
                                                    <option key={d.driver_id} value={d.driver_name} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>
                                </div>
                                {/* RETORNO */}
                                <div>
                                    <p className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Transporte de RETORNO</p>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div>
                                            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Veículo (placa)</p>
                                            <input
                                                list="vehicles_end"
                                                value={vehicleEndInput}
                                                onChange={(e) => setVehicleEndInput(e.target.value)}
                                                placeholder="Selecione o veículo"
                                                className={`w-full mt-1 px-3 py-2 rounded border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}
                                            />
                                            <datalist id="vehicles_end">
                                                {vehicles.map((v) => (
                                                    <option key={v.vehicle_id} value={v.plate} />
                                                ))}
                                            </datalist>
                                        </div>
                                        <div>
                                            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Motorista</p>
                                            <input
                                                list="drivers_end"
                                                value={driverEndInput}
                                                onChange={(e) => setDriverEndInput(e.target.value)}
                                                placeholder="Selecione o motorista"
                                                className={`w-full mt-1 px-3 py-2 rounded border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}
                                            />
                                            <datalist id="drivers_end">
                                                {drivers.map((d) => (
                                                    <option key={d.driver_id} value={d.driver_name} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className={`mt-3 text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                                Obs.: cada trecho só é enviado se veículo e motorista forem informados.
                            </p>
                        </div>
                    )}

                    {/* Bloco de Voucher */}
{(event.voucher_start !== null || event.voucher_end !== null) && (
  <div
    className={`p-4 rounded-lg border ${
      darkMode ? "border-blue-700 bg-blue-900/20" : "border-blue-300 bg-blue-50"
    }`}
  >
    <div className="flex items-start gap-3">
      <ShieldCheck
        className={`${darkMode ? "text-blue-400" : "text-blue-600"} mt-1`}
        size={20}
      />
      <div className="flex-1">
        <p
          className={`text-sm font-semibold mb-2 ${
            darkMode ? "text-blue-300" : "text-blue-700"
          }`}
        >
          Voucher de Transporte
        </p>

        {/* Voucher IDA */}
        {event.voucher_start !== null && (
          <p
            className={`text-sm mb-1 ${
              darkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <span
              className={`font-medium ${
                event.voucher_start === "generated"
                  ? "text-green-500"
                  : event.voucher_start === "denied"
                  ? "text-red-500"
                  : "text-yellow-600"
              }`}
            >
              PARTIDA:
            </span>{" "}
            {event.voucher_start === "generated"
              ? "Aprovado como voucher"
              : event.voucher_start === "denied"
              ? "Negado como voucher"
              : "Pendente de aprovação"}
          </p>
        )}

        {/* Voucher RETORNO */}
        {event.voucher_end !== null && (
          <p
            className={`text-sm ${
              darkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            <span
              className={`font-medium ${
                event.voucher_end === "generated"
                  ? "text-green-500"
                  : event.voucher_end === "denied"
                  ? "text-red-500"
                  : "text-yellow-600"
              }`}
            >
              RETORNO:
            </span>{" "}
            {event.voucher_end === "generated"
              ? "Aprovado como voucher"
              : event.voucher_end === "denied"
              ? "Negado como voucher"
              : "Pendente de aprovação"}
          </p>
        )}
      </div>
    </div>
  </div>
)}


                    {/* Bloco de NEGAÇÃO - fora da grid */}
                    {event.status_event?.toLowerCase() === "denied" && event.deny_data && (
                        <div
                            className={`p-4 rounded-lg ${darkMode
                                ? "border-red-800 bg-red-900/20"
                                : "border-red-300 bg-red-50"
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {/* Ícone de alerta */}
                                

                                <div className="flex-1">
                                    <p className={`text-sm font-semibold mb-2 flex gap-1 ${darkMode ? "text-red-300" : "text-red-700"}`}>
                                        🚫 Solicitação Negada <span className="text-gray-500"> por {event.deny_data?.nickname} </span>
                                    </p>

                                    {/* Motivo */}
                                    <p className={`text-sm mb-3 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                    <span className={`${darkMode ? "text-red-500" : "text-red-700"}`}> Motivo: </span>
                                        {event.deny_data?.deny_message || "Motivo não informado."}
                                    </p>

                                    {/* Informações adicionais */}
                                    <div className={`grid sm:grid-cols-2 gap-3 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                        {/* {event.deny_data?.nickname && (
                                            <p>
                                            <span className="font-semibold">Negado por:</span>{" "}
                                            {event.deny_data.nickname}
                                            </p>
                                        )}
                                        {event.updated_at && (
                                            <p>
                                            <span className="font-semibold">Data:</span>{" "}
                                            {event.updated_at}
                                            </p>
                                        )} */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}



                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 pt-4">
                    {canEdit && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`px-4 py-2 rounded-md font-medium text-sm cursor-pointer ${saving ? "opacity-70 cursor-not-allowed" : ""} ${darkMode ? "bg-green-600 hover:bg-green-500 text-white" : "bg-green-600 hover:bg-green-500 text-white"}`}
                        >
                            {saving ? "Salvando..." : "Salvar alterações"}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 rounded-md font-medium text-sm cursor-pointer ${darkMode
                            ? "bg-gray-700 hover:bg-gray-600 text-white"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                            }`}
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ScheduleEventDetailsModal;
























// import { useState, useEffect } from "react";
// import {
//     X,
//     Calendar,
//     MapPin,
//     User,
//     FileText,
//     Car,
//     Crown,
//     MessageCircle,
//     ShieldCheck,
// } from "lucide-react";
// import api from "../../api/axios";

// const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

// function ScheduleEventDetailsModal({ isOpen, onClose, event, darkMode, allowEdit = false, allowEditApproved = false, onSave }) {
//     const [showModal, setShowModal] = useState(false);
//     const [dateStartValue, setDateStartValue] = useState("");
//     const [dateEndValue, setDateEndValue] = useState("");
//     const [detailsValue, setDetailsValue] = useState("");
//     const [saving, setSaving] = useState(false);

//     // Destino editável
//     const [destinies, setDestinies] = useState([]);
//     const [destinyInput, setDestinyInput] = useState("");
//     const [selectedDestinyId, setSelectedDestinyId] = useState(null);

//     // Passageiros editáveis
//     const [allPassengers, setAllPassengers] = useState([]); // opções
//     const [passengerInput, setPassengerInput] = useState("");
//     const [filteredPassengers, setFilteredPassengers] = useState([]);
//     const [editPassengers, setEditPassengers] = useState([]); // atuais do evento
//     const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);

//     // Converte "dd/mm/yyyy HH:MM" para "yyyy-MM-ddTHH:MM" (compatível com input datetime-local)
//     const toInputDateTime = (str) => {
//         if (!str) return "";
//         if (str.includes("T")) return str.slice(0, 16);
//         const [datePart, timePart] = str.split(" ");
//         if (!datePart || !timePart) return "";
//         const [dd, mm, yyyy] = datePart.split("/");
//         const [HH, MM] = timePart.split(":");
//         return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}T${String(HH).padStart(2, "0")}:${String(MM).padStart(2, "0")}`;
//     };

//     // Controle de edição baseado no status
//     const statusNormalized = (event?.status_event || "").toLowerCase();
//     const isPendingStatus = statusNormalized === "pending" || statusNormalized === "pendente";
//     const isApprovedStatus = statusNormalized === "approved" || statusNormalized === "aprovado";
//     const canEdit = Boolean(allowEdit && (isPendingStatus || (allowEditApproved && isApprovedStatus)));
//     const getDisplayName = (p) => p?.user_nickname || p?.nickname || p?.full_name || p?.name;
//     const ownerFromEvent = (event?.passengers || []).find((p) => p?.is_owner);
//     const ownerFromLocal = (editPassengers || []).find((p) => p?.is_owner);
//     const requesterDisplay = getDisplayName(ownerFromEvent || ownerFromLocal);

//     useEffect(() => {

//         // console.log('-----');
//         // console.log(event);

//         if (isOpen) setShowModal(true);
//         else setShowModal(false);
//     }, [isOpen]);

//     useEffect(() => {
//         if (!event) return;
//         setDateStartValue(toInputDateTime(event.date_start) || "");
//         setDateEndValue(toInputDateTime(event.date_end) || "");
//         setDetailsValue(event.details || "");

//         // Prepara destino inicial
//         const initialDestName = event.destiny?.name || "";
//         setDestinyInput(initialDestName);
//         setSelectedDestinyId(event.destiny?.id || null);

//         // Prepara passageiros atuais
//         const current = (event.passengers || []).map((p) => {
//             const display = p.user_nickname || p.nickname || p.full_name || p.name || "Passageiro";
//             return {
//                 id: p.id ?? p.user_id ?? p.passenger_id,
//                 user_nickname: display,
//                 nickname: display,
//                 full_name: display,
//                 name: display,
//                 avatar: p.avatar,
//                 is_owner: Boolean(p.is_owner),
//             };
//         });
//         setEditPassengers(current);

//     }, [event, allowEdit]);

//     // Carrega opções (destinos e usuários) quando abrir e for editável
//     useEffect(() => {
//         const loadOptions = async () => {
//             try {
//                 // Destinos
//                 const destiniesResponse = await api.get("/destiny/get");
                
//                 if (destiniesResponse.status === 200) {
//                     const list = (destiniesResponse.data.destiny_data || []).map((d) => ({
//                         id: d.destiny_id,
//                         name: d.destiny_name,
//                     }));
//                     setDestinies(list);
//                     // tenta casar o destino atual por nome
//                     if (!selectedDestinyId && destinyInput) {
//                         const found = list.find((d) => d.name === destinyInput);
//                         if (found) setSelectedDestinyId(found.id);
//                     }
//                 }

//                 // Passageiros (usuários)
//                 const passengersResponse = await api.get("/show-users/get");
//                 if (passengersResponse.status === 200) {
//                     const list = (passengersResponse.data.user_data || []).map((u) => {
//                         const nick = u.user_nickname || u.user_socialname || u.user_fullname || "Usuário";
//                         return {
//                             id: u.user_id,
//                             user_nickname: nick,
//                             nickname: nick,
//                             name: nick,
//                             avatar: u.user_avatar,
//                             email: u.user_email || u.email,
//                         };
//                     });
//                     setAllPassengers(list);
//                     setFilteredPassengers(list);
//                 }
//             } catch (err) {
//                 // Apenas loga; a exibição em modo "visualizar" continua funcionando
//                 console.warn("Falha ao carregar destinos/usuários para edição", err);
//             }
//         };

//         if (isOpen && canEdit) loadOptions();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [isOpen, canEdit]);

//     const handleDestinySelect = (value) => {
//         setDestinyInput(value);
//         const found = destinies.find((d) => d.name === value);
//         setSelectedDestinyId(found ? found.id : null);
//     };

//     const handlePassengerInput = (value) => {
//         setPassengerInput(value);
//         setShowPassengerDropdown(Boolean(value));
//         const term = value.toLowerCase();
//         const filtered = allPassengers.filter(
//             (p) => p.name.toLowerCase().includes(term) && !editPassengers.some((ep) => ep.id === p.id)
//         );
//         setFilteredPassengers(filtered);
//     };

//     const handlePassengerSelect = (user) => {
//         if (editPassengers.length >= 4) return; // mesmo limite do criador
//         if (!editPassengers.some((p) => p.id === user.id)) {
//             const nick = user.user_nickname || user.nickname || user.name;
//             setEditPassengers((prev) => [
//                 ...prev,
//                 { id: user.id, user_nickname: nick, nickname: nick, full_name: nick, name: nick, avatar: user.avatar, is_owner: false },
//             ]);
//         }
//         setPassengerInput("");
//         setShowPassengerDropdown(false);
//     };

//     const removePassenger = (id) => {
//         setEditPassengers((prev) => prev.filter((p) => p.id !== id));
//     };

//     const makeResponsible = (id) => {
//         setEditPassengers((prev) => prev.map((p) => ({ ...p, is_owner: p.id === id })));
//     };

//     if (!isOpen || !event) return null;

//     const getStatusColor = (status) => {
//         switch (status?.toLowerCase()) {
//             case "approved":
//             case "pre approved":
//                 return "green";
//             case "pending":
//                 return "yellow";
//             case "canceled":
//                 return "gray";
//             case "denied":
//                 return "red";
//             default:
//                 return "gray";
//         }
//     };

//     const translateStatus = (status) => {
//         switch (status?.toLowerCase()) {
//             case "pre approved":
//             case "approved":
//                 return "Aprovado";
//             case "pending":
//                 return "Pendente";
//             case "canceled":
//                 return "Cancelado";
//             case "denied":
//                 return "Negado";
//             default:
//                 return "Desconhecido";
//         }
//     };

//     const color = getStatusColor(event.status_event);
//     const translatedStatus = translateStatus(event.status_event);

//     const statusBadgeClasses =
//         color === "green"
//             ? "bg-green-100 text-green-700 border-green-600"
//             : color === "yellow"
//                 ? "bg-yellow-100 text-yellow-700 border-yellow-500"
//                 : color === "gray"
//                     ? "bg-gray-100 text-gray-700 border-gray-500"
//                     : color === "red"
//                         // ? console.log('testando...')
//                         ? "bg-red-100 text-red-700 border-red-600"
//                         : "bg-gray-100 text-gray-700 border-gray-400";


//     const openWhatsApp = (phone) => {
//         if (!phone) return;
//         const phoneClean = phone.replace(/\D/g, "");
//         window.open(`https://wa.me/55${phoneClean}`, "_blank");
//     };

//     // === Normaliza para "YYYY-MM-DD HH:MM:SS" aceito pelo backend ===
// const formatDateToBackend = (value) => {
//     if (!value) return null;
//     if (typeof value === "string" && value.includes("T")) {
//         const [datePart, timePartRaw] = value.split("T");
//         const timePart = timePartRaw?.length === 5 ? `${timePartRaw}:00` : (timePartRaw || "00:00:00");
//         return `${datePart} ${timePart}`;
//     }
//     // Caso já venha formatado, retorna como está
//     return value;
//   };
  
//     // === Função principal de salvar alterações ===
//     const handleSave = async () => {
//         // Validações básicas
//         const start = dateStartValue ? new Date(dateStartValue) : null;
//         const end = dateEndValue ? new Date(dateEndValue) : null;

//         if (!selectedDestinyId && !event?.destiny?.id) {
//             alert("Selecione um destino válido.");
//             return;
//         }
//         if (!detailsValue || !detailsValue.trim()) {
//             alert("Descreva os detalhes do evento.");
//             return;
//         }
//         if (!start || !end) {
//             alert("Selecione data/hora de início e fim.");
//             return;
//         }
//         if (start >= end) {
//             alert("A data de fim deve ser posterior à de início.");
//             return;
//         }

//         // Prepara passageiros
//         const passengersPayload = (editPassengers || []).map((p) => {
//             const userInfo = allPassengers.find((u) => u.id === p.id) || {};
//             const fallback = (event.passengers || []).find(
//                 (u) => (u.id ?? u.user_id ?? u.passenger_id) === p.id
//             ) || {};

//             const nickname =
//                 p.user_nickname ||
//                 p.nickname ||
//                 p.name ||
//                 userInfo.user_nickname ||
//                 userInfo.nickname ||
//                 userInfo.name ||
//                 fallback.nickname ||
//                 fallback.user_nickname;

//             const email =
//                 userInfo.email || userInfo.user_email || fallback.email || fallback.user_email;

//             return { id: p.id, is_owner: Boolean(p.is_owner), nickname, email };
//         });

//         // Monta payload no formato esperado pelo backend
//         const payload = {
//             destiny: parseInt(selectedDestinyId || event.destiny?.id || 0),
//             details: detailsValue.trim(),
//             date_start: formatDateToBackend(dateStartValue),
//             date_end: formatDateToBackend(dateEndValue),
//             passengers: passengersPayload,
//         };

//         // Se o pai passou onSave (modo de edição em cascata)
//         if (onSave) {
//             onSave(payload);
//             return;
//         }

//         try {
//             setSaving(true);

//             // ✅ Endpoint correto: /events/{id}
//             const response = await api.put(`/events/${event.id}`, payload);

//             if (response.status === 200) {
//                 alert("Evento atualizado com sucesso!");
//                 onClose?.(); // fecha o modal se existir essa prop
//             } else {
//                 alert("Não foi possível atualizar o evento. Tente novamente.");
//             }
//         } catch (err) {
//             console.error("Erro ao atualizar evento:", err);
//             alert("Erro ao atualizar evento. Verifique sua conexão ou tente novamente.");
//         } finally {
//             setSaving(false);
//         }
//     };
  

//     return (
//         <div
//             className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${showModal ? "opacity-100 scale-100" : "opacity-0 scale-95"
//                 }`}
//         >
//             <div
//                 className="absolute inset-0 bg-black/50 backdrop-blur-sm"
//                 onClick={onClose}
//             />

//             <div
//                 className={`relative rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto ${darkMode ? "bg-gray-900" : "bg-white"
//                     } transition-all duration-300`}
//             >
//                 {/* Botão fechar */}
//                 <button
//                     className={`absolute right-3 top-3 z-10 cursor-pointer ${darkMode
//                         ? "text-gray-400 hover:text-gray-200"
//                         : "text-gray-500 hover:text-gray-800"
//                         }`}
//                     onClick={onClose}
//                 >
//                     <X size={20} />
//                 </button>

//                 {/* Header */}
//                 <div className="p-6 pb-4 flex justify-between items-center flex-wrap gap-2">
//                     <h2
//                         className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"
//                             }`}
//                     >
//                         Detalhes do Evento
//                     </h2>
//                 </div>

//                 {/* Conteúdo */}
//                 <div className="px-6 space-y-4">
//                     {/* Código e status */}
//                     <div className="flex flex-direction items-center justify-between">
//                         <p
//                             className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
//                         >
//                             Código:{" "}
//                             <span
//                                 className={`font-semibold ${darkMode ? "text-blue-400" : "text-blue-600"}`}
//                             >
//                                 {event.code}
//                             </span>

//                             {event.created_at && (
//                                 <>
//                                     {" "}
//                                     <span className={`${darkMode ? "text-gray-500" : "text-gray-500"}`}>
//                                         —
//                                     </span>{" "}
//                                     <span
//                                         className={`text-sm italic ${darkMode ? "text-gray-400" : "text-gray-500"}`}
//                                     >
//                                         Criado em {event.created_at}
//                                     </span>
//                                 </>
//                             )}

//                             {!canEdit && requesterDisplay && (
//                                 <>
//                                     {" "}
//                                     <span className={`${darkMode ? "text-gray-500" : "text-gray-500"}`}>—</span>{" "}
//                                     <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
//                                         Solicitante: {requesterDisplay}
//                                     </span>
//                                 </>
//                             )}
//                         </p>

//                         <span
//                             className={`px-4 py-1 text-sm font-semibold rounded-full border shadow-md ${statusBadgeClasses}`}
//                         >
//                             {translatedStatus}
//                         </span>
//                     </div>

//                     {/* Datas */}
//                     <div
//                         className={`p-4 rounded-lg border ${darkMode
//                             ? "border-gray-700 bg-gray-800"
//                             : "border-gray-200 bg-gray-50"
//                             }`}
//                     >
//                         <div className="grid sm:grid-cols-2 gap-4">
//                             <div className="flex items-start gap-2">
//                                 <Calendar
//                                     size={18}
//                                     className={`mt-1 ${darkMode ? "text-blue-400" : "text-blue-600"
//                                         }`}
//                                 />
//                                 <div className="flex-1">
//                                     <p
//                                         className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"
//                                             }`}
//                                     >
//                                         Data de Início
//                                     </p>
//                                     {canEdit ? (
//                                         <input
//                                             type="datetime-local"
//                                             step="60"
//                                             value={dateStartValue}
//                                             onChange={(e) => setDateStartValue(e.target.value)}
//                                             className={`w-full mt-1 px-3 py-2 rounded border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}
//                                         />
//                                     ) : (
//                                         <div className={`w-full mt-1 px-3 py-2 rounded border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}>
//                                             {event?.date_start || "-"}
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                             <div className="flex items-start gap-2">
//                                 <Calendar
//                                     size={18}
//                                     className={`mt-1 ${darkMode ? "text-blue-400" : "text-blue-600"
//                                         }`}
//                                 />
//                                 <div className="flex-1">
//                                     <p
//                                         className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"
//                                             }`}
//                                     >
//                                         Data de Término
//                                     </p>
//                                     {canEdit ? (
//                                         <input
//                                             type="datetime-local"
//                                             step="60"
//                                             value={dateEndValue}
//                                             onChange={(e) => setDateEndValue(e.target.value)}
//                                             className={`w-full mt-1 px-3 py-2 rounded border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}
//                                         />
//                                     ) : (
//                                         <div className={`w-full mt-1 px-3 py-2 rounded border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}>
//                                             {event?.date_end || "-"}
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Destino */}
//                     <div
//                         className={`p-4 rounded-lg border ${darkMode
//                             ? "border-gray-700 bg-gray-800"
//                             : "border-gray-200 bg-gray-50"
//                             }`}
//                     >
//                         <div className="flex items-start gap-3">
//                             <MapPin
//                                 className={`mt-1 ${darkMode ? "text-blue-400" : "text-blue-600"
//                                     }`}
//                                 size={20}
//                             />
//                             <div className="flex-1">
//                                 <p
//                                     className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-600"
//                                         }`}
//                                 >
//                                     Destino
//                                 </p>
//                                 <div>
//                                     {canEdit ? (
//                                         <>
//                                             <input
//                                                 list="destinies"
//                                                 value={destinyInput}
//                                                 onChange={(e) => handleDestinySelect(e.target.value)}
//                                                 placeholder="Selecione ou busque um destino"
//                                                 className={`w-full mt-1 px-3 py-2 rounded border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}
//                                             />
//                                             <datalist id="destinies">
//                                                 {destinies.map((d) => (
//                                                     <option key={d.id} value={d.name} />
//                                                 ))}
//                                             </datalist>
//                                         </>
//                                     ) : (
//                                         <div className={`w-full mt-1 px-3 py-2 rounded border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}>
//                                             {event?.destiny?.name || "-"}
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Passageiros */}
//                     {(editPassengers && editPassengers.length >= 0) && (
//                         <div
//                             className={`p-4 rounded-lg border ${darkMode
//                                 ? "border-gray-700 bg-gray-800"
//                                 : "border-gray-200 bg-gray-50"
//                                 }`}
//                         >
//                             <div className="flex items-start gap-3">
//                                 <User
//                                     className={`mt-1 ${darkMode ? "text-blue-400" : "text-blue-600"
//                                         }`}
//                                     size={20}
//                                 />
//                                 <div className="flex-1">
//                                     <p
//                                         className={`text-sm font-medium mb-3 ${darkMode ? "text-gray-400" : "text-gray-600"
//                                             }`}
//                                     >
//                                         Passageiros
//                                     </p>

//                                     {canEdit && (
//                                         <div className="mb-3 relative">
//                                             <input
//                                                 type="text"
//                                                 placeholder="Adicionar passageiro..."
//                                                 value={passengerInput}
//                                                 onChange={(e) => handlePassengerInput(e.target.value)}
//                                                 className={`w-full px-3 py-2 rounded border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}
//                                             />
//                                             {showPassengerDropdown && filteredPassengers.length > 0 && (
//                                                 <div className={`absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
//                                                     {filteredPassengers.map((u) => (
//                                                         <button
//                                                             type="button"
//                                                             key={u.id}
//                                                             onClick={() => handlePassengerSelect(u)}
//                                                             className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-blue-50 ${darkMode ? "hover:bg-gray-800 text-gray-200" : "text-gray-800"}`}
//                                                         >
//                                                             <img src={u.avatar || defaultAvatar} className="w-5 h-5 rounded-full object-cover" onError={(e) => (e.target.src = defaultAvatar)} />
//                                                             <span>{u.name}</span>
//                                                         </button>
//                                                     ))}
//                                                 </div>
//                                             )}
//                                         </div>
//                                     )}

//                                     <div className="flex flex-wrap gap-2">
//                                         {(editPassengers || []).map((p, i) => (
//                                             <div
//                                                 key={p.id ?? i}
//                                                 className={`flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm ${p.is_owner
//                                                     ? "border-blue-600 bg-blue-600 text-white"
//                                                     : darkMode
//                                                         ? "border-gray-600 bg-gray-700 text-gray-200"
//                                                         : "border-gray-300 bg-white text-gray-700"
//                                                     }`}
//                                             >
//                                                 <img
//                                                     src={p.avatar || defaultAvatar}
//                                                     alt={p.user_nickname || p.nickname || p.full_name || p.name}
//                                                     className="w-6 h-6 rounded-full object-cover"
//                                                     onError={(e) => (e.target.src = defaultAvatar)}
//                                                 />
//                                                 <span className="text-sm font-medium">
//                                                     {p.user_nickname || p.nickname || p.full_name || p.name || `Passageiro ${i + 1}`}
//                                                 </span>
//                                                 {canEdit ? (
//                                                     <>
//                                                         {p.is_owner ? (
//                                                             <Crown
//                                                                 size={15}
//                                                                 className="text-yellow-300"
//                                                                 title="Responsável atual"
//                                                             />
//                                                         ) : (
//                                                             <button
//                                                                 type="button"
//                                                                 onClick={() => makeResponsible(p.id)}
//                                                                 className="text-xs text-yellow-500 hover:text-yellow-400"
//                                                                 title="Tornar responsável"
//                                                             >
//                                                                 <Crown size={12} className="text-gray-500" />
//                                                             </button>
//                                                         )}

//                                                         <button
//                                                             type="button"
//                                                             onClick={() => removePassenger(p.id)}
//                                                             className={`text-xs underline ${darkMode ? "text-red-300 hover:text-red-200" : "text-red-600 hover:text-red-500"
//                                                                 } ml-2`}
//                                                             title="Remover passageiro"
//                                                         >
//                                                             <X size={12} />
//                                                         </button>
//                                                     </>
//                                                 ) : (
//                                                     p.is_owner && <Crown size={15} className="text-yellow-300" title="Responsável" />
//                                                 )}

//                                             </div>
//                                         ))}
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     )}

//                     {/* Detalhes do Evento */}
//                     <div
//                         className={`p-4 rounded-lg border ${darkMode
//                             ? "border-gray-700 bg-gray-800"
//                             : "border-gray-200 bg-gray-50"
//                             }`}
//                     >
//                         <div className="flex items-start gap-3">
//                             <FileText className={`${darkMode ? "text-blue-400" : "text-blue-600"} mt-1`} size={18} />
//                             <div className="flex-1">
//                                 <p className={`text-sm font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
//                                     Detalhes do Evento
//                                 </p>
//                                 {canEdit ? (
//                                     <textarea
//                                         rows={3}
//                                         value={detailsValue}
//                                         onChange={(e) => setDetailsValue(e.target.value)}
//                                         className={`w-full px-3 py-2 rounded border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}
//                                         placeholder="Descreva os detalhes do evento..."
//                                     />
//                                 ) : (
//                                     <div className={`w-full px-3 py-2 rounded border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}>
//                                         {detailsValue || event?.details || "-"}
//                                     </div>
//                                 )}
//                             </div>
//                         </div>
//                     </div>

//                     {/* Motoristas lado a lado */}
//                     {(event.driver_start || event.driver_end) && (
//                         <div
//                             className={`p-4 rounded-lg border ${darkMode
//                                 ? "border-gray-700 bg-gray-800"
//                                 : "border-gray-200 bg-gray-50"
//                                 }`}
//                         >
//                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//                                 {/* Início */}
//                                 {event.driver_start && (
//                                     <div>
//                                         <div className="flex items-center gap-2 mb-2">
//                                             <User
//                                                 size={18}
//                                                 className={`${darkMode ? "text-blue-400" : "text-blue-600"
//                                                     }`}
//                                             />
//                                             <p
//                                                 className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"
//                                                     }`}
//                                             >
//                                                 Motorista de Ida
//                                             </p>
//                                         </div>
//                                         <p
//                                             className={`font-medium ${darkMode ? "text-white" : "text-gray-800"
//                                                 }`}
//                                         >
//                                             {event.driver_start?.driver_name || "Não informado"}
//                                         </p>
//                                         {event.driver_start?.driver_phone && (
//                                             <button
//                                                 onClick={() =>
//                                                     openWhatsApp(event.driver_start.driver_phone)
//                                                 }
//                                                 className={`flex items-center gap-1 mt-1 text-sm transition-colors cursor-pointer ${darkMode
//                                                     ? "text-green-400 hover:text-green-300"
//                                                     : "text-green-600 hover:text-green-500"
//                                                     }`}
//                                             >
//                                                 <MessageCircle size={14} />
//                                                 {event.driver_start.driver_phone}
//                                             </button>
//                                         )}
//                                     </div>
//                                 )}

//                                 {/* Retorno */}
//                                 {event.driver_end && (
//                                     <div>
//                                         <div className="flex items-center gap-2 mb-2">
//                                             <User
//                                                 size={18}
//                                                 className={`${darkMode ? "text-blue-400" : "text-blue-600"
//                                                     }`}
//                                             />
//                                             <p
//                                                 className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"
//                                                     }`}
//                                             >
//                                                 Motorista de Retorno
//                                             </p>
//                                         </div>
//                                         <p
//                                             className={`font-medium ${darkMode ? "text-white" : "text-gray-800"
//                                                 }`}
//                                         >
//                                             {event.driver_end?.driver_name || "Não informado"}
//                                         </p>
//                                         {event.driver_end?.driver_phone && (
//                                             <button
//                                                 onClick={() =>
//                                                     openWhatsApp(event.driver_end.driver_phone)
//                                                 }
//                                                 className={`flex items-center gap-1 mt-1 text-sm transition-colors cursor-pointer ${darkMode
//                                                     ? "text-green-400 hover:text-green-300"
//                                                     : "text-green-600 hover:text-green-500"
//                                                     }`}
//                                             >
//                                                 <MessageCircle size={14} />
//                                                 {event.driver_end.driver_phone}
//                                             </button>
//                                         )}
//                                     </div>
//                                 )}
//                             </div>
//                         </div>
//                     )}

//                     {/* Bloco de NEGAÇÃO - fora da grid */}
//                     {event.status_event?.toLowerCase() === "denied" && event.deny_data && (
//                         <div
//                             className={`p-4 rounded-lg ${darkMode
//                                 ? "border-red-800 bg-red-900/20"
//                                 : "border-red-300 bg-red-50"
//                                 }`}
//                         >
//                             <div className="flex items-start gap-3">
//                                 {/* Ícone de alerta */}
                                

//                                 <div className="flex-1">
//                                     <p className={`text-sm font-semibold mb-2 flex gap-1 ${darkMode ? "text-red-300" : "text-red-700"}`}>
//                                         🚫 Solicitação Negada <span className="text-gray-500"> por {event.deny_data?.nickname} </span>
//                                     </p>

//                                     {/* Motivo */}
//                                     <p className={`text-sm mb-3 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
//                                     <span className={`${darkMode ? "text-red-500" : "text-red-700"}`}> Motivo: </span>
//                                         {event.deny_data?.deny_message || "Motivo não informado."}
//                                     </p>

//                                     {/* Informações adicionais */}
//                                     <div className={`grid sm:grid-cols-2 gap-3 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
//                                         {/* {event.deny_data?.nickname && (
//                                             <p>
//                                             <span className="font-semibold">Negado por:</span>{" "}
//                                             {event.deny_data.nickname}
//                                             </p>
//                                         )}
//                                         {event.updated_at && (
//                                             <p>
//                                             <span className="font-semibold">Data:</span>{" "}
//                                             {event.updated_at}
//                                             </p>
//                                         )} */}
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     )}



//                 </div>

//                 {/* Footer */}
//                 <div className="flex justify-end gap-3 p-6 pt-4">
//                     {canEdit && (
//                         <button
//                             onClick={handleSave}
//                             disabled={saving}
//                             className={`px-4 py-2 rounded-md font-medium text-sm cursor-pointer ${saving ? "opacity-70 cursor-not-allowed" : ""} ${darkMode ? "bg-green-600 hover:bg-green-500 text-white" : "bg-green-600 hover:bg-green-500 text-white"}`}
//                         >
//                             {saving ? "Salvando..." : "Salvar alterações"}
//                         </button>
//                     )}
//                     <button
//                         onClick={onClose}
//                         className={`px-4 py-2 rounded-md font-medium text-sm cursor-pointer ${darkMode
//                             ? "bg-gray-700 hover:bg-gray-600 text-white"
//                             : "bg-gray-200 hover:bg-gray-300 text-gray-700"
//                             }`}
//                     >
//                         Fechar
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }

// export default ScheduleEventDetailsModal;
