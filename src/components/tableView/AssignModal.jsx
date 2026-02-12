import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Car, Ticket } from 'lucide-react';
import api from '../../api/axios';

const defaultForm = {
  solicitante: '',
  setorOrigem: '',
  destino: '',
  status: 'Pendente',
  saida: '',
  retorno: '',
  motoristaIda: '',
  motoristaRetorno: '',
  veiculoIda: '',
  veiculoRetorno: '',
  whatsappIda: '',
  whatsappRetorno: '',
};

const Field = ({ label, children }) => (
  <label className="block text-sm mb-3">
    <span className="block mb-1 text-gray-700 dark:text-gray-200">{label}</span>
    {children}
  </label>
);

const maskPhone = (value) =>
  value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{4}).*/, '$1-$2');

const translateStatus = (status) => {
  const map = {
    pending: 'Pendente',
    approved: 'Aprovado',
    'pre approved': 'Pré-Aprovado',
    denied: 'Negado',
    cancelled: 'Cancelado',
    finished: 'Finalizado',
    default: status,
  };
  return map[status?.toLowerCase()] || status || '—';
};

const AssignModal = ({ isOpen, onClose, onSubmit, preset = {}, eventId, onRefresh, events = [] }) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ ...defaultForm, ...preset });
  const [loading, setLoading] = useState(false);

  const [motoristas, setMotoristas] = useState([]);
  const [veiculos, setVeiculos] = useState([]);

  const [voucherIda, setVoucherIda] = useState(false);
  const [voucherRetorno, setVoucherRetorno] = useState(false);

  // 🔹 Novo estado para armazenar informações detalhadas do evento
  const [eventDetails, setEventDetails] = useState(null);

  // 🔹 Buscar detalhes do evento ao abrir o modal
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const id = eventId || preset?.id;
        if (!id) return;

        const res = await api.get(`/events/get/${id}`);
        if (res.status === 200 && res.data) {
          setEventDetails(res.data);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar detalhes do evento:', error);
      }
    };

    if (isOpen) {
      fetchEventDetails();
    }
  }, [isOpen, eventId, preset?.id]);

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setForm({ ...defaultForm, ...preset });
      setVoucherIda(false);
      setVoucherRetorno(false);
    }
  }, [isOpen, preset]);

  // Buscar motoristas
  useEffect(() => {
    api
      .get('/driver/get')
      .then((response) => {
        const dados = response.data['driver_data'];
        if (response.status === 200) setMotoristas(dados);
      })
      .catch((error) => console.error('❌ Drivers - Erro ao buscar motoristas:', error));
  }, []);

  // Buscar veículos
  useEffect(() => {
    api
      .get('/vehicle/get')
      .then((response) => {
        const dados = response.data['vehicle_data'];
        if (response.status === 200) setVeiculos(dados);
      })
      .catch((error) => console.error('❌ Vehicles - Erro ao buscar veículos:', error));
  }, []);

  // Helpers
  const getVehicleIdByPlate = (plate) => veiculos.find((v) => v.plate === plate)?.vehicle_id || null;
  const getDriverIdByName = (name) => motoristas.find((m) => m.driver_name === name)?.driver_id || null;

  // Disponibilidade
  const getAvailableVehicles = () => {
    const currentEventId = eventId || preset?.id;
    const usedVehicleIds = events
      .filter((event) => event.id !== currentEventId)
      .flatMap((event) => [event.vehicle_start, event.vehicle_end])
      .filter(Boolean);
    return veiculos.filter((v) => !usedVehicleIds.includes(v.vehicle_id));
  };

  const getAvailableDrivers = () => {
    const currentEventId = eventId || preset?.id;
    const usedDriverIds = events
      .filter((event) => event.id !== currentEventId)
      .flatMap((event) => [event.driver_start, event.driver_end])
      .filter(Boolean);
    return motoristas.filter((m) => !usedDriverIds.includes(m.driver_id));
  };

  const isStep0Valid = () => {
    if (voucherIda) return true;
    const availableVehicles = getAvailableVehicles();
    const availableDrivers = getAvailableDrivers();
    return (
      form.veiculoIda &&
      form.motoristaIda &&
      availableVehicles.some((v) => v.plate === form.veiculoIda) &&
      availableDrivers.some((m) => m.driver_name === form.motoristaIda)
    );
  };

  const isStep1Valid = () => {
    if (voucherRetorno) return true;
    const availableVehicles = getAvailableVehicles();
    const availableDrivers = getAvailableDrivers();
    return (
      (!form.veiculoRetorno || availableVehicles.some((v) => v.plate === form.veiculoRetorno)) &&
      (!form.motoristaRetorno || availableDrivers.some((m) => m.driver_name === form.motoristaRetorno))
    );
  };

  // === Salvar atribuição ===
  const handleSave = async (nextStep = false) => {
    const id = eventId || preset?.id;
    if (!id) {
      alert('Erro: ID do evento não definido!');
      return;
    }

    try {
      setLoading(true);

      const payload = {};

      const vStart = getVehicleIdByPlate(form.veiculoIda);
      const dStart = getDriverIdByName(form.motoristaIda);
      const vEnd = getVehicleIdByPlate(form.veiculoRetorno);
      const dEnd = getDriverIdByName(form.motoristaRetorno);

      if (!voucherIda && vStart && dStart) {
        payload.vehicle_start_id = vStart;
        payload.driver_start_id = dStart;
      }

      if (!voucherRetorno && vEnd && dEnd) {
        payload.vehicle_end_id = vEnd;
        payload.driver_end_id = dEnd;
      }

      if (Object.keys(payload).length > 0) {
        console.log('📤 Enviando PUT /vehicles-driver-assignment com payload:', payload);
        await api.put(`/events/${id}/vehicles-driver-assignment`, payload);
      } else {
        console.log('⚠️ Nenhum motorista/veículo válido — pulando PUT /vehicles-driver-assignment');
      }

      // === Novo formato do voucher ===
      const hasVoucherTel = form.whatsappIda || form.whatsappRetorno;

      if (hasVoucherTel) {
        const payloadVoucher = {
          tel_start: form.whatsappIda || '',
          tel_end: form.whatsappRetorno || '',
        };

        console.log('🎟️ Enviando PUT /voucher-assignment com payload:', payloadVoucher);
        await api.put(`/events/${id}/voucher-assignment`, payloadVoucher);
      } else {
        console.log('⚠️ Nenhum telefone de voucher informado — PUT /voucher-assignment ignorado');
      }

      if (nextStep) setStep(1);
      else {
        alert('✅ Transporte/voucher atribuídos com sucesso!');
        onSubmit?.(form);
        onRefresh?.();
        onClose();
      }
    } catch (err) {
      console.error('❌ Erro ao salvar atribuição:', err);
      alert('Erro ao atribuir transporte/voucher.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatCreatedAt = (value) => {
    if (!value) return "—";

    // Se vier no formato ISO: "2025-11-14T15:40:00"
    if (value.includes("T")) {
      return value.replace("T", " ").slice(0, 16);
    }

    // Se vier em formato SQL: "2025-11-14 15:40:00"
    if (value.includes("-") && value.includes(":")) {
      return value.slice(0, 16);
    }

    // Se vier no formato brasileiro já formatado: "14/11/2025 15:40"
    return value;
  };
  
  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-md transition-all duration-300"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-3xl mx-4 p-5">
        <button
          className="absolute right-3 top-3 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {/* === CARD DE VISUALIZAÇÃO === */}
        <div className="mb-5 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
          <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-100">
            Dados da Solicitação -
          </h4>

          <p className="text-sm mb-4 text-gray-600 dark:text-gray-400">
            Código:{" "}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {eventDetails?.code || preset?.code || "—"}
            </span>

            {" — Criado em "}
            <span className="italic">
              {formatCreatedAt(eventDetails?.created_at)}
            </span>
          </p>



          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="text-gray-800 dark:text-gray-400">
              <strong>Solicitante:</strong>{' '}
              {eventDetails?.requester_name || preset.requester_name || preset.solicitante || '—'}
            </div>
            <div className="text-gray-800 dark:text-gray-400">
              <strong>Setor Origem:</strong>
            </div>
            <div className="text-gray-800 dark:text-gray-400">
              <strong>Destino:</strong> {eventDetails?.destiny?.name || eventDetails?.details || '—'}
            </div>
            <div className="text-gray-800 dark:text-gray-400">
              <strong>Status:</strong>{' '}
              {translateStatus(eventDetails?.status_event || preset.status)}
            </div>
            <div className="text-gray-800 dark:text-gray-400">
              <strong>Saída:</strong> {eventDetails?.date_start || preset.saida || '—'}
            </div>
            <div className="text-gray-800 dark:text-gray-400">
              <strong>Retorno:</strong> {eventDetails?.date_end || preset.retorno || '—'}
            </div>
            <div className="text-gray-800 dark:text-gray-400 md:col-span-2">
              <strong>Detalhes:</strong> {eventDetails?.details || preset.details || '—'}
            </div>
          </div>
        </div>

        {/* === FORM === */}
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Atribuir Transporte
        </h3>

        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
          {step === 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200">
                  Informações de PARTIDA
                </h4>
                <button
                  onClick={() => setVoucherIda(!voucherIda)}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  title={voucherIda ? 'Voltar aos campos de motorista/veículo' : 'Ativar voucher'}
                >
                  {voucherIda ? (
                    <Car size={20} className="text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Ticket size={20} className="text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              </div>

              {voucherIda ? (
                <Field label="Telefone (Voucher IDA)">
                  <input
                    type="tel"
                    maxLength={15}
                    value={form.whatsappIda}
                    onChange={(e) =>
                      setForm({ ...form, whatsappIda: maskPhone(e.target.value) })
                    }
                    placeholder="(99) 99999-9999"
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                  />
                </Field>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Veículo de IDA">
                    <input
                      list="veiculosIda"
                      value={form.veiculoIda}
                      onChange={(e) => setForm({ ...form, veiculoIda: e.target.value })}
                      placeholder="Digite ou selecione um veículo"
                      className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                    />
                    <datalist id="veiculosIda">
                      {getAvailableVehicles().map((v) => (
                        <option key={v.vehicle_id} value={v.plate} />
                      ))}
                    </datalist>
                  </Field>

                  <Field label="Motorista de IDA">
                    <input
                      list="motoristasIda"
                      value={form.motoristaIda}
                      onChange={(e) => setForm({ ...form, motoristaIda: e.target.value })}
                      placeholder="Digite ou selecione um motorista"
                      className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                    />
                    <datalist id="motoristasIda">
                      {getAvailableDrivers().map((m) => (
                        <option key={m.driver_id} value={m.driver_name} />
                      ))}
                    </datalist>
                  </Field>
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200">
                  Informações de RETORNO
                </h4>
                <button
                  onClick={() => setVoucherRetorno(!voucherRetorno)}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  title={
                    voucherRetorno
                      ? 'Voltar aos campos de motorista/veículo'
                      : 'Ativar voucher'
                  }
                >
                  {voucherRetorno ? (
                    <Car size={20} className="text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Ticket size={20} className="text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              </div>

              {voucherRetorno ? (
                <Field label="Telefone (Voucher RETORNO)">
                  <input
                    type="tel"
                    maxLength={15}
                    value={form.whatsappRetorno}
                    onChange={(e) =>
                      setForm({ ...form, whatsappRetorno: maskPhone(e.target.value) })
                    }
                    placeholder="(99) 99999-9999"
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                  />
                </Field>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Veículo de RETORNO">
                    <input
                      list="veiculosRetorno"
                      value={form.veiculoRetorno}
                      onChange={(e) => setForm({ ...form, veiculoRetorno: e.target.value })}
                      placeholder="Digite ou selecione um veículo"
                      className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                    />
                    <datalist id="veiculosRetorno">
                      {getAvailableVehicles().map((v) => (
                        <option key={v.vehicle_id} value={v.plate} />
                      ))}
                    </datalist>
                  </Field>

                  <Field label="Motorista de RETORNO">
                    <input
                      list="motoristasRetorno"
                      value={form.motoristaRetorno}
                      onChange={(e) => setForm({ ...form, motoristaRetorno: e.target.value })}
                      placeholder="Digite ou selecione um motorista"
                      className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                    />
                    <datalist id="motoristasRetorno">
                      {getAvailableDrivers().map((m) => (
                        <option key={m.driver_id} value={m.driver_name} />
                      ))}
                    </datalist>
                  </Field>
                </div>
              )}
            </>
          )}
        </div>

        {/* === NAVEGAÇÃO === */}
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-100 disabled:opacity-50 cursor-pointer"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || loading}
          >
            <ChevronLeft size={18} /> Voltar
          </button>

          {step < 1 ? (
            <button
              type="button"
              className={`flex items-center gap-2 px-4 py-2 rounded text-white ${
                isStep0Valid()
                  ? 'bg-blue-600 cursor-pointer'
                  : 'bg-blue-600 cursor-pointer'
              }`}
              onClick={() => handleSave(true)}
            >
              {loading ? 'Salvando...' : (
                <>
                  Avançar <ChevronRight size={18} />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="px-4 py-2 rounded bg-green-600 text-white cursor-pointer disabled:opacity-50"
              onClick={() => handleSave(false)}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Concluir Atribuição'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignModal;





































// import { useEffect, useState } from 'react';
// import { X, ChevronLeft, ChevronRight, Car, Ticket } from 'lucide-react';
// import api from '../../api/axios';

// const defaultForm = {
//   solicitante: '',
//   setorOrigem: '',
//   destino: '',
//   status: 'Pendente',
//   saida: '',
//   retorno: '',
//   motoristaIda: '',
//   motoristaRetorno: '',
//   veiculoIda: '',
//   veiculoRetorno: '',
//   whatsappIda: '',
//   whatsappRetorno: '',
// };

// const Field = ({ label, children }) => (
//   <label className="block text-sm mb-3">
//     <span className="block mb-1 text-gray-700 dark:text-gray-200">{label}</span>
//     {children}
//   </label>
// );

// const maskPhone = (value) =>
//   value
//     .replace(/\D/g, '')
//     .replace(/^(\d{2})(\d)/, '($1) $2')
//     .replace(/(\d{5})(\d{4}).*/, '$1-$2');

// const translateStatus = (status) => {
//   const map = {
//     pending: 'Pendente',
//     approved: 'Aprovado',
//     'pre approved': 'Pré-Aprovado',
//     denied: 'Negado',
//     cancelled: 'Cancelado',
//     finished: 'Finalizado',
//     default: status,
//   };
//   return map[status?.toLowerCase()] || status || '—';
// };

// const AssignModal = ({ isOpen, onClose, onSubmit, preset = {}, eventId, onRefresh, events = [] }) => {
//   const [step, setStep] = useState(0);
//   const [form, setForm] = useState({ ...defaultForm, ...preset });
//   const [loading, setLoading] = useState(false);

//   const [motoristas, setMotoristas] = useState([]);
//   const [veiculos, setVeiculos] = useState([]);

//   const [voucherIda, setVoucherIda] = useState(false);
//   const [voucherRetorno, setVoucherRetorno] = useState(false);

//   // 🔹 Novo estado para armazenar informações detalhadas do evento
//   const [eventDetails, setEventDetails] = useState(null);

//   // 🔹 Buscar detalhes do evento ao abrir o modal
//   useEffect(() => {
//     const fetchEventDetails = async () => {
//       try {
//         const id = eventId || preset?.id;
//         if (!id) return;

//         const res = await api.get(`/events/get/${id}`);
//         if (res.status === 200 && res.data) {
//           setEventDetails(res.data);
//         }
//       } catch (error) {
//         console.error('❌ Erro ao buscar detalhes do evento:', error);
//       }
//     };

//     if (isOpen) {
//       fetchEventDetails();
//     }
//   }, [isOpen, eventId, preset?.id]);

//   // Reset ao abrir
//   useEffect(() => {
//     if (isOpen) {
//       setStep(0);
//       setForm({ ...defaultForm, ...preset });
//       setVoucherIda(false);
//       setVoucherRetorno(false);
//     }
//   }, [isOpen, preset]);

//   // Buscar motoristas
//   useEffect(() => {
//     api
//       .get('/driver/get')
//       .then((response) => {
//         const dados = response.data['driver_data'];
//         if (response.status === 200) setMotoristas(dados);
//       })
//       .catch((error) => console.error('❌ Drivers - Erro ao buscar motoristas:', error));
//   }, []);

//   // Buscar veículos
//   useEffect(() => {
//     api
//       .get('/vehicle/get')
//       .then((response) => {
//         const dados = response.data['vehicle_data'];
//         if (response.status === 200) setVeiculos(dados);
//       })
//       .catch((error) => console.error('❌ Vehicles - Erro ao buscar veículos:', error));
//   }, []);

//   // Helpers
//   const getVehicleIdByPlate = (plate) => veiculos.find((v) => v.plate === plate)?.vehicle_id || null;
//   const getDriverIdByName = (name) => motoristas.find((m) => m.driver_name === name)?.driver_id || null;

//   // Disponibilidade
//   const getAvailableVehicles = () => {
//     const currentEventId = eventId || preset?.id;
//     const usedVehicleIds = events
//       .filter((event) => event.id !== currentEventId)
//       .flatMap((event) => [event.vehicle_start, event.vehicle_end])
//       .filter(Boolean);
//     return veiculos.filter((v) => !usedVehicleIds.includes(v.vehicle_id));
//   };

//   const getAvailableDrivers = () => {
//     const currentEventId = eventId || preset?.id;
//     const usedDriverIds = events
//       .filter((event) => event.id !== currentEventId)
//       .flatMap((event) => [event.driver_start, event.driver_end])
//       .filter(Boolean);
//     return motoristas.filter((m) => !usedDriverIds.includes(m.driver_id));
//   };

//   const isStep0Valid = () => {
//     if (voucherIda) return true;
//     const availableVehicles = getAvailableVehicles();
//     const availableDrivers = getAvailableDrivers();
//     return (
//       form.veiculoIda &&
//       form.motoristaIda &&
//       availableVehicles.some((v) => v.plate === form.veiculoIda) &&
//       availableDrivers.some((m) => m.driver_name === form.motoristaIda)
//     );
//   };

//   const isStep1Valid = () => {
//     if (voucherRetorno) return true;
//     const availableVehicles = getAvailableVehicles();
//     const availableDrivers = getAvailableDrivers();
//     return (
//       (!form.veiculoRetorno || availableVehicles.some((v) => v.plate === form.veiculoRetorno)) &&
//       (!form.motoristaRetorno || availableDrivers.some((m) => m.driver_name === form.motoristaRetorno))
//     );
//   };

//   // === Salvar atribuição ===
//   const handleSave = async (nextStep = false) => {
//     const id = eventId || preset?.id;
//     if (!id) {
//       alert('Erro: ID do evento não definido!');
//       return;
//     }

//     try {
//       setLoading(true);

//       const payload = {};

//       const vStart = getVehicleIdByPlate(form.veiculoIda);
//       const dStart = getDriverIdByName(form.motoristaIda);
//       const vEnd = getVehicleIdByPlate(form.veiculoRetorno);
//       const dEnd = getDriverIdByName(form.motoristaRetorno);

//       if (!voucherIda && vStart && dStart) {
//         payload.vehicle_start_id = vStart;
//         payload.driver_start_id = dStart;
//       }

//       if (!voucherRetorno && vEnd && dEnd) {
//         payload.vehicle_end_id = vEnd;
//         payload.driver_end_id = dEnd;
//       }

//       if (Object.keys(payload).length > 0) {
//         console.log('📤 Enviando PUT /vehicles-driver-assignment com payload:', payload);
//         await api.put(`/events/${id}/vehicles-driver-assignment`, payload);
//       } else {
//         console.log('⚠️ Nenhum motorista/veículo válido — pulando PUT /vehicles-driver-assignment');
//       }

//       // === Novo formato do voucher ===
//       const hasVoucherTel = form.whatsappIda || form.whatsappRetorno;

//       if (hasVoucherTel) {
//         const payloadVoucher = {
//           tel_start: form.whatsappIda || '',
//           tel_end: form.whatsappRetorno || '',
//         };

//         console.log('🎟️ Enviando PUT /voucher-assignment com payload:', payloadVoucher);
//         await api.put(`/events/${id}/voucher-assignment`, payloadVoucher);
//       } else {
//         console.log('⚠️ Nenhum telefone de voucher informado — PUT /voucher-assignment ignorado');
//       }

//       if (nextStep) setStep(1);
//       else {
//         alert('✅ Transporte/voucher atribuídos com sucesso!');
//         onSubmit?.(form);
//         onRefresh?.();
//         onClose();
//       }
//     } catch (err) {
//       console.error('❌ Erro ao salvar atribuição:', err);
//       alert('Erro ao atribuir transporte/voucher.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center">
//       <div
//         className="absolute inset-0 bg-black/20 backdrop-blur-md transition-all duration-300"
//         onClick={onClose}
//       />
//       <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-3xl mx-4 p-5">
//         <button
//           className="absolute right-3 top-3 text-gray-500 hover:text-gray-800"
//           onClick={onClose}
//         >
//           <X size={20} />
//         </button>

//         {/* === CARD DE VISUALIZAÇÃO === */}
//         <div className="mb-5 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
//           <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-100">
//             Dados da Solicitação
//           </h4>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//             <div className="text-gray-800 dark:text-gray-400">
//               <strong>Solicitante:</strong>{' '}
//               {eventDetails?.requester_name || preset.requester_name || preset.solicitante || '—'}
//             </div>
//             <div className="text-gray-800 dark:text-gray-400">
//               <strong>Setor Origem:</strong>
//             </div>
//             <div className="text-gray-800 dark:text-gray-400">
//               <strong>Destino:</strong> {eventDetails?.destiny?.name || eventDetails?.details || '—'}
//             </div>
//             <div className="text-gray-800 dark:text-gray-400">
//               <strong>Status:</strong>{' '}
//               {translateStatus(eventDetails?.status_event || preset.status)}
//             </div>
//             <div className="text-gray-800 dark:text-gray-400">
//               <strong>Saída:</strong> {eventDetails?.date_start || preset.saida || '—'}
//             </div>
//             <div className="text-gray-800 dark:text-gray-400">
//               <strong>Retorno:</strong> {eventDetails?.date_end || preset.retorno || '—'}
//             </div>
//             <div className="text-gray-800 dark:text-gray-400 md:col-span-2">
//               <strong>Detalhes:</strong> {eventDetails?.details || preset.details || '—'}
//             </div>
//           </div>
//         </div>

//         {/* === FORM === */}
//         <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
//           Atribuir Transporte
//         </h3>

//         <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
//           {step === 0 && (
//             <>
//               <div className="flex items-center justify-between mb-3">
//                 <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200">
//                   Informações de PARTIDA
//                 </h4>
//                 <button
//                   onClick={() => setVoucherIda(!voucherIda)}
//                   className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
//                   title={voucherIda ? 'Voltar aos campos de motorista/veículo' : 'Ativar voucher'}
//                 >
//                   {voucherIda ? (
//                     <Car size={20} className="text-blue-600 dark:text-blue-400" />
//                   ) : (
//                     <Ticket size={20} className="text-blue-600 dark:text-blue-400" />
//                   )}
//                 </button>
//               </div>

//               {voucherIda ? (
//                 <Field label="Telefone (Voucher IDA)">
//                   <input
//                     type="tel"
//                     maxLength={15}
//                     value={form.whatsappIda}
//                     onChange={(e) =>
//                       setForm({ ...form, whatsappIda: maskPhone(e.target.value) })
//                     }
//                     placeholder="(99) 99999-9999"
//                     className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
//                   />
//                 </Field>
//               ) : (
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <Field label="Veículo de IDA">
//                     <input
//                       list="veiculosIda"
//                       value={form.veiculoIda}
//                       onChange={(e) => setForm({ ...form, veiculoIda: e.target.value })}
//                       placeholder="Digite ou selecione um veículo"
//                       className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
//                     />
//                     <datalist id="veiculosIda">
//                       {getAvailableVehicles().map((v) => (
//                         <option key={v.vehicle_id} value={v.plate} />
//                       ))}
//                     </datalist>
//                   </Field>

//                   <Field label="Motorista de IDA">
//                     <input
//                       list="motoristasIda"
//                       value={form.motoristaIda}
//                       onChange={(e) => setForm({ ...form, motoristaIda: e.target.value })}
//                       placeholder="Digite ou selecione um motorista"
//                       className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
//                     />
//                     <datalist id="motoristasIda">
//                       {getAvailableDrivers().map((m) => (
//                         <option key={m.driver_id} value={m.driver_name} />
//                       ))}
//                     </datalist>
//                   </Field>
//                 </div>
//               )}
//             </>
//           )}

//           {step === 1 && (
//             <>
//               <div className="flex items-center justify-between mb-3">
//                 <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200">
//                   Informações de RETORNO
//                 </h4>
//                 <button
//                   onClick={() => setVoucherRetorno(!voucherRetorno)}
//                   className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
//                   title={
//                     voucherRetorno
//                       ? 'Voltar aos campos de motorista/veículo'
//                       : 'Ativar voucher'
//                   }
//                 >
//                   {voucherRetorno ? (
//                     <Car size={20} className="text-blue-600 dark:text-blue-400" />
//                   ) : (
//                     <Ticket size={20} className="text-blue-600 dark:text-blue-400" />
//                   )}
//                 </button>
//               </div>

//               {voucherRetorno ? (
//                 <Field label="Telefone (Voucher RETORNO)">
//                   <input
//                     type="tel"
//                     maxLength={15}
//                     value={form.whatsappRetorno}
//                     onChange={(e) =>
//                       setForm({ ...form, whatsappRetorno: maskPhone(e.target.value) })
//                     }
//                     placeholder="(99) 99999-9999"
//                     className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
//                   />
//                 </Field>
//               ) : (
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <Field label="Veículo de RETORNO">
//                     <input
//                       list="veiculosRetorno"
//                       value={form.veiculoRetorno}
//                       onChange={(e) => setForm({ ...form, veiculoRetorno: e.target.value })}
//                       placeholder="Digite ou selecione um veículo"
//                       className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
//                     />
//                     <datalist id="veiculosRetorno">
//                       {getAvailableVehicles().map((v) => (
//                         <option key={v.vehicle_id} value={v.plate} />
//                       ))}
//                     </datalist>
//                   </Field>

//                   <Field label="Motorista de RETORNO">
//                     <input
//                       list="motoristasRetorno"
//                       value={form.motoristaRetorno}
//                       onChange={(e) => setForm({ ...form, motoristaRetorno: e.target.value })}
//                       placeholder="Digite ou selecione um motorista"
//                       className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
//                     />
//                     <datalist id="motoristasRetorno">
//                       {getAvailableDrivers().map((m) => (
//                         <option key={m.driver_id} value={m.driver_name} />
//                       ))}
//                     </datalist>
//                   </Field>
//                 </div>
//               )}
//             </>
//           )}
//         </div>

//         {/* === NAVEGAÇÃO === */}
//         <div className="mt-5 flex items-center justify-between">
//           <button
//             type="button"
//             className="flex items-center gap-2 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-100 disabled:opacity-50 cursor-pointer"
//             onClick={() => setStep((s) => Math.max(0, s - 1))}
//             disabled={step === 0 || loading}
//           >
//             <ChevronLeft size={18} /> Voltar
//           </button>

//           {step < 1 ? (
//             <button
//               type="button"
//               className={`flex items-center gap-2 px-4 py-2 rounded text-white ${
//                 isStep0Valid()
//                   ? 'bg-blue-600 cursor-pointer'
//                   : 'bg-blue-600 cursor-pointer'
//               }`}
//               onClick={() => handleSave(true)}
//             >
//               {loading ? 'Salvando...' : (
//                 <>
//                   Avançar <ChevronRight size={18} />
//                 </>
//               )}
//             </button>
//           ) : (
//             <button
//               type="button"
//               className="px-4 py-2 rounded bg-green-600 text-white cursor-pointer disabled:opacity-50"
//               onClick={() => handleSave(false)}
//               disabled={loading}
//             >
//               {loading ? 'Salvando...' : 'Concluir Atribuição'}
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AssignModal;