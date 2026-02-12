import { useState, useEffect } from "react";
import { X, MapPin, Crown, BadgeCheck, ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import api from "../../api/axios";

const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const defaultForm = {
  requester: "",
  destiny: "",
  details: "",
  date_start: "",
  date_end: "",
  passengers: [],
};

const Field = ({ label, children, required = false }) => (
  <label className="block text-sm">
    <span className="block mb-1 text-gray-700 dark:text-gray-200">
      {label} {required && <span className="text-red-500">*</span>}
    </span>
    {children}
  </label>
);

const Input = (props) => (
  <input
    {...props}
    className={`w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 
      bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 
      focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.className || ""}`}
  />
);

const Textarea = (props) => (
  <textarea
    {...props}
    className={`w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 
      bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 
      focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${props.className || ""}`}
  />
);

const ScheduleEventModal = ({ isOpen, onClose, onSubmit, darkMode = true }) => {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [alert, setAlert] = useState("");

  const [requesterName, setRequesterName] = useState("");
  const [requesterAvatar, setRequesterAvatar] = useState(defaultAvatar);
  const [destinies, setDestinies] = useState([]);
  const [selectedDestiny, setSelectedDestiny] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [passengerInput, setPassengerInput] = useState("");
  const [filteredPassengers, setFilteredPassengers] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [tripType, setTripType] = useState(null);

  // 🐛 Estado de Debug
  const [debugInfo, setDebugInfo] = useState({
    timestamp: null,
    tripType: null,
    formData: null,
    payload: null,
    validation: null,
    response: null,
    error: null
  });

  // 🐛 Função auxiliar para logging estruturado
  const logDebug = (step, data) => {
    const timestamp = new Date().toISOString();
    const debugEntry = {
      timestamp,
      step,
      data: JSON.parse(JSON.stringify(data)) // Deep clone
    };

    console.group(`🔍 DEBUG [${step}] - ${timestamp}`);
    console.log(debugEntry);
    console.groupEnd();

    setDebugInfo(prev => ({
      ...prev,
      [step]: debugEntry
    }));
  };

  useEffect(() => {
    if (isOpen) {
      getCurrentUser();
      fetchSelectData();
      setError("");
      setSuccess("");
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [isOpen]);

  // ✅ Obter usuário logado
  const getCurrentUser = () => {
    try {
      const authData = localStorage.getItem("authData");
      if (authData) {
        const parsed = JSON.parse(authData);
        const user = parsed.user_data || parsed;

        if (user?.user_id) {
          const userId = user.user_id;
          const userName =
            user.nickname ||
            user.user_socialname ||
            user.user_fullname ||
            user.user_full_name ||
            user.user_social_name ||
            "Usuário";

          const userAvatar =
            user.user_avatar && user.user_avatar.trim() !== ""
              ? user.user_avatar
              : defaultAvatar;

          setRequesterName(userName);
          setRequesterAvatar(userAvatar);
          setForm({
            requester: userId,
            destiny: "",
            details: "",
            date_start: "",
            date_end: "",
            passengers: [{ id: userId, is_owner: true }],
          });
        }
      }
    } catch (err) {
      console.error("Erro ao ler authData:", err);
    }
  };

  // Buscar destinos e passageiros
  const fetchSelectData = async () => {
    try {
      setLoading(true);
      const destiniesResponse = await api.get("/destiny/get");
      if (destiniesResponse.status === 200) {
        const list =
          destiniesResponse.data.destiny_data?.map((d) => ({
            id: d.destiny_id,
            name: d.destiny_name,
            type: d.destiny_type,
            status: d.destiny_status,
          })) || [];
        setDestinies(list);
      }

      const passengersResponse = await api.get("/show-users/get");
      if (passengersResponse.status === 200) {
        const list =
          passengersResponse.data.user_data?.map((u) => {
            const nickname =
              u.user_nickname || u.user_socialname || u.user_fullname || "Usuário";
            return {
              id: u.user_id,
              user_nickname: nickname,
              nickname,
              name: nickname,
              email: u.user_email || u.email || null, // 📧 Captura o email
              avatar:
                u.user_avatar && u.user_avatar.trim() !== ""
                  ? u.user_avatar
                  : defaultAvatar,
            };
          }) || [];
        setPassengers(list);
        setFilteredPassengers(list);

        // 🐛 Debug: Verificar emails carregados
        console.group('📧 EMAILS DOS USUÁRIOS CARREGADOS');
        list.forEach(user => {
          console.log(`ID: ${user.id} | Nome: ${user.nickname} | Email: ${user.email || '❌ SEM EMAIL'}`);
        });
        console.groupEnd();
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setError("Erro ao carregar dados do formulário.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDestinySelect = (value) => {
    const found = destinies.find((d) => d.name === value);
    setSelectedDestiny(found || null);
    handleInputChange("destiny", found ? found.id : "");
  };

  // ✅ Adicionar passageiro
  const handlePassengerSelect = (user) => {
    if (form.passengers.length >= 6) {
      setAlert("⚠️ Limite de 6 passageiros atingido");
      setTimeout(() => setAlert(""), 3000);
      return;
    }

    if (!form.passengers.some((fp) => fp.id === user.id)) {
      setForm((prev) => ({
        ...prev,
        passengers: [...prev.passengers, { id: user.id, is_owner: false }],
      }));

      // 🐛 Debug: Verificar email ao adicionar passageiro
      console.log(`✅ Passageiro adicionado: ${user.nickname} | Email: ${user.email || '❌ SEM EMAIL'}`);
    }
    setPassengerInput("");
    setShowDropdown(false);
  };

  const makeResponsible = (id) => {
    setForm((prev) => ({
      ...prev,
      passengers: prev.passengers.map((p) => ({
        ...p,
        is_owner: p.id === id,
      })),
    }));
  };

  const removePassenger = (id) => {
    const target = form.passengers.find((p) => p.id === id);
    if (!target) return;

    if (target.is_owner) {
      const confirmRemove = window.confirm(
        "Tem certeza de que deseja remover o responsável desta viagem?"
      );
      if (!confirmRemove) return;
    }

    setForm((prev) => ({
      ...prev,
      passengers: prev.passengers.filter((p) => p.id !== id),
    }));
  };

  const handlePassengerInput = (value) => {
    setPassengerInput(value);
    setShowDropdown(value.length > 0);
    const filtered = passengers.filter((p) =>
      (p.user_nickname || p.nickname || p.name || "")
        .toLowerCase()
        .includes(value.toLowerCase())
    );
    setFilteredPassengers(filtered);
  };

  // ✅ Validação com debug
  const validateForm = () => {
    const validationSteps = [];

    if (!form.destiny) {
      validationSteps.push({ step: 'destiny_check', passed: false, message: 'Destino não selecionado' });
      setError("Selecione um destino");
      logDebug('VALIDATION_FAILED', { validationSteps });
      return false;
    }
    validationSteps.push({ step: 'destiny_check', passed: true });

    const hasStart = form.date_start && form.date_start.trim() !== "";
    const hasEnd = form.date_end && form.date_end.trim() !== "";

    validationSteps.push({ 
      step: 'dates_check', 
      hasStart, 
      hasEnd, 
      tripType,
      date_start: form.date_start,
      date_end: form.date_end
    });

    if (tripType === "roundtrip") {
      if (!hasStart || !hasEnd) {
        validationSteps.push({ step: 'roundtrip_check', passed: false, message: 'Faltam datas' });
        setError("Preencha data de ida e de retorno");
        logDebug('VALIDATION_FAILED', { validationSteps });
        return false;
      }

      if (new Date(form.date_start) >= new Date(form.date_end)) {
        validationSteps.push({ step: 'date_comparison', passed: false, message: 'Data de retorno inválida' });
        setError("A data de retorno deve ser posterior à data de ida");
        logDebug('VALIDATION_FAILED', { validationSteps });
        return false;
      }
      validationSteps.push({ step: 'roundtrip_check', passed: true });
    }

    if (tripType === "start") {
      if (!hasStart) {
        validationSteps.push({ step: 'start_check', passed: false, message: 'Falta data de partida' });
        setError("Preencha a data/hora de partida");
        logDebug('VALIDATION_FAILED', { validationSteps });
        return false;
      }
      validationSteps.push({ step: 'start_check', passed: true });
    }

    if (tripType === "end") {
      if (!hasEnd) {
        validationSteps.push({ step: 'end_check', passed: false, message: 'Falta data de retorno' });
        setError("Preencha a data/hora de retorno");
        logDebug('VALIDATION_FAILED', { validationSteps });
        return false;
      }
      validationSteps.push({ step: 'end_check', passed: true });
    }

    logDebug('VALIDATION_PASSED', { validationSteps });
    return true;
  };

  // ✅ Criação do evento com debug completo
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ STEP 1: Log do estado inicial
    logDebug('STEP_1_INITIAL_STATE', {
      tripType,
      formData: form,
      requesterName,
      selectedDestiny,
      passengersCount: form.passengers.length
    });

    // ✅ STEP 2: Validação
    const validationResult = {
      hasDestiny: Boolean(form.destiny),
      tripType,
      hasStart: Boolean(form.date_start && form.date_start.trim() !== ""),
      hasEnd: Boolean(form.date_end && form.date_end.trim() !== ""),
      dateStart: form.date_start,
      dateEnd: form.date_end
    };

    logDebug('STEP_2_VALIDATION', validationResult);

    if (!validateForm()) {
      logDebug('STEP_2_VALIDATION_FAILED', {
        error,
        validationResult
      });
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // ✅ STEP 3: Preparação dos passageiros COM VERIFICAÇÃO DE EMAIL
      const passengersPayload = (form.passengers || []).map((p) => {
        const userInfo = passengers.find((u) => u.id === p.id) || {};
        const passengerData = {
          id: p.id,
          is_owner: Boolean(p.is_owner),
          nickname: userInfo.user_nickname || userInfo.nickname || userInfo.name,
          email: userInfo.email || userInfo.user_email || null,
        };

        // 🐛 Debug individual de cada passageiro
        console.log(`📧 Passageiro ${p.id}:`, {
          nickname: passengerData.nickname,
          email: passengerData.email,
          hasEmail: Boolean(passengerData.email),
          rawUserInfo: userInfo
        });

        return passengerData;
      });

      // 🐛 Verificação de emails faltantes
      const passengersWithoutEmail = passengersPayload.filter(p => !p.email);
      if (passengersWithoutEmail.length > 0) {
        console.warn('⚠️ PASSAGEIROS SEM EMAIL:', passengersWithoutEmail);
      }

      logDebug('STEP_3_PASSENGERS_PREPARED', {
        originalPassengers: form.passengers,
        preparedPassengers: passengersPayload,
        emailsCount: {
          total: passengersPayload.length,
          withEmail: passengersPayload.filter(p => p.email).length,
          withoutEmail: passengersWithoutEmail.length
        },
        passengersWithoutEmail
      });

      // ✅ STEP 4: Formatação das datas
      const cleanedDetails = (form.details || "").trim();

      const formattedStart =
        form.date_start && form.date_start.trim() !== ""
          ? form.date_start
          : "1900-01-01T00:00:00";

      const formattedEnd =
        form.date_end && form.date_end.trim() !== ""
          ? form.date_end
          : "1900-01-01T00:00:00";

      logDebug('STEP_4_DATE_FORMATTING', {
        original: {
          date_start: form.date_start,
          date_end: form.date_end
        },
        formatted: {
          formattedStart,
          formattedEnd
        },
        isSentinel: {
          start: formattedStart === "1900-01-01T00:00:00",
          end: formattedEnd === "1900-01-01T00:00:00"
        }
      });

      // ✅ STEP 5: Construção do payload
      const payload = {
        requester: parseInt(form.requester),
        destiny: parseInt(form.destiny),
        details: cleanedDetails === "" ? null : cleanedDetails,
        date_start: formattedStart,
        date_end: formattedEnd,
        passengers: passengersPayload,
      };

      logDebug('STEP_5_PAYLOAD_BUILT', {
        payload,
        payloadSize: JSON.stringify(payload).length,
        tripTypeContext: tripType,
        passengersEmails: passengersPayload.map(p => ({ id: p.id, email: p.email }))
      });

      // 🐛 Log especial para emails no payload
      console.group('📧 EMAILS NO PAYLOAD FINAL');
      passengersPayload.forEach(p => {
        console.log(`${p.nickname}: ${p.email || '❌ SEM EMAIL'}`);
      });
      console.groupEnd();

      // ✅ STEP 6: Envio da requisição
      console.log('📤 ENVIANDO REQUISIÇÃO PARA /events/new');
      const response = await api.post("/events/new", payload);

      logDebug('STEP_6_API_RESPONSE', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });

      if (response.status === 200 || response.status === 201) {
        setSuccess("Evento criado com sucesso!");

        logDebug('STEP_7_SUCCESS', {
          message: 'Evento criado com sucesso',
          responseData: response.data
        });

        setTimeout(() => {
          onSubmit && onSubmit(response.data);
          onClose();
        }, 1500);
      }

    } catch (error) {
      // ✅ STEP 8: Tratamento de erro
      const errorDetails = {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        } : null,
        request: error.request ? {
          readyState: error.request.readyState,
          status: error.request.status,
          responseURL: error.request.responseURL
        } : null,
        stack: error.stack
      };

      logDebug('STEP_8_ERROR', errorDetails);

      console.error("❌ ERRO COMPLETO:", error);
      setError(error.response?.data?.message || "Erro ao criar evento. Tente novamente.");
    } finally {
      setLoading(false);

      logDebug('STEP_9_FINALLY', {
        loading: false,
        timestamp: new Date().toISOString()
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        showModal ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`relative rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6 ${
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

        <h2 className={`text-xl font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
          Criar Novo Evento
        </h2>

        {/* Mensagens */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 rounded-md text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 rounded-md text-green-700 dark:text-green-300">
            {success}
          </div>
        )}
        {alert && (
          <div className="mb-3 flex items-center justify-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 text-yellow-800 dark:text-yellow-200 rounded-md py-2 px-4 animate-pulse shadow">
            {alert} ⚠️
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Solicitante */}
          <Field label="Solicitante">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-blue-600 bg-blue-600 text-white shadow-md w-fit">
              <img
                src={requesterAvatar}
                alt={requesterName}
                className="w-6 h-6 rounded-full border border-white object-cover"
                onError={(e) => (e.target.src = defaultAvatar)}
              />
              <span className="font-medium text-sm">{requesterName}</span>
              <BadgeCheck size={16} className="text-green-300" />
            </div>
          </Field>

          {/* Destino */}
          <Field label="Destino" required>
            <Input
              list="destinies"
              placeholder="Selecione ou busque um destino"
              onChange={(e) => handleDestinySelect(e.target.value)}
              disabled={loading}
            />
            <datalist id="destinies">
              {destinies.map((d) => (
                <option key={d.id} value={d.name} />
              ))}
            </datalist>

            {selectedDestiny && (
              <div
                className={`mt-2 flex items-start gap-2 rounded-lg p-2 border ${
                  darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
                }`}
              >
                <MapPin size={16} className="text-blue-500 mt-0.5" />
                <div>
                  <p className={`${darkMode ? "text-gray-200" : "text-gray-700"} font-medium`}>
                    {selectedDestiny.name}
                  </p>
                </div>
              </div>
            )}
          </Field>

          {/* Detalhes */}
          <Field label="Detalhes do Evento">
            <Textarea
              value={form.details}
              onChange={(e) => handleInputChange("details", e.target.value)}
              placeholder="Descreva os detalhes do evento..."
              rows={4}
            />
          </Field>

          {/* Tipo de Evento */}
          <Field label="Tipo de Evento" required>
            <div className="flex gap-2 w-full">

              {/* Ida e Retorno */}
              <button
                type="button"
                onClick={() => {
                  setTripType("roundtrip");
                  setForm(prev => ({ ...prev, date_start: "", date_end: "" }));
                }}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all
                  ${
                    tripType === "roundtrip"
                      ? "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300"
                      : darkMode
                        ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <ArrowUpDown size={16} />
                Partida e Retorno
              </button>

              {/* Apenas Ida */}
              <button
                type="button"
                onClick={() => {
                  setTripType("start");
                  setForm(prev => ({ ...prev, date_start: "", date_end: "" }));
                }}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all
                  ${
                    tripType === "start"
                      ? "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300"
                      : darkMode
                        ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <ArrowUp size={16} />
                Apenas Partida
              </button>

              {/* Apenas Retorno */}
              <button
                type="button"
                onClick={() => {
                  setTripType("end");
                  setForm(prev => ({ ...prev, date_start: "", date_end: "" }));
                }}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all
                  ${
                    tripType === "end"
                      ? "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300"
                      : darkMode
                        ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <ArrowDown size={16} />
                Apenas Retorno
              </button>

            </div>
          </Field>

          {/* Datas Dinâmicas */}
          {tripType && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {(tripType === "roundtrip" || tripType === "start") && (
                <Field label="Data/Hora de Partida">
                  <Input
                    type="datetime-local"
                    step="60"
                    value={form.date_start}
                    onChange={(e) => handleInputChange("date_start", e.target.value)}
                  />
                </Field>
              )}

              {(tripType === "roundtrip" || tripType === "end") && (
                <Field label="Data/Hora de Retorno">
                  <Input
                    type="datetime-local"
                    step="60"
                    value={form.date_end}
                    onChange={(e) => handleInputChange("date_end", e.target.value)}
                  />
                </Field>
              )}

            </div>
          )}

          {/* Passageiros */}
          <Field label="Passageiros">
            {/* Campo de adicionar passageiro */}
            <div className="mb-4 relative">
              <Input
                type="text"
                placeholder="Adicionar passageiro..."
                value={passengerInput}
                onChange={(e) => handlePassengerInput(e.target.value)}
                onFocus={() => setShowDropdown(passengerInput.length > 0)}
              />

              {showDropdown && filteredPassengers.length > 0 && (
                <div
                  className={`absolute z-20 mt-1 w-full rounded-md border shadow-lg max-h-48 overflow-auto ${
                    darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                  }`}
                >
                  {filteredPassengers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handlePassengerSelect(user)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 ${
                        darkMode ? "text-gray-100" : "text-gray-800"
                      }`}
                    >
                      <img
                        src={user.avatar}
                        alt={user.user_nickname}
                        className="w-6 h-6 rounded-full object-cover"
                        onError={(e) => (e.target.src = defaultAvatar)}
                      />
                      <div className="flex-1">
                        <span className="text-sm block">{user.user_nickname}</span>
                        {user.email && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {user.email}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {form.passengers.map((p) => {
                const data = passengers.find((u) => u.id === p.id);
                const avatarUrl = data?.avatar || defaultAvatar;
                const hasEmail = Boolean(data?.email);

                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                      p.is_owner
                        ? "border-yellow-300 bg-blue-600 text-white"
                        : darkMode
                        ? "border-gray-600 text-gray-200"
                        : "border-gray-300 text-gray-700"
                    }`}
                    title={hasEmail ? `Email: ${data.email}` : 'Sem email cadastrado'}
                  >
                    <img
                      src={avatarUrl}
                      alt={data?.user_nickname || data?.nickname || data?.name}
                      className="w-6 h-6 rounded-full object-cover"
                      onError={(e) => (e.target.src = defaultAvatar)}
                    />
                    <span className="text-sm font-medium">
                      {data?.user_nickname || data?.nickname || data?.name || `Usuário ${p.id}`}
                    </span>
                    {!hasEmail && (
                      <span className="text-xs text-yellow-400" title="Sem email">⚠️</span>
                    )}
                    {p.is_owner ? (
                      <Crown size={15} className="text-yellow-300" />
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
                      className="ml-1 text-xs hover:text-red-400 transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </Field>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            {/* 🐛 Botão de Debug (apenas em desenvolvimento) */}
            {process.env.NODE_ENV === 'development' && (
              <button
                type="button"
                onClick={() => {
                  console.clear();
                  console.log('📊 ESTADO COMPLETO DO DEBUG:', debugInfo);
                  console.log('📋 ESTADO ATUAL DO FORM:', form);
                  console.log('🎯 TIPO DE VIAGEM:', tripType);
                  console.group('📧 EMAILS ATUAIS DOS PASSAGEIROS');
                  form.passengers.forEach(p => {
                    const user = passengers.find(u => u.id === p.id);
                    console.log(`${user?.nickname || p.id}: ${user?.email || '❌ SEM EMAIL'}`);
                  });
                  console.groupEnd();
                }}
                className="px-3 py-1 text-xs rounded bg-purple-600 hover:bg-purple-500 text-white"
              >
                🐛 Ver Debug Completo
              </button>
            )}

            <button
              type="button"
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
              type="submit"
              className={`px-4 py-2 rounded-md font-medium text-sm cursor-pointer ${
                darkMode
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              } ${(loading || form.passengers.length === 0) ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={loading || form.passengers.length === 0}
            >
              {loading ? "Criando..." : "Criar Evento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleEventModal;



















// import { useState, useEffect } from "react";
// import { X, MapPin, Crown, BadgeCheck, ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
// import api from "../../api/axios";

// const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

// const defaultForm = {
//   requester: "",
//   destiny: "",
//   details: "",
//   date_start: "",
//   date_end: "",
//   passengers: [],
// };

// const Field = ({ label, children, required = false }) => (
//   <label className="block text-sm">
//     <span className="block mb-1 text-gray-700 dark:text-gray-200">
//       {label} {required && <span className="text-red-500">*</span>}
//     </span>
//     {children}
//   </label>
// );

// const Input = (props) => (
//   <input
//     {...props}
//     className={`w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 
//       bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 
//       focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.className || ""}`}
//   />
// );

// const Textarea = (props) => (
//   <textarea
//     {...props}
//     className={`w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 
//       bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 
//       focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${props.className || ""}`}
//   />
// );

// const ScheduleEventModal = ({ isOpen, onClose, onSubmit, darkMode = true }) => {
//   const [form, setForm] = useState(defaultForm);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [alert, setAlert] = useState("");

//   const [requesterName, setRequesterName] = useState("");
//   const [requesterAvatar, setRequesterAvatar] = useState(defaultAvatar);
//   const [destinies, setDestinies] = useState([]);
//   const [selectedDestiny, setSelectedDestiny] = useState(null);
//   const [passengers, setPassengers] = useState([]);
//   const [passengerInput, setPassengerInput] = useState("");
//   const [filteredPassengers, setFilteredPassengers] = useState([]);

//   const [showModal, setShowModal] = useState(false);
//   const [showDropdown, setShowDropdown] = useState(false);

//   // Tipo de Evento: ida e retorno, só ida, só retorno
//   // const [tripType, setTripType] = useState("roundtrip"); // roundtrip | start | end
//   const [tripType, setTripType] = useState(null);




//   useEffect(() => {
//     if (isOpen) {
//       getCurrentUser();
//       fetchSelectData();
//       setError("");
//       setSuccess("");
//       setShowModal(true);
//     } else {
//       setShowModal(false);
//     }
//   }, [isOpen]);

//   // ✅ Obter usuário logado
//   const getCurrentUser = () => {
//     try {
//       const authData = localStorage.getItem("authData");
//       if (authData) {
//         const parsed = JSON.parse(authData);
//         const user = parsed.user_data || parsed;

//         if (user?.user_id) {
//           const userId = user.user_id;
//           const userName =
//             user.nickname ||
//             user.user_socialname ||
//             user.user_fullname ||
//             user.user_full_name ||
//             user.user_social_name ||
//             "Usuário";

//             // console.log(userName)

//           const userAvatar =
//             user.user_avatar && user.user_avatar.trim() !== ""
//               ? user.user_avatar
//               : defaultAvatar;

//           setRequesterName(userName);
//           setRequesterAvatar(userAvatar);
//           setForm({
//             requester: userId,
//             destiny: "",
//             details: "",
//             date_start: "",
//             date_end: "",
//             passengers: [{ id: userId, is_owner: true }],
//           });
//         }
//       }
//     } catch (err) {
//       console.error("Erro ao ler authData:", err);
//     }
//   };

//   // Buscar destinos e passageiros
//   const fetchSelectData = async () => {
//     try {
//       setLoading(true);
//       const destiniesResponse = await api.get("/destiny/get");
//       if (destiniesResponse.status === 200) {
//         const list =
//           destiniesResponse.data.destiny_data?.map((d) => ({
//             id: d.destiny_id,
//             name: d.destiny_name,
//             type: d.destiny_type,
//             status: d.destiny_status,
//           })) || [];
//         setDestinies(list);
//       }

//       const passengersResponse = await api.get("/show-users/get");
//       if (passengersResponse.status === 200) {
//         const list =
//           passengersResponse.data.user_data?.map((u) => {
//             const nickname =
//               u.user_nickname || u.user_socialname || u.user_fullname || "Usuário";
//             return {
//               id: u.user_id,
//               user_nickname: nickname,
//               nickname,
//               name: nickname,
//               avatar:
//                 u.user_avatar && u.user_avatar.trim() !== ""
//                   ? u.user_avatar
//                   : defaultAvatar,
//             };
//           }) || [];
//         setPassengers(list);
//         setFilteredPassengers(list);
//       }
//     } catch (error) {
//       console.error("Erro ao buscar dados:", error);
//       setError("Erro ao carregar dados do formulário.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInputChange = (field, value) => {
//     setForm((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleDestinySelect = (value) => {
//     const found = destinies.find((d) => d.name === value);
//     setSelectedDestiny(found || null);
//     handleInputChange("destiny", found ? found.id : "");
//   };

//   // ✅ Adicionar passageiro
//   const handlePassengerSelect = (user) => {
//     if (form.passengers.length >= 6) {
//       setAlert("⚠️ Limite de 6 passageiros atingido");
//       setTimeout(() => setAlert(""), 3000);
//       return;
//     }

//     if (!form.passengers.some((fp) => fp.id === user.id)) {
//       setForm((prev) => ({
//         ...prev,
//         passengers: [...prev.passengers, { id: user.id, is_owner: false }],
//       }));
//     }
//     setPassengerInput("");
//     setShowDropdown(false);
//   };

//   const makeResponsible = (id) => {
//     setForm((prev) => ({
//       ...prev,
//       passengers: prev.passengers.map((p) => ({
//         ...p,
//         is_owner: p.id === id,
//       })),
//     }));
//   };

//   const removePassenger = (id) => {
//     const target = form.passengers.find((p) => p.id === id);
//     if (!target) return;

//     if (target.is_owner) {
//       const confirmRemove = window.confirm(
//         "Tem certeza de que deseja remover o responsável desta viagem?"
//       );
//       if (!confirmRemove) return;
//     }

//     setForm((prev) => ({
//       ...prev,
//       passengers: prev.passengers.filter((p) => p.id !== id),
//     }));
//   };

//   const handlePassengerInput = (value) => {
//     setPassengerInput(value);
//     setShowDropdown(value.length > 0);
//     const filtered = passengers.filter((p) =>
//       (p.user_nickname || p.nickname || p.name || "")
//         .toLowerCase()
//         .includes(value.toLowerCase())
//     );
//     setFilteredPassengers(filtered);
//   };

//   // ✅ Validação com pelo menos uma data preenchida
//   const validateForm = () => {
//     if (!form.destiny) {
//       setError("Selecione um destino");
//       return false;
//     }

//     const hasStart = form.date_start && form.date_start.trim() !== "";
//     const hasEnd = form.date_end && form.date_end.trim() !== "";

//     // --- NOVAS REGRAS DO TIPO DE EVENTO ---
//     if (tripType === "roundtrip") {
//       if (!hasStart || !hasEnd) {
//         setError("Preencha data de ida e de retorno");
//         return false;
//       }

//       if (new Date(form.date_start) >= new Date(form.date_end)) {
//         setError("A data de retorno deve ser posterior à data de ida");
//         return false;
//       }
//     }

//     if (tripType === "start") {
//       if (!hasStart) {
//         setError("Preencha a data/hora de partida");
//         return false;
//       }
//     }

//     if (tripType === "end") {
//       if (!hasEnd) {
//         setError("Preencha a data/hora de retorno");
//         return false;
//       }
//     }

//     return true;
//   };
  

//   // const validateForm = () => {
//   //   if (!form.destiny) return setError("Selecione um destino"), false;

//   //   const hasStart = Boolean(form.date_start);
//   //   const hasEnd = Boolean(form.date_end);

//   //   if (!hasStart && !hasEnd)
//   //     return setError("Preencha pelo menos a data/hora de início ou de fim"), false;

//   //   // Se ambas existem, só compara quando nenhuma é sentinela de 1900
//   //   if (hasStart && hasEnd) {
//   //     const s = String(form.date_start || "");
//   //     const e = String(form.date_end || "");
//   //     const isSentinelStart = s.startsWith("1900-") || s === "1900-01-01T00:00:00";
//   //     const isSentinelEnd = e.startsWith("1900-") || e === "1900-01-01T00:00:00";
//   //     if (!isSentinelStart && !isSentinelEnd) {
//   //       if (new Date(form.date_start) >= new Date(form.date_end))
//   //         return setError("A data de fim deve ser posterior à de início"), false;
//   //     }
//   //   }

//   //   return true;
//   // };

//   // ✅ Criação do evento
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validateForm()) return;

//     try {
//       setLoading(true);
//       setError("");
//       setSuccess("");

//       const passengersPayload = (form.passengers || []).map((p) => {
//         const userInfo = passengers.find((u) => u.id === p.id) || {};
//         return {
//           id: p.id,
//           is_owner: Boolean(p.is_owner),
//           nickname: userInfo.user_nickname || userInfo.nickname || userInfo.name,
//           email: userInfo.email || userInfo.user_email,
//         };
//       });

//       const cleanedDetails = (form.details || "").trim();

//       // 👇 Usa timestamp válido (evita erro de formato)
//       const formattedStart =
//         form.date_start && form.date_start.trim() !== ""
//           ? form.date_start
//           : "1900-01-01T00:00:00";

//       const formattedEnd =
//         form.date_end && form.date_end.trim() !== ""
//           ? form.date_end
//           : "1900-01-01T00:00:00";

//       const payload = {
//         requester: parseInt(form.requester),
//         destiny: parseInt(form.destiny),
//         details: cleanedDetails === "" ? null : cleanedDetails,
//         date_start: formattedStart,
//         date_end: formattedEnd,
//         passengers: passengersPayload,
//       };

//       const response = await api.post("/events/new", payload);
//       if (response.status === 200 || response.status === 201) {
//         setSuccess("Evento criado com sucesso!");
//         setTimeout(() => {
//           onSubmit && onSubmit(response.data);
//           onClose();
//         }, 1500);
//       }
//     } catch (error) {
//       console.error("Erro ao criar evento:", error);
//       setError(error.response?.data?.message || "Erro ao criar evento. Tente novamente.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div
//       className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
//         showModal ? "opacity-100 scale-100" : "opacity-0 scale-95"
//       }`}
//     >
//       <div
//         className="absolute inset-0 bg-black/50 backdrop-blur-sm"
//         onClick={onClose}
//       />

//       <div
//         className={`relative rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6 ${
//           darkMode ? "bg-gray-900" : "bg-white"
//         } transition-all duration-300`}
//       >
//         {/* Botão fechar */}
//         <button
//           className={`absolute right-3 top-3 cursor-pointer ${
//             darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-800"
//           }`}
//           onClick={onClose}
//         >
//           <X size={20} />
//         </button>

//         <h2 className={`text-xl font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
//           Criar Novo Evento
//         </h2>

//         {/* Mensagens */}
//         {error && (
//           <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 rounded-md text-red-700 dark:text-red-300">
//             {error}
//           </div>
//         )}
//         {success && (
//           <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 rounded-md text-green-700 dark:text-green-300">
//             {success}
//           </div>
//         )}
//         {alert && (
//           <div className="mb-3 flex items-center justify-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 text-yellow-800 dark:text-yellow-200 rounded-md py-2 px-4 animate-pulse shadow">
//             {alert} ⚠️
//           </div>
//         )}

//         {/* Formulário */}
//         <form onSubmit={handleSubmit} className="space-y-4">
//           {/* Solicitante */}
//           <Field label="Solicitante">
//             <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-blue-600 bg-blue-600 text-white shadow-md w-fit">
//               <img
//                 src={requesterAvatar}
//                 alt={requesterName}
//                 className="w-6 h-6 rounded-full border border-white object-cover"
//                 onError={(e) => (e.target.src = defaultAvatar)}
//               />
//               <span className="font-medium text-sm">{requesterName}</span>
//               <BadgeCheck size={16} className="text-green-300" />
//             </div>
//           </Field>

//           {/* Destino */}
//           <Field label="Destino" required>
//             <Input
//               list="destinies"
//               placeholder="Selecione ou busque um destino"
//               onChange={(e) => handleDestinySelect(e.target.value)}
//               disabled={loading}
//             />
//             <datalist id="destinies">
//               {destinies.map((d) => (
//                 <option key={d.id} value={d.name} />
//               ))}
//             </datalist>

//             {selectedDestiny && (
//               <div
//                 className={`mt-2 flex items-start gap-2 rounded-lg p-2 border ${
//                   darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
//                 }`}
//               >
//                 <MapPin size={16} className="text-blue-500 mt-0.5" />
//                 <div>
//                   <p className={`${darkMode ? "text-gray-200" : "text-gray-700"} font-medium`}>
//                     {selectedDestiny.name}
//                   </p>
//                 </div>
//               </div>
//             )}
//           </Field>

//           {/* Detalhes */}
//           <Field label="Detalhes do Evento">
//             <Textarea
//               value={form.details}
//               onChange={(e) => handleInputChange("details", e.target.value)}
//               placeholder="Descreva os detalhes do evento..."
//               rows={4}
//             />
//           </Field>

//           {/* Tipo de Evento */}
// <Field label="Tipo de Evento" required>
//   <div className="flex gap-2 w-full">

//     {/* Ida e Retorno */}
//     <button
//       type="button"
//       onClick={() => {
//         setTripType("roundtrip");
//         setForm(prev => ({ ...prev, date_start: "", date_end: "" }));
//       }}
//       className={`
//         flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all
//         ${
//           tripType === "roundtrip"
//             ? "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300"
//             : darkMode
//               ? "border-gray-700 text-gray-300 hover:bg-gray-800"
//               : "border-gray-300 text-gray-700 hover:bg-gray-100"
//         }
//       `}
//     >
//       <ArrowUpDown size={16} />
//       Partida e Retorno
//     </button>

//     {/* Apenas Ida */}
//     <button
//       type="button"
//       onClick={() => {
//         setTripType("start");
//         setForm(prev => ({ ...prev, date_start: "", date_end: "" }));
//       }}
//       className={`
//         flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all
//         ${
//           tripType === "start"
//             ? "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300"
//             : darkMode
//               ? "border-gray-700 text-gray-300 hover:bg-gray-800"
//               : "border-gray-300 text-gray-700 hover:bg-gray-100"
//         }
//       `}
//     >
//       <ArrowUp size={16} />
//       Apenas Partida
//     </button>

//     {/* Apenas Retorno */}
//     <button
//       type="button"
//       onClick={() => {
//         setTripType("end");
//         setForm(prev => ({ ...prev, date_start: "", date_end: "" }));
//       }}
//       className={`
//         flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all
//         ${
//           tripType === "end"
//             ? "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300"
//             : darkMode
//               ? "border-gray-700 text-gray-300 hover:bg-gray-800"
//               : "border-gray-300 text-gray-700 hover:bg-gray-100"
//         }
//       `}
//     >
//       <ArrowDown size={16} />
//       Apenas Retorno
//     </button>

//   </div>
// </Field>








//           {/* Datas Dinâmicas */}
// {tripType && (
//   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

//     {(tripType === "roundtrip" || tripType === "start") && (
//       <Field label="Data/Hora de Partida">
//         <Input
//           type="datetime-local"
//           step="60"
//           value={form.date_start}
//           onChange={(e) => handleInputChange("date_start", e.target.value)}
//         />
//       </Field>
//     )}

//     {(tripType === "roundtrip" || tripType === "end") && (
//       <Field label="Data/Hora de Retorno">
//         <Input
//           type="datetime-local"
//           step="60"
//           value={form.date_end}
//           onChange={(e) => handleInputChange("date_end", e.target.value)}
//         />
//       </Field>
//     )}

//   </div>
// )}



//           {/* Passageiros */}
//           <Field label="Passageiros">
//             {/* Campo de adicionar passageiro */}
//             <div className="mb-4 relative">
//               <Input
//                 type="text"
//                 placeholder="Adicionar passageiro..."
//                 value={passengerInput}
//                 onChange={(e) => handlePassengerInput(e.target.value)}
//                 onFocus={() => setShowDropdown(passengerInput.length > 0)}
//               />

//               {showDropdown && filteredPassengers.length > 0 && (
//                 <div
//                   className={`absolute z-20 mt-1 w-full rounded-md border shadow-lg max-h-48 overflow-auto ${
//                     darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
//                   }`}
//                 >
//                   {filteredPassengers.map((user) => (
//                     <button
//                       key={user.id}
//                       type="button"
//                       onClick={() => handlePassengerSelect(user)}
//                       className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 ${
//                         darkMode ? "text-gray-100" : "text-gray-800"
//                       }`}
//                     >
//                       <img
//                         src={user.avatar}
//                         alt={user.user_nickname}
//                         className="w-6 h-6 rounded-full object-cover"
//                         onError={(e) => (e.target.src = defaultAvatar)}
//                       />
//                       <span className="text-sm">{user.user_nickname}</span>
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>

//             <div className="flex flex-wrap gap-2">
//               {form.passengers.map((p) => {
//                 const data = passengers.find((u) => u.id === p.id);
//                 const avatarUrl = data?.avatar || defaultAvatar;
//                 return (
//                   <div
//                     key={p.id}
//                     className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
//                       p.is_owner
//                         ? "border-yellow-300 bg-blue-600 text-white"
//                         : darkMode
//                         ? "border-gray-600 text-gray-200"
//                         : "border-gray-300 text-gray-700"
//                     }`}
//                   >
//                     <img
//                       src={avatarUrl}
//                       alt={data?.user_nickname || data?.nickname || data?.name}
//                       className="w-6 h-6 rounded-full object-cover"
//                       onError={(e) => (e.target.src = defaultAvatar)}
//                     />
//                     <span className="text-sm font-medium">
//                       {data?.user_nickname || data?.nickname || data?.name || `Usuário ${p.id}`}
//                     </span>
//                     {p.is_owner ? (
//                       <Crown size={15} className="text-yellow-300" />
//                     ) : (
//                       <button
//                         type="button"
//                         onClick={() => makeResponsible(p.id)}
//                         className="text-xs text-yellow-500 hover:text-yellow-400"
//                         title="Tornar responsável"
//                       >
//                         <Crown size={12} className="text-gray-500" />
//                       </button>
//                     )}
//                     <button
//                       type="button"
//                       onClick={() => removePassenger(p.id)}
//                       className="ml-1 text-xs hover:text-red-400 transition"
//                     >
//                       <X size={12} />
//                     </button>
//                   </div>
//                 );
//               })}
//             </div>
//           </Field>

//           {/* Botões */}
//           <div className="flex justify-end gap-3 pt-4">
//             <button
//               type="button"
//               onClick={onClose}
//               className={`px-4 py-2 rounded-md font-medium text-sm cursor-pointer ${
//                 darkMode
//                   ? "bg-gray-700 hover:bg-gray-600 text-white"
//                   : "bg-gray-200 hover:bg-gray-300 text-gray-700"
//               }`}
//             >
//               Cancelar
//             </button>
//             <button
//               type="submit"
//               className={`px-4 py-2 rounded-md font-medium text-sm cursor-pointer ${
//                 darkMode
//                   ? "bg-blue-600 hover:bg-blue-500 text-white"
//                   : "bg-blue-500 hover:bg-blue-600 text-white"
//               } ${(loading || form.passengers.length === 0) ? "opacity-50 cursor-not-allowed" : ""}`}
//               disabled={loading || form.passengers.length === 0}
//             >
//               {loading ? "Criando..." : "Criar Evento"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default ScheduleEventModal;


















// import { useState, useEffect } from "react";
// import { X, MapPin, Crown, BadgeCheck } from "lucide-react";
// import api from "../../api/axios";

// const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

// const defaultForm = {
//   requester: "",
//   destiny: "",
//   details: "",
//   date_start: "",
//   date_end: "",
//   passengers: [],
// };

// const Field = ({ label, children, required = false }) => (
//   <label className="block text-sm">
//     <span className="block mb-1 text-gray-700 dark:text-gray-200">
//       {label} {required && <span className="text-red-500">*</span>}
//     </span>
//     {children}
//   </label>
// );

// const Input = (props) => (
//   <input
//     {...props}
//     className={`w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 
//       bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 
//       focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.className || ""}`}
//   />
// );

// const Textarea = (props) => (
//   <textarea
//     {...props}
//     className={`w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 
//       bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 
//       focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${props.className || ""}`}
//   />
// );

// const ScheduleEventModal = ({ isOpen, onClose, onSubmit, darkMode = true }) => {
//   const [form, setForm] = useState(defaultForm);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [alert, setAlert] = useState("");

//   const [requesterName, setRequesterName] = useState("");
//   const [requesterAvatar, setRequesterAvatar] = useState(defaultAvatar);
//   const [destinies, setDestinies] = useState([]);
//   const [selectedDestiny, setSelectedDestiny] = useState(null);
//   const [passengers, setPassengers] = useState([]);
//   const [passengerInput, setPassengerInput] = useState("");
//   const [filteredPassengers, setFilteredPassengers] = useState([]);

//   const [showModal, setShowModal] = useState(false);
//   const [showDropdown, setShowDropdown] = useState(false);

//   useEffect(() => {
//     if (isOpen) {
//       getCurrentUser();
//       fetchSelectData();
//       setError("");
//       setSuccess("");
//       setShowModal(true);
//     } else {
//       setShowModal(false);
//     }
//   }, [isOpen]);

//   // ✅ Obter usuário logado
//   const getCurrentUser = () => {
//     try {
//       const authData = localStorage.getItem("authData");
//       if (authData) {
//         const parsed = JSON.parse(authData);
//         const user = parsed.user_data || parsed;

//         if (user?.user_id) {
//           const userId = user.user_id;
//           const userName =
//             user.nickname ||
//             user.user_socialname ||
//             user.user_fullname ||
//             user.user_full_name ||
//             user.user_social_name ||
//             "Usuário";

//             console.log(userName)

//           const userAvatar =
//             user.user_avatar && user.user_avatar.trim() !== ""
//               ? user.user_avatar
//               : defaultAvatar;

//           setRequesterName(userName);
//           setRequesterAvatar(userAvatar);
//           setForm({
//             requester: userId,
//             destiny: "",
//             details: "",
//             date_start: "",
//             date_end: "",
//             passengers: [{ id: userId, is_owner: true }],
//           });
//         }
//       }
//     } catch (err) {
//       console.error("Erro ao ler authData:", err);
//     }
//   };

//   // Buscar destinos e passageiros
//   const fetchSelectData = async () => {
//     try {
//       setLoading(true);
//       const destiniesResponse = await api.get("/destiny/get");
//       if (destiniesResponse.status === 200) {
//         const list =
//           destiniesResponse.data.destiny_data?.map((d) => ({
//             id: d.destiny_id,
//             name: d.destiny_name,
//             type: d.destiny_type,
//             status: d.destiny_status,
//           })) || [];
//         setDestinies(list);
//       }

//       const passengersResponse = await api.get("/show-users/get");
//       if (passengersResponse.status === 200) {
//         const list =
//           passengersResponse.data.user_data?.map((u) => {
//             const nickname =
//               u.user_nickname || u.user_socialname || u.user_fullname || "Usuário";
//             return {
//               id: u.user_id,
//               user_nickname: nickname,
//               nickname,
//               name: nickname,
//               avatar:
//                 u.user_avatar && u.user_avatar.trim() !== ""
//                   ? u.user_avatar
//                   : defaultAvatar,
//             };
//           }) || [];
//         setPassengers(list);
//         setFilteredPassengers(list);
//       }
//     } catch (error) {
//       console.error("Erro ao buscar dados:", error);
//       setError("Erro ao carregar dados do formulário.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInputChange = (field, value) => {
//     setForm((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleDestinySelect = (value) => {
//     const found = destinies.find((d) => d.name === value);
//     setSelectedDestiny(found || null);
//     handleInputChange("destiny", found ? found.id : "");
//   };

//   // ✅ Adicionar passageiro
//   const handlePassengerSelect = (user) => {
//     if (form.passengers.length >= 6) {
//       setAlert("⚠️ Limite de 6 passageiros atingido");
//       setTimeout(() => setAlert(""), 3000);
//       return;
//     }

//     if (!form.passengers.some((fp) => fp.id === user.id)) {
//       setForm((prev) => ({
//         ...prev,
//         passengers: [...prev.passengers, { id: user.id, is_owner: false }],
//       }));
//     }
//     setPassengerInput("");
//     setShowDropdown(false);
//   };

//   const makeResponsible = (id) => {
//     setForm((prev) => ({
//       ...prev,
//       passengers: prev.passengers.map((p) => ({
//         ...p,
//         is_owner: p.id === id,
//       })),
//     }));
//   };

//   const removePassenger = (id) => {
//     const target = form.passengers.find((p) => p.id === id);
//     if (!target) return;

//     if (target.is_owner) {
//       const confirmRemove = window.confirm(
//         "Tem certeza de que deseja remover o responsável desta viagem?"
//       );
//       if (!confirmRemove) return;
//     }

//     setForm((prev) => ({
//       ...prev,
//       passengers: prev.passengers.filter((p) => p.id !== id),
//     }));
//   };

//   const handlePassengerInput = (value) => {
//     setPassengerInput(value);
//     setShowDropdown(value.length > 0);
//     const filtered = passengers.filter((p) =>
//       (p.user_nickname || p.nickname || p.name || "")
//         .toLowerCase()
//         .includes(value.toLowerCase())
//     );
//     setFilteredPassengers(filtered);
//   };

//   // ✅ Validação com pelo menos uma data preenchida
//   const validateForm = () => {
//     if (!form.destiny) return setError("Selecione um destino"), false;

//     const hasStart = Boolean(form.date_start);
//     const hasEnd = Boolean(form.date_end);

//     if (!hasStart && !hasEnd)
//       return setError("Preencha pelo menos a data/hora de início ou de fim"), false;

//     // Se ambas existem, só compara quando nenhuma é sentinela de 1900
//     if (hasStart && hasEnd) {
//       const s = String(form.date_start || "");
//       const e = String(form.date_end || "");
//       const isSentinelStart = s.startsWith("1900-") || s === "1900-01-01T00:00:00";
//       const isSentinelEnd = e.startsWith("1900-") || e === "1900-01-01T00:00:00";
//       if (!isSentinelStart && !isSentinelEnd) {
//         if (new Date(form.date_start) >= new Date(form.date_end))
//           return setError("A data de fim deve ser posterior à de início"), false;
//       }
//     }

//     return true;
//   };

//   // ✅ Criação do evento
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validateForm()) return;

//     try {
//       setLoading(true);
//       setError("");
//       setSuccess("");

//       const passengersPayload = (form.passengers || []).map((p) => {
//         const userInfo = passengers.find((u) => u.id === p.id) || {};
//         return {
//           id: p.id,
//           is_owner: Boolean(p.is_owner),
//           nickname: userInfo.user_nickname || userInfo.nickname || userInfo.name,
//           email: userInfo.email || userInfo.user_email,
//         };
//       });

//       const cleanedDetails = (form.details || "").trim();

//       // 👇 Usa timestamp válido (evita erro de formato)
//       const formattedStart =
//         form.date_start && form.date_start.trim() !== ""
//           ? form.date_start
//           : "1900-01-01T00:00:00";

//       const formattedEnd =
//         form.date_end && form.date_end.trim() !== ""
//           ? form.date_end
//           : "1900-01-01T00:00:00";

//       const payload = {
//         requester: parseInt(form.requester),
//         destiny: parseInt(form.destiny),
//         details: cleanedDetails === "" ? null : cleanedDetails,
//         date_start: formattedStart,
//         date_end: formattedEnd,
//         passengers: passengersPayload,
//       };

//       const response = await api.post("/events/new", payload);
//       if (response.status === 200 || response.status === 201) {
//         setSuccess("Evento criado com sucesso!");
//         setTimeout(() => {
//           onSubmit && onSubmit(response.data);
//           onClose();
//         }, 1500);
//       }
//     } catch (error) {
//       console.error("Erro ao criar evento:", error);
//       setError(error.response?.data?.message || "Erro ao criar evento. Tente novamente.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div
//       className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
//         showModal ? "opacity-100 scale-100" : "opacity-0 scale-95"
//       }`}
//     >
//       <div
//         className="absolute inset-0 bg-black/50 backdrop-blur-sm"
//         onClick={onClose}
//       />

//       <div
//         className={`relative rounded-xl shadow-xl w-full max-w-2xl mx-4 p-6 ${
//           darkMode ? "bg-gray-900" : "bg-white"
//         } transition-all duration-300`}
//       >
//         {/* Botão fechar */}
//         <button
//           className={`absolute right-3 top-3 cursor-pointer ${
//             darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-800"
//           }`}
//           onClick={onClose}
//         >
//           <X size={20} />
//         </button>

//         <h2 className={`text-xl font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
//           Criar Novo Evento
//         </h2>

//         {/* Mensagens */}
//         {error && (
//           <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 rounded-md text-red-700 dark:text-red-300">
//             {error}
//           </div>
//         )}
//         {success && (
//           <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 rounded-md text-green-700 dark:text-green-300">
//             {success}
//           </div>
//         )}
//         {alert && (
//           <div className="mb-3 flex items-center justify-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 text-yellow-800 dark:text-yellow-200 rounded-md py-2 px-4 animate-pulse shadow">
//             {alert} ⚠️
//           </div>
//         )}

//         {/* Formulário */}
//         <form onSubmit={handleSubmit} className="space-y-4">
//           {/* Solicitante */}
//           <Field label="Solicitante">
//             <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-blue-600 bg-blue-600 text-white shadow-md w-fit">
//               <img
//                 src={requesterAvatar}
//                 alt={requesterName}
//                 className="w-6 h-6 rounded-full border border-white object-cover"
//                 onError={(e) => (e.target.src = defaultAvatar)}
//               />
//               <span className="font-medium text-sm">{requesterName}</span>
//               <BadgeCheck size={16} className="text-green-300" />
//             </div>
//           </Field>

//           {/* Destino */}
//           <Field label="Destino" required>
//             <Input
//               list="destinies"
//               placeholder="Selecione ou busque um destino"
//               onChange={(e) => handleDestinySelect(e.target.value)}
//               disabled={loading}
//             />
//             <datalist id="destinies">
//               {destinies.map((d) => (
//                 <option key={d.id} value={d.name} />
//               ))}
//             </datalist>

//             {selectedDestiny && (
//               <div
//                 className={`mt-2 flex items-start gap-2 rounded-lg p-2 border ${
//                   darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
//                 }`}
//               >
//                 <MapPin size={16} className="text-blue-500 mt-0.5" />
//                 <div>
//                   <p className={`${darkMode ? "text-gray-200" : "text-gray-700"} font-medium`}>
//                     {selectedDestiny.name}
//                   </p>
//                 </div>
//               </div>
//             )}
//           </Field>

//           {/* Detalhes */}
//           <Field label="Detalhes do Evento">
//             <Textarea
//               value={form.details}
//               onChange={(e) => handleInputChange("details", e.target.value)}
//               placeholder="Descreva os detalhes do evento..."
//               rows={4}
//             />
//           </Field>

//           {/* Datas */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <Field label="Data/Hora de Início">
//               <Input
//                 type="datetime-local"
//                 step="60"
//                 value={form.date_start}
//                 onChange={(e) => handleInputChange("date_start", e.target.value)}
//               />
//             </Field>
//             <Field label="Data/Hora de Fim">
//               <Input
//                 type="datetime-local"
//                 step="60"
//                 value={form.date_end}
//                 onChange={(e) => handleInputChange("date_end", e.target.value)}
//               />
//             </Field>
//           </div>

//           {/* Passageiros */}
//           <Field label="Passageiros">
//             {/* Campo de adicionar passageiro */}
//             <div className="mb-4 relative">
//               <Input
//                 type="text"
//                 placeholder="Adicionar passageiro..."
//                 value={passengerInput}
//                 onChange={(e) => handlePassengerInput(e.target.value)}
//                 onFocus={() => setShowDropdown(passengerInput.length > 0)}
//               />

//               {showDropdown && filteredPassengers.length > 0 && (
//                 <div
//                   className={`absolute z-20 mt-1 w-full rounded-md border shadow-lg max-h-48 overflow-auto ${
//                     darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
//                   }`}
//                 >
//                   {filteredPassengers.map((user) => (
//                     <button
//                       key={user.id}
//                       type="button"
//                       onClick={() => handlePassengerSelect(user)}
//                       className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 ${
//                         darkMode ? "text-gray-100" : "text-gray-800"
//                       }`}
//                     >
//                       <img
//                         src={user.avatar}
//                         alt={user.user_nickname}
//                         className="w-6 h-6 rounded-full object-cover"
//                         onError={(e) => (e.target.src = defaultAvatar)}
//                       />
//                       <span className="text-sm">{user.user_nickname}</span>
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>

//             <div className="flex flex-wrap gap-2">
//               {form.passengers.map((p) => {
//                 const data = passengers.find((u) => u.id === p.id);
//                 const avatarUrl = data?.avatar || defaultAvatar;
//                 return (
//                   <div
//                     key={p.id}
//                     className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
//                       p.is_owner
//                         ? "border-yellow-300 bg-blue-600 text-white"
//                         : darkMode
//                         ? "border-gray-600 text-gray-200"
//                         : "border-gray-300 text-gray-700"
//                     }`}
//                   >
//                     <img
//                       src={avatarUrl}
//                       alt={data?.user_nickname || data?.nickname || data?.name}
//                       className="w-6 h-6 rounded-full object-cover"
//                       onError={(e) => (e.target.src = defaultAvatar)}
//                     />
//                     <span className="text-sm font-medium">
//                       {data?.user_nickname || data?.nickname || data?.name || `Usuário ${p.id}`}
//                     </span>
//                     {p.is_owner ? (
//                       <Crown size={15} className="text-yellow-300" />
//                     ) : (
//                       <button
//                         type="button"
//                         onClick={() => makeResponsible(p.id)}
//                         className="text-xs text-yellow-500 hover:text-yellow-400"
//                         title="Tornar responsável"
//                       >
//                         <Crown size={12} className="text-gray-500" />
//                       </button>
//                     )}
//                     <button
//                       type="button"
//                       onClick={() => removePassenger(p.id)}
//                       className="ml-1 text-xs hover:text-red-400 transition"
//                     >
//                       <X size={12} />
//                     </button>
//                   </div>
//                 );
//               })}
//             </div>
//           </Field>

//           {/* Botões */}
//           <div className="flex justify-end gap-3 pt-4">
//             <button
//               type="button"
//               onClick={onClose}
//               className={`px-4 py-2 rounded-md font-medium text-sm cursor-pointer ${
//                 darkMode
//                   ? "bg-gray-700 hover:bg-gray-600 text-white"
//                   : "bg-gray-200 hover:bg-gray-300 text-gray-700"
//               }`}
//             >
//               Cancelar
//             </button>
//             <button
//               type="submit"
//               className={`px-4 py-2 rounded-md font-medium text-sm cursor-pointer ${
//                 darkMode
//                   ? "bg-blue-600 hover:bg-blue-500 text-white"
//                   : "bg-blue-500 hover:bg-blue-600 text-white"
//               } ${(loading || form.passengers.length === 0) ? "opacity-50 cursor-not-allowed" : ""}`}
//               disabled={loading || form.passengers.length === 0}
//             >
//               {loading ? "Criando..." : "Criar Evento"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default ScheduleEventModal;