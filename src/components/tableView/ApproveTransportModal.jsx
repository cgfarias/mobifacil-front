import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Car, User, Ticket } from 'lucide-react';
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

const Input = (props) => (
  <input
    {...props}
    className={`w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 
      bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 
      focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.className || ''}`}
  />
);

const translateStatus = (status) => {
  const map = {
    pending: 'Pendente',
    'pre approved': 'Pré-Aprovado',
    approved: 'Aprovado',
    denied: 'Negado',
    canceled: 'Cancelado',
    finished: 'Finalizado',
    progress: 'Em andamento',
  };
  return map[status?.toLowerCase()] || status || '—';
};

const getStatusColor = (status) => {
  const normalized = status?.toLowerCase();
  if (normalized === 'approved' || normalized === 'pre approved') return 'text-green-500 dark:text-green-300';
  if (normalized === 'pending') return 'text-orange-500 dark:text-orange-300';
  if (normalized === 'denied' || normalized === 'cancelled') return 'text-red-600 dark:text-red-400';
  if (normalized === 'finished') return 'text-blue-600 dark:text-blue-400';
  return 'text-gray-600 dark:text-gray-300';
};

const maskPhone = (value) =>
  value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{4}).*/, '$1-$2');

const ApproveTransportModal = ({ isOpen, onClose, onSubmit, onRefresh, preset = {} }) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ ...defaultForm, ...preset });
  const [eventData, setEventData] = useState({ ...preset });
  const [loading, setLoading] = useState(false);

  const [veiculos, setVeiculos] = useState([]);
  const [motoristas, setMotoristas] = useState([]);
  const [voucherIda, setVoucherIda] = useState(false);
  const [voucherRetorno, setVoucherRetorno] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchEventData = async () => {
      try {
        setLoading(true);

        if (preset?.id) {
          const res = await api.get(`/events/get/${preset.id}`);
          const fetched = res.data?.event || res.data || {};

          setEventData((prev) => ({
            ...prev,
            ...preset,
            ...fetched,
          }));

          setForm((prev) => ({
            ...prev,
            veiculoIda: fetched.vehicle_start?.plate || '',
            motoristaIda: fetched.driver_start?.driver_name || '',
            veiculoRetorno: fetched.vehicle_end?.plate || '',
            motoristaRetorno: fetched.driver_end?.driver_name || '',
          }));

          setVoucherIda(fetched.voucher_start || false);
          setVoucherRetorno(fetched.voucher_end || false);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar evento:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [isOpen, preset]);

  useEffect(() => {
    if (!isOpen) return;
    async function fetchData() {
      try {
        const [vehicleRes, driverRes] = await Promise.all([
          api.get('/vehicle/get'),
          api.get('/driver/get'),
        ]);

        const vehicleData = vehicleRes.data.vehicle_data || vehicleRes.data || [];
        const driverData = driverRes.data.driver_data || driverRes.data || [];

        setVeiculos(vehicleData);
        setMotoristas(driverData);
      } catch (error) {
        console.error('❌ Erro ao buscar veículos/motoristas:', error);
      }
    }

    fetchData();
  }, [isOpen]);

  const getVehiclePlate = (vehicle) => vehicle?.plate || '—';
  const getDriverName = (driver) => driver?.driver_name || '—';

  const getVehicleIdByPlate = (plate) =>
    veiculos.find((v) => v.plate === plate)?.vehicle_id || null;
  const getDriverIdByName = (name) =>
    motoristas.find((m) => m.driver_name === name)?.driver_id || null;

  const handleSaveAssignment = async () => {
    const eventId = eventData?.id || preset?.id;
    if (!eventId) {
      alert('Erro: ID do evento não definido!');
      return;
    }

    // 🔹 Monta payload condicional
    const payload = {
      vehicle_start_id: voucherIda ? null : getVehicleIdByPlate(form.veiculoIda),
      driver_start_id: voucherIda ? null : getDriverIdByName(form.motoristaIda),
      vehicle_end_id: voucherRetorno ? null : getVehicleIdByPlate(form.veiculoRetorno),
      driver_end_id: voucherRetorno ? null : getDriverIdByName(form.motoristaRetorno),
    };

    const payloadVoucher = {
      voucher_start: voucherIda,
      voucher_end: voucherRetorno,
    };

    // 🔹 Validação condicional
    if (!voucherIda && (!payload.vehicle_start_id || !payload.driver_start_id)) {
      alert('Por favor, selecione um veículo e motorista de IDA válidos.');
      return;
    }

    try {
      setLoading(true);

      // 🚗 PUT - Atribuição de motorista/veículo (só se necessário)
      if (!voucherIda || !voucherRetorno) {
        await api.put(`/events/${eventId}/vehicles-driver-assignment`, payload);
      }

      // 🎟️ PUT - Voucher assignment
      await api.put(`/events/${eventId}/voucher-assignment`, payloadVoucher);

      alert('✅ Transporte/voucher atribuídos com sucesso!');
      onSubmit?.(form);
      onRefresh?.();
      onClose();
    } catch (error) {
      console.error('❌ Erro ao salvar atribuição:', error);
      alert('Erro ao atribuir transporte/voucher.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  const info = eventData || preset;
  const statusLabel = translateStatus(info.status_event || info.status);
  const statusColor = getStatusColor(info.status_event || info.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-md transition-all duration-300"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-3xl mx-4 p-5">
        <button
          className="absolute right-3 top-3 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-600 dark:text-gray-300">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
            <p>Carregando dados do evento...</p>
          </div>
        ) : (
          <>
            {/* === CARD DE VISUALIZAÇÃO === */}
            <div className="mb-5 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
              <h4 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-100">
                Dados da Solicitação
              </h4>

              {info?.details && (
                <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-md border border-blue-200 dark:border-blue-700">
                  <strong>📝 Detalhes:</strong> {info.details || '—'}
                </div>
              )}

              {(info.vehicle_start || info.driver_start || info.vehicle_end || info.driver_end) && (
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {/* === IDA === */}
                  {info.vehicle_start || info.driver_start ? (
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-700">
                      <p className="font-semibold text-green-700 dark:text-green-300 mb-1">
                        🟢 IDA Atribuída
                      </p>
                      <p className="flex items-center gap-1 text-gray-800 dark:text-gray-200">
                        <Car size={16} /> <strong>Veículo:</strong>{' '}
                        <span className="font-medium">{getVehiclePlate(info.vehicle_start)}</span>
                      </p>
                      <p className="flex items-center gap-1 text-gray-800 dark:text-gray-200">
                        <User size={16} /> <strong>Motorista:</strong>{' '}
                        <span className="font-medium">{getDriverName(info.driver_start)}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500 text-sm italic">
                      Nenhum veículo/motorista de IDA atribuído.
                    </div>
                  )}

                  {/* === RETORNO === */}
                  {info.vehicle_end || info.driver_end ? (
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-700">
                      <p className="font-semibold text-green-700 dark:text-green-300 mb-1">
                        🟢 RETORNO Atribuído
                      </p>
                      <p className="flex items-center gap-1 text-gray-800 dark:text-gray-200">
                        <Car size={16} /> <strong>Veículo:</strong>{' '}
                        <span className="font-medium">{getVehiclePlate(info.vehicle_end)}</span>
                      </p>
                      <p className="flex items-center gap-1 text-gray-800 dark:text-gray-200">
                        <User size={16} /> <strong>Motorista:</strong>{' '}
                        <span className="font-medium">{getDriverName(info.driver_end)}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500 text-sm italic">
                      Nenhum veículo/motorista de RETORNO atribuído.
                    </div>
                  )}
                </div>
              )}

              {/* 📋 Dados gerais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-800 dark:text-gray-200">
                <div><strong>Destino:</strong> {info.destiny?.name || '—'}</div>
                <div>
                  <strong>Status:</strong>{' '}
                  <span className={`font-semibold ${statusColor}`}>{statusLabel}</span>
                </div>
                <div><strong>Saída:</strong> {info.date_start || info.saida || '—'}</div>
                <div><strong>Retorno:</strong> {info.date_end || info.retorno || '—'}</div>
              </div>
            </div>

            {/* === FORM === */}
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Atribuir Transporte
            </h3>

            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
              {step === 0 ? (
                <>
                  {/* === PARTIDA === */}
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
                      <Input
                        type="tel"
                        maxLength={15}
                        value={form.whatsappIda}
                        onChange={(e) =>
                          setForm({ ...form, whatsappIda: maskPhone(e.target.value) })
                        }
                        placeholder="(99) 99999-9999"
                      />
                    </Field>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Veículo de IDA">
                        <Input
                          list="veiculosIda"
                          value={form.veiculoIda}
                          onChange={(e) => setForm({ ...form, veiculoIda: e.target.value })}
                          placeholder="Digite ou selecione um veículo"
                        />
                        <datalist id="veiculosIda">
                          {veiculos.map((v) => (
                            <option key={v.vehicle_id} value={v.plate} />
                          ))}
                        </datalist>
                      </Field>

                      <Field label="Motorista de IDA">
                        <Input
                          list="motoristasIda"
                          value={form.motoristaIda}
                          onChange={(e) => setForm({ ...form, motoristaIda: e.target.value })}
                          placeholder="Digite ou selecione um motorista"
                        />
                        <datalist id="motoristasIda">
                          {motoristas.map((m) => (
                            <option key={m.driver_id} value={m.driver_name} />
                          ))}
                        </datalist>
                      </Field>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* === RETORNO === */}
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200">
                      Informações de RETORNO
                    </h4>
                    <button
                      onClick={() => setVoucherRetorno(!voucherRetorno)}
                      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                      title={voucherRetorno ? 'Voltar aos campos de motorista/veículo' : 'Ativar voucher'}
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
                      <Input
                        type="tel"
                        maxLength={15}
                        value={form.whatsappRetorno}
                        onChange={(e) =>
                          setForm({ ...form, whatsappRetorno: maskPhone(e.target.value) })
                        }
                        placeholder="(99) 99999-9999"
                      />
                    </Field>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Veículo de RETORNO">
                        <Input
                          list="veiculosRetorno"
                          value={form.veiculoRetorno}
                          onChange={(e) => setForm({ ...form, veiculoRetorno: e.target.value })}
                          placeholder="Digite ou selecione um veículo"
                        />
                        <datalist id="veiculosRetorno">
                          {veiculos.map((v) => (
                            <option key={v.vehicle_id} value={v.plate} />
                          ))}
                        </datalist>
                      </Field>

                      <Field label="Motorista de RETORNO">
                        <Input
                          list="motoristasRetorno"
                          value={form.motoristaRetorno}
                          onChange={(e) => setForm({ ...form, motoristaRetorno: e.target.value })}
                          placeholder="Digite ou selecione um motorista"
                        />
                        <datalist id="motoristasRetorno">
                          {motoristas.map((m) => (
                            <option key={m.driver_id} value={m.driver_name} />
                          ))}
                        </datalist>
                      </Field>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* === BOTÕES === */}
            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 rounded border border-gray-300 
                  dark:border-gray-700 text-gray-700 dark:text-gray-100 disabled:opacity-50 cursor-pointer"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
              >
                <ChevronLeft size={18} /> Voltar
              </button>

              {step < 1 ? (
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white cursor-pointer"
                  onClick={() => setStep(1)}
                >
                  Avançar <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-green-600 text-white cursor-pointer"
                  onClick={handleSaveAssignment}
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Concluir Atribuição'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ApproveTransportModal;