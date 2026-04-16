import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Clock, Users, LogOut } from 'lucide-react';
import Logo from '@/assets/Logo.svg';

const authIllustration = '/auth-illustration.jpg';

const SURVEY_OPTIONS = [
  { id: 'create', label: 'Создавать курсы для своей аудитории' },
  { id: 'business', label: 'Обучать сотрудников в компании' },
  { id: 'personal', label: 'Структурировать свои знания' },
  { id: 'explore', label: 'Просто хочу посмотреть, что это' },
];

type WaitlistStep = 'info' | 'survey' | 'done';

const Waitlist: React.FC = () => {
  const [step, setStep] = useState<WaitlistStep>('info');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const queueCount = useMemo(() => Math.floor(Math.random() * 300) + 140, []);

  const handleJoinQueue = () => setStep('survey');

  const handleSubmitSurvey = () => setStep('done');

  const handleGoToAcademy = () => {
    window.location.href = 'https://learn.open-academy.app';
  };

  return (
    <main className="min-h-screen flex flex-col lg:flex-row bg-white relative">
      <div className="absolute top-6 left-4 sm:top-8 sm:left-8 lg:left-16 xl:left-24 flex items-center gap-3 z-10">
        <img src={Logo} alt="Academy Logo" className="h-6 sm:h-8" />
      </div>

      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-16 xl:px-24 pt-16 pb-8 lg:py-0">
        <div className="w-full max-w-[400px] mx-auto">

          {/* ====== INFO ====== */}
          {step === 'info' && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center mb-6">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 mb-3">
                Студия в закрытом бета
              </h1>
              <p className="text-sm text-gray-500 mb-2">
                Мы открываем доступ постепенно, чтобы обеспечить лучший опыт для каждого пользователя.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
                <Users className="w-4 h-4" />
                <span>В очереди уже <span className="font-medium text-gray-600">{queueCount}</span> человек</span>
              </div>
              <Button
                onClick={handleJoinQueue}
                className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium"
              >
                Записаться в очередь
              </Button>
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
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <Check className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
                Спасибо, вы в очереди!
              </h2>
              <p className="text-sm text-gray-500 mb-1">
                Мы отправим уведомление на ваш email или в Telegram, как только дадим вам доступ.
              </p>
              <p className="text-xs text-gray-400 mt-2 mb-6">
                Обычно это занимает несколько дней
              </p>
              <Button
                onClick={handleGoToAcademy}
                className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium"
              >
                Перейти в Академию
              </Button>
            </>
          )}

        </div>
      </div>

      {/* Right side */}
      <div className="hidden lg:flex lg:flex-1 p-6">
        <div className="relative w-full h-full rounded-3xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
          <img src={authIllustration} alt="Creative workspace" className="absolute inset-0 w-full h-full object-cover" fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute bottom-12 left-12 right-12">
            <h2 className="text-3xl font-semibold text-white leading-tight">Превращайте идеи<br />в обучающие курсы</h2>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Waitlist;
