import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Check, Clock, Users, LogOut } from 'lucide-react';
import Logo from '@/assets/Logo.svg';

const SURVEY_OPTIONS = [
  { id: 'create', label: 'Создавать курсы для своей аудитории' },
  { id: 'business', label: 'Обучать сотрудников в компании' },
  { id: 'personal', label: 'Структурировать свои знания' },
  { id: 'explore', label: 'Просто хочу посмотреть, что это' },
];

type WaitlistStep = 'info' | 'survey' | 'done';

const Waitlist: React.FC = () => {
  const { signOut } = useAuth();
  const [step, setStep] = useState<WaitlistStep>('info');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const queueCount = useMemo(() => Math.floor(Math.random() * 300) + 140, []);

  const handleJoinQueue = () => {
    setStep('survey');
  };

  const handleSubmitSurvey = () => {
    setStep('done');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="absolute top-4 left-4 sm:top-6 sm:left-8 flex items-center gap-3 z-10">
        <img src={Logo} alt="Academy Logo" className="h-6 sm:h-8" />
      </div>

      <div className="w-full max-w-[440px] text-center">

        {/* ====== INFO ====== */}
        {step === 'info' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-gray-900 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-3">
              Студия в закрытом бета
            </h1>
            <p className="text-gray-500 mb-2">
              Мы открываем доступ постепенно, чтобы обеспечить лучший опыт для каждого пользователя.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-8">
              <Users className="w-4 h-4" />
              <span>В очереди уже <span className="font-medium text-gray-600">{queueCount}</span> человек</span>
            </div>
            <Button
              onClick={handleJoinQueue}
              className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium"
            >
              Записаться в очередь
            </Button>
            <button
              type="button"
              onClick={signOut}
              className="flex items-center justify-center gap-2 mx-auto mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Выйти
            </button>
          </>
        )}

        {/* ====== SURVEY ====== */}
        {step === 'survey' && (
          <>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              Зачем вам Студия?
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Это поможет нам сделать продукт лучше
            </p>
            <div className="space-y-3 mb-6">
              {SURVEY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedOption(option.id)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all text-sm ${
                    selectedOption === option.id
                      ? 'border-gray-900 bg-gray-50 text-gray-900 font-medium'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Button
              onClick={handleSubmitSurvey}
              className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium"
              disabled={!selectedOption}
            >
              Отправить
            </Button>
          </>
        )}

        {/* ====== DONE ====== */}
        {step === 'done' && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
              Спасибо, вы в очереди!
            </h2>
            <p className="text-gray-500 mb-1">
              Мы отправим уведомление на ваш email или в Telegram, как только дадим вам доступ.
            </p>
            <p className="text-sm text-gray-400 mt-4">
              Обычно это занимает несколько дней
            </p>
            <button
              type="button"
              onClick={signOut}
              className="flex items-center justify-center gap-2 mx-auto mt-6 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Выйти
            </button>
          </>
        )}

      </div>
    </main>
  );
};

export default Waitlist;
