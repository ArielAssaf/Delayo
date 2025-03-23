import React, { useEffect, useState } from 'react';

// Define o tipo para as configurações de adiamento
interface DelaySettings {
  laterToday: number; // horas
  tonightTime: string; // formato HH:MM
  tomorrowTime: string; // formato HH:MM
  weekendDay: 'saturday' | 'sunday';
  weekendTime: string; // formato HH:MM
  nextWeekDay: number; // 0-6 (0 = domingo, 1 = segunda, etc.)
  nextWeekTime: string; // formato HH:MM
  nextMonthSameDay: boolean; // se true, mesmo dia do mês; se false, mesmo dia da semana
  somedayMinMonths: number; // mínimo de meses para "Um Dia"
  somedayMaxMonths: number; // máximo de meses para "Um Dia"
}

// Valores padrão para as configurações
const defaultSettings: DelaySettings = {
  laterToday: 3, // 3 horas mais tarde
  tonightTime: '18:00', // 18h
  tomorrowTime: '09:00', // 9h
  weekendDay: 'saturday',
  weekendTime: '09:00', // 9h
  nextWeekDay: 1, // Segunda-feira
  nextWeekTime: '09:00', // 9h
  nextMonthSameDay: true,
  somedayMinMonths: 3, // mínimo 3 meses
  somedayMaxMonths: 12, // máximo 12 meses
};

function DelaySettings(): React.ReactElement {
  const [settings, setSettings] = useState<DelaySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Carrega as configurações salvas
  useEffect(() => {
    const loadSettings = async (): Promise<void> => {
      try {
        setLoading(true);
        const { delaySettings = defaultSettings } =
          await chrome.storage.local.get('delaySettings');
        setSettings(delaySettings);
      } catch (error) {
        // Silenciosamente trata o erro
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Salva as configurações
  const saveSettings = async (): Promise<void> => {
    try {
      await chrome.storage.local.set({ delaySettings: settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      // Silenciosamente trata o erro
    }
  };

  // Reseta as configurações para os valores padrão
  const resetSettings = (): void => {
    setSettings(defaultSettings);
  };

  // Atualiza um campo específico das configurações
  const updateSetting = <K extends keyof DelaySettings>(
    key: K,
    value: DelaySettings[K]
  ): void => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (loading) {
    return (
      <div className='p-8 text-center'>
        <span className='loading loading-spinner loading-lg' />
      </div>
    );
  }

  return (
    <div className='card w-full bg-base-100 shadow-xl'>
      <div className='card-body'>
        <h2 className='card-title mb-4'>Configurações de Adiamento</h2>

        <div className='space-y-4'>
          {/* Hoje Mais Tarde */}
          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-medium'>Hoje Mais Tarde</span>
            </label>
            <div className='flex items-center'>
              <input
                type='number'
                className='input input-bordered w-20'
                min='1'
                max='12'
                value={settings.laterToday}
                onChange={(e) =>
                  updateSetting('laterToday', parseInt(e.target.value, 10) || 1)
                }
              />
              <span className='ml-2'>horas mais tarde</span>
            </div>
          </div>

          {/* Hoje à Noite */}
          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-medium'>Hoje à Noite</span>
            </label>
            <input
              type='time'
              className='input input-bordered w-full max-w-xs'
              value={settings.tonightTime}
              onChange={(e) => updateSetting('tonightTime', e.target.value)}
            />
          </div>

          {/* Amanhã */}
          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-medium'>Amanhã</span>
            </label>
            <input
              type='time'
              className='input input-bordered w-full max-w-xs'
              value={settings.tomorrowTime}
              onChange={(e) => updateSetting('tomorrowTime', e.target.value)}
            />
          </div>

          {/* Este Fim de Semana */}
          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-medium'>Este Fim de Semana</span>
            </label>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
              <select
                className='select select-bordered w-full max-w-xs'
                value={settings.weekendDay}
                onChange={(e) =>
                  updateSetting(
                    'weekendDay',
                    e.target.value as 'saturday' | 'sunday'
                  )
                }
              >
                <option value='saturday'>Sábado</option>
                <option value='sunday'>Domingo</option>
              </select>
              <input
                type='time'
                className='input input-bordered w-full max-w-xs'
                value={settings.weekendTime}
                onChange={(e) => updateSetting('weekendTime', e.target.value)}
              />
            </div>
          </div>

          {/* Próxima Semana */}
          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-medium'>Próxima Semana</span>
            </label>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
              <select
                className='select select-bordered w-full max-w-xs'
                value={settings.nextWeekDay}
                onChange={(e) =>
                  updateSetting('nextWeekDay', parseInt(e.target.value, 10))
                }
              >
                <option value='0'>Domingo</option>
                <option value='1'>Segunda-feira</option>
                <option value='2'>Terça-feira</option>
                <option value='3'>Quarta-feira</option>
                <option value='4'>Quinta-feira</option>
                <option value='5'>Sexta-feira</option>
                <option value='6'>Sábado</option>
              </select>
              <input
                type='time'
                className='input input-bordered w-full max-w-xs'
                value={settings.nextWeekTime}
                onChange={(e) => updateSetting('nextWeekTime', e.target.value)}
              />
            </div>
          </div>

          {/* Próximo Mês */}
          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-medium'>Próximo Mês</span>
            </label>
            <div className='flex items-center'>
              <div className='form-control'>
                <label className='label cursor-pointer'>
                  <input
                    type='radio'
                    name='nextMonthOption'
                    className='radio-primary radio'
                    checked={settings.nextMonthSameDay}
                    onChange={() => updateSetting('nextMonthSameDay', true)}
                  />
                  <span className='label-text ml-2'>Mesmo dia do mês</span>
                </label>
              </div>
              <div className='form-control ml-4'>
                <label className='label cursor-pointer'>
                  <input
                    type='radio'
                    name='nextMonthOption'
                    className='radio-primary radio'
                    checked={!settings.nextMonthSameDay}
                    onChange={() => updateSetting('nextMonthSameDay', false)}
                  />
                  <span className='label-text ml-2'>Mesmo dia da semana</span>
                </label>
              </div>
            </div>
          </div>

          {/* Um Dia (Aleatório) */}
          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-medium'>Um Dia (Aleatório)</span>
            </label>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
              <div>
                <label className='label'>
                  <span className='label-text'>Mínimo (meses)</span>
                </label>
                <input
                  type='number'
                  className='input input-bordered w-20'
                  min='1'
                  max='12'
                  value={settings.somedayMinMonths}
                  onChange={(e) =>
                    updateSetting(
                      'somedayMinMonths',
                      parseInt(e.target.value, 10) || 1
                    )
                  }
                />
              </div>
              <div>
                <label className='label'>
                  <span className='label-text'>Máximo (meses)</span>
                </label>
                <input
                  type='number'
                  className='input input-bordered w-20'
                  min={settings.somedayMinMonths + 1}
                  max='36'
                  value={settings.somedayMaxMonths}
                  onChange={(e) =>
                    updateSetting(
                      'somedayMaxMonths',
                      parseInt(e.target.value, 10) ||
                        settings.somedayMinMonths + 1
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className='card-actions mt-6 justify-end'>
          <button
            type='button'
            className='btn btn-outline'
            onClick={resetSettings}
          >
            Restaurar Padrões
          </button>
          <button
            type='button'
            className='btn btn-primary'
            onClick={saveSettings}
          >
            Salvar Configurações
          </button>
        </div>

        {saved && (
          <div className='mt-4 text-center text-success'>
            Configurações salvas com sucesso!
          </div>
        )}
      </div>
    </div>
  );
}

export default DelaySettings;
