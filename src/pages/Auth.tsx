import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Send, Check, ArrowLeft, Mail, Clock, Users, ExternalLink } from 'lucide-react';
import { z } from 'zod';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

const authIllustration = '/auth-illustration.jpg';
import Logo from '@/assets/Logo.svg';
import TelegramIconSvg from '@/assets/telegram-icon.svg';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const TelegramIcon = () => (
  <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z"/></svg>
);

const emailSchema = z.string().email('Введите корректный email');

type AuthStep = 'main' | 'email-code' | 'telegram-username' | 'telegram-code' | 'magic-link-sent' | 'waitlist-info' | 'waitlist-survey' | 'waitlist-done';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithMagicLink, verifyEmailOtp } = useAuth();
  const [step, setStep] = useState<AuthStep>('main');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Email state
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [emailCode, setEmailCode] = useState('');

  // Telegram state
  const [tgUsername, setTgUsername] = useState('');
  const [tgCode, setTgCode] = useState('');

  // Waitlist state
  const [selectedSurveyOption, setSelectedSurveyOption] = useState<string | null>(null);
  const queueCount = useMemo(() => Math.floor(Math.random() * 300) + 140, []);

  const SURVEY_OPTIONS = [
    { id: 'publish', label: 'Публиковать курсы в Open Academy и зарабатывать' },
    { id: 'create', label: 'Создавать курсы для своей аудитории' },
    { id: 'business', label: 'Обучать сотрудников в компании' },
    { id: 'personal', label: 'Структурировать свои знания' },
    { id: 'explore', label: 'Просто хочу посмотреть, что это' },
  ];

  const validateEmail = (): boolean => {
    const newErrors: { email?: string } = {};
    try { emailSchema.parse(email); } catch (e) {
      if (e instanceof z.ZodError) newErrors.email = e.errors[0]?.message;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;
    setIsLoading(true);
    const { error } = await signInWithMagicLink(email);
    setIsLoading(false);
    if (error) { toast.error('Ошибка отправки кода: ' + error.message); return; }
    setStep('email-code');
    setEmailCode('');
    toast.success('Код отправлен на почту!');
  };

  const handleVerifyEmailCode = async () => {
    if (emailCode.length < 4) { toast.error('Введите 4-значный код'); return; }
    setIsLoading(true);
    const { error } = await verifyEmailOtp(email, emailCode);
    setIsLoading(false);
    if (error) { toast.error('Неверный код: ' + error.message); return; }
    toast.success('Вход выполнен!');
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
    if (result.error) { toast.error('Ошибка входа через Google: ' + result.error.message); setIsGoogleLoading(false); }
  };

  const handleTelegramStart = () => setStep('telegram-username');

  const handleTelegramUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tgUsername.trim()) { toast.error('Введите username'); return; }
    // TODO: вызвать edge function для отправки кода в ТГ бот
    toast.success('Код отправлен в Telegram-бот!');
    setStep('telegram-code');
  };

  const handleTelegramCode = () => {
    if (tgCode.length < 4) { toast.error('Введите 4-значный код'); return; }
    setStep('waitlist-info');
  };

  const goBack = () => {
    setStep('main');
    setTgUsername('');
    setTgCode('');
  };

  return (
    <main className="min-h-screen flex flex-col lg:flex-row bg-white relative">
      <div className="absolute top-8 left-4 sm:top-10 sm:left-8 lg:left-16 xl:left-24 flex items-center gap-3 z-10">
        <img src={Logo} alt="Academy Logo" className="h-6 sm:h-8" />
      </div>

      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-16 xl:px-24 pt-16 pb-8 lg:py-0">
        <div className="w-full max-w-[400px] mx-auto">

          {/* ====== MAIN ====== */}
          {step === 'main' && (
            <>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 mb-6 sm:mb-8">
                Войдите в аккаунт
              </h1>

              <Button type="button" variant="outline" className="w-full h-11 bg-white border-gray-200 hover:bg-gray-50 text-gray-700 hover:text-gray-700 font-semibold" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
                {isGoogleLoading ? <Loader2 className="w-4 h-4 mr-3 animate-spin" /> : <span className="mr-3"><GoogleIcon /></span>}
                Войти через Google
              </Button>

              <Button type="button" variant="outline" className="w-full h-11 bg-[#2AABEE] hover:bg-[#229ED9] text-white hover:text-white font-semibold border-[#2AABEE] hover:border-[#229ED9] mt-3" onClick={handleTelegramStart} disabled={isLoading}>
                <span className="mr-3"><TelegramIcon /></span>
                Войти через Telegram
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><Separator className="w-full bg-gray-200" /></div>
                <div className="relative flex justify-center text-sm"><span className="bg-white px-4 text-gray-500">Или</span></div>
              </div>

              <form onSubmit={handleSendEmailCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-gray-700 font-semibold">Email</Label>
                  <Input id="email" type="email" placeholder="Введите ваш email" value={email} onChange={e => setEmail(e.target.value)} className={`h-11 bg-gray-50 border-gray-200 focus:border-gray-300 focus:ring-0 text-gray-900 placeholder:text-gray-400 ${errors.email ? 'border-red-400' : ''}`} />
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>
                <Button type="submit" className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium mt-2" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Отправка...</> : <><Mail className="w-4 h-4 mr-2" />Получить код для входа</>}
                </Button>
              </form>
            </>
          )}

          {/* ====== TELEGRAM USERNAME ====== */}
          {step === 'telegram-username' && (
            <>
              <button type="button" onClick={goBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Назад
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#2AABEE] flex items-center justify-center text-white"><TelegramIcon /></div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Вход через Telegram</h2>
              </div>
              <p className="text-sm text-gray-500 mb-6">Введите ваш Telegram username, чтобы мы отправили код подтверждения в бот</p>
              <form onSubmit={handleTelegramUsername} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                    <Input id="tg-username" type="text" placeholder="username" value={tgUsername} onChange={e => setTgUsername(e.target.value.replace(/^@/, ''))} className="h-11 pl-8 bg-gray-50 border-gray-200 focus:border-gray-300 focus:ring-0 text-gray-900 placeholder:text-gray-400" />
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 bg-[#2AABEE] hover:bg-[#229ED9] text-white font-medium">
                  Отправить код
                </Button>
              </form>
              <p className="text-center text-xs text-gray-400 mt-4">
                Если вы не использовали наш Telegram бот, сначала <a href="https://t.me/nutsfarm_bot" target="_blank" rel="noopener noreferrer" className="text-[#2AABEE] hover:underline">откройте его</a> и нажмите <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-500 text-[10px]">/start</span>
              </p>
            </>
          )}

          {/* ====== TELEGRAM CODE ====== */}
          {step === 'telegram-code' && (
            <>
              <button type="button" onClick={() => setStep('telegram-username')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Назад
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#2AABEE] flex items-center justify-center text-white"><TelegramIcon /></div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Введите код</h2>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Откройте бота <a href="https://t.me/nutsfarm_bot" target="_blank" rel="noopener noreferrer" className="text-[#2AABEE] font-medium hover:underline">@openacademy</a> — код придёт автоматически
              </p>

              <div className="flex justify-center gap-3 mb-6">
                <InputOTP maxLength={4} value={tgCode} onChange={setTgCode}>
                  <InputOTPGroup className="gap-3">
                    <InputOTPSlot index={0} className="!w-14 !h-14 text-2xl !border !border-gray-300 bg-gray-50 text-gray-900 !rounded-xl" />
                    <InputOTPSlot index={1} className="!w-14 !h-14 text-2xl !border !border-gray-300 bg-gray-50 text-gray-900 !rounded-xl" />
                    <InputOTPSlot index={2} className="!w-14 !h-14 text-2xl !border !border-gray-300 bg-gray-50 text-gray-900 !rounded-xl" />
                    <InputOTPSlot index={3} className="!w-14 !h-14 text-2xl !border !border-gray-300 bg-gray-50 text-gray-900 !rounded-xl" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button type="button" onClick={handleTelegramCode} className="w-full h-11 bg-[#2AABEE] hover:bg-[#229ED9] text-white font-medium" disabled={tgCode.length < 4}>
                Подтвердить
              </Button>

              <p className="text-center text-xs text-gray-400 mt-4">
                Код действует 4 часа. Не пришёл? Отправьте боту <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-500 text-[10px]">/start</span> и попробуйте заново.{' '}
                Если не помогло — <a href="https://t.me/open_academy_support_bot" target="_blank" rel="noopener noreferrer" className="text-[#2AABEE] hover:underline">напишите в поддержку</a>
              </p>

            </>
          )}

          {/* ====== EMAIL CODE ====== */}
          {step === 'email-code' && (
            <>
              <button type="button" onClick={() => { setStep('main'); setEmailCode(''); }} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Назад
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white"><Mail className="w-5 h-5" /></div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Введите код</h2>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Мы отправили 4-значный код на <span className="font-medium text-gray-700">{email}</span>
              </p>

              <div className="flex justify-center gap-3 mb-6">
                <InputOTP maxLength={4} value={emailCode} onChange={setEmailCode}>
                  <InputOTPGroup className="gap-3">
                    <InputOTPSlot index={0} className="!w-14 !h-14 text-2xl !border !border-gray-300 bg-gray-50 text-gray-900 !rounded-xl" />
                    <InputOTPSlot index={1} className="!w-14 !h-14 text-2xl !border !border-gray-300 bg-gray-50 text-gray-900 !rounded-xl" />
                    <InputOTPSlot index={2} className="!w-14 !h-14 text-2xl !border !border-gray-300 bg-gray-50 text-gray-900 !rounded-xl" />
                    <InputOTPSlot index={3} className="!w-14 !h-14 text-2xl !border !border-gray-300 bg-gray-50 text-gray-900 !rounded-xl" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button type="button" onClick={handleVerifyEmailCode} className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium" disabled={emailCode.length < 4 || isLoading}>
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Проверка...</> : 'Подтвердить'}
              </Button>

              <p className="text-center text-xs text-gray-400 mt-4">
                Код не пришёл? Проверьте папку «Спам».{' '}
                Если не помогло — <a href="https://t.me/open_academy_support_bot" target="_blank" rel="noopener noreferrer" className="text-[#2AABEE] hover:underline">напишите в поддержку</a>
              </p>

              <button type="button" onClick={() => { setStep('main'); setEmailCode(''); }} className="block mx-auto text-sm text-gray-500 hover:text-gray-700 hover:underline mt-2">
                Отправить на другой email
              </button>
            </>
          )}
          {/* ====== WAITLIST INFO ====== */}
          {step === 'waitlist-info' && (
            <>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 mb-3">
                Идёт закрытое бета-тестирование
              </h1>
              <p className="text-sm text-gray-500 mb-2">
                Мы открываем доступ постепенно, чтобы обеспечить лучший опыт для каждого пользователя.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
                <Users className="w-4 h-4" />
                <span>В очереди <span className="font-medium text-gray-600">{queueCount}</span> человек</span>
              </div>
              <Button onClick={() => setStep('waitlist-survey')} className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium">
                Получить ранний доступ
              </Button>
            </>
          )}

          {/* ====== WAITLIST SURVEY ====== */}
          {step === 'waitlist-survey' && (
            <>
              <button onClick={() => setStep('waitlist-info')} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4">
                <ArrowLeft className="w-4 h-4" />
                Назад
              </button>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                Как вы планируете использовать OA Studio?
              </h2>
              <div className="space-y-3 mt-8 mb-6">
                {SURVEY_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedSurveyOption(option.id)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all text-sm ${
                      selectedSurveyOption === option.id
                        ? 'border-gray-900 bg-gray-50 text-gray-900 font-medium'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <Button onClick={() => setStep('waitlist-done')} className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium" disabled={!selectedSurveyOption}>
                Отправить
              </Button>
            </>
          )}

          {/* ====== WAITLIST DONE ====== */}
          {step === 'waitlist-done' && (
            <>
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <Check className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                Спасибо, вы в списке ожидания!
              </h2>
              <p className="text-sm text-gray-500 mb-1">
                Мы выдаём доступ постепенно. В приоритете — активные участники сообщества, авторы и эксперты. Уведомим вас по email или в Telegram.
              </p>
              <div className="w-full h-px bg-gray-200 my-6" />
              <p className="text-base font-medium text-gray-700 mb-4">Попробуйте наше приложение с курсами</p>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <a href="https://learn.open-academy.app" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 h-11 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium text-sm transition-all">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  WEB
                </a>
                <a href="https://t.me/OpenAcademyBot/app" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 h-11 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium text-sm transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z"/></svg>
                  TMA
                </a>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="flex items-center justify-center gap-2 h-11 rounded-xl bg-gray-100 text-gray-400 font-medium text-sm cursor-default">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                  App Store <span className="text-xs text-gray-300 ml-1">скоро</span>
                </div>
                <div className="flex items-center justify-center gap-2 h-11 rounded-xl bg-gray-100 text-gray-400 font-medium text-sm cursor-default">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814 13.793 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893 2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199 2.302 2.302a1 1 0 0 1 0 1.38l-1.996 1.996L15.7 12.882l2-2.374zM5.864 2.658 16.8 8.99l-2.302 2.302L5.864 2.658z"/></svg>
                  Google Play <span className="text-xs text-gray-300 ml-1">скоро</span>
                </div>
              </div>
              <p className="text-base font-medium text-gray-700 mb-4">Подпишитесь, чтобы следить за новостями</p>
              <div className="flex flex-wrap items-center gap-3">
                <a href="https://x.com/OpenAcademyAI" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all text-sm font-medium">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  X
                </a>
                <a href="https://t.me/nutsfarm" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all text-sm font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z"/></svg>
                  Telegram
                </a>
                <a href="https://t.me/open_academy_support_bot" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all text-sm font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
                  Поддержка
                </a>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Right side */}
      <div className="hidden lg:flex lg:flex-1 p-6">
        <div className="relative w-full h-full rounded-[26px] p-[2px] bg-gradient-to-br from-indigo-300/60 via-blue-200/30 to-purple-300/50">
          <div className="relative w-full h-full rounded-3xl overflow-hidden">
            <img src={authIllustration} alt="Creative workspace" className="absolute inset-0 w-full h-full object-cover" fetchPriority="high" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute bottom-12 left-12 right-12">
              <h2 className="text-3xl font-semibold text-white leading-tight">Превращайте идеи<br />в обучающие курсы</h2>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Auth;
