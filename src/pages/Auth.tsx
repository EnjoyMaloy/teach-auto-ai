import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Send, Check, ArrowLeft, Mail } from 'lucide-react';
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

type AuthStep = 'main' | 'telegram-username' | 'telegram-code' | 'magic-link-sent';

const Auth: React.FC = () => {
  const { signInWithMagicLink } = useAuth();
  const [step, setStep] = useState<AuthStep>('main');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Email state
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string }>({});

  // Telegram state
  const [tgUsername, setTgUsername] = useState('');
  const [tgCode, setTgCode] = useState('');

  const validateEmail = (): boolean => {
    const newErrors: { email?: string } = {};
    try { emailSchema.parse(email); } catch (e) {
      if (e instanceof z.ZodError) newErrors.email = e.errors[0]?.message;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;
    setIsLoading(true);
    const { error } = await signInWithMagicLink(email);
    setIsLoading(false);
    if (error) { toast.error('Ошибка отправки ссылки: ' + error.message); return; }
    setStep('magic-link-sent');
    toast.success('Ссылка для входа отправлена!');
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
    if (result.error) { toast.error('Ошибка входа через Google: ' + result.error.message); setIsGoogleLoading(false); }
  };

  const handleTelegramStart = () => setStep('telegram-code');

  const handleTelegramUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tgUsername.trim()) { toast.error('Введите username'); return; }
    // TODO: вызвать edge function для отправки кода в ТГ бот
    toast.success('Код отправлен в Telegram-бот!');
    setStep('telegram-code');
  };

  const handleTelegramCode = () => {
    if (tgCode.length < 4) { toast.error('Введите 4-значный код'); return; }
    // TODO: верифицировать код через edge function
    toast.info('Верификация кода (пока заглушка)');
  };

  const goBack = () => {
    setStep('main');
    setTgUsername('');
    setTgCode('');
  };

  return (
    <main className="min-h-screen flex flex-col lg:flex-row bg-white relative">
      <div className="absolute top-4 left-4 sm:top-6 sm:left-8 lg:left-16 xl:left-24 flex items-center gap-3 z-10">
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

              <form onSubmit={handleMagicLink} className="space-y-4">
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
              <p className="text-sm text-gray-500 mb-1">
                Откройте нашего бота <a href="https://t.me/OpenAcademyBot" target="_blank" rel="noopener noreferrer" className="text-[#2AABEE] font-medium hover:underline">@OpenAcademyBot</a> и отправьте команду <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 text-xs">/login</span>
              </p>
              <p className="text-sm text-gray-500 mb-6">Бот отправит вам 4-значный код — введите его ниже</p>

              <div className="flex justify-center mb-6">
                <InputOTP maxLength={4} value={tgCode} onChange={setTgCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-14 h-14 text-2xl" />
                    <InputOTPSlot index={1} className="w-14 h-14 text-2xl" />
                    <InputOTPSlot index={2} className="w-14 h-14 text-2xl" />
                    <InputOTPSlot index={3} className="w-14 h-14 text-2xl" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button type="button" onClick={handleTelegramCode} className="w-full h-11 bg-[#2AABEE] hover:bg-[#229ED9] text-white font-medium" disabled={tgCode.length < 4}>
                Подтвердить
              </Button>

              <p className="text-center text-xs text-gray-400 mt-4">
                Код действителен 5 минут
              </p>
            </>
          )}

          {/* ====== MAGIC LINK SENT ====== */}
          {step === 'magic-link-sent' && (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-gray-900 font-medium">Проверьте вашу почту</p>
              <p className="text-sm text-gray-500">
                Мы отправили ссылку для входа на <span className="font-medium text-gray-700">{email}</span>
              </p>
              <button type="button" onClick={() => { setStep('main'); setEmail(''); }} className="text-sm text-gray-500 hover:text-gray-700 hover:underline mt-2">
                Отправить на другой email
              </button>
            </div>
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

export default Auth;
