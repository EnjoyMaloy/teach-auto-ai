import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import authIllustration from '@/assets/auth-illustration.jpg';
import Logo from '@/assets/Logo.svg';
const GoogleIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>;
const emailSchema = z.string().email('Введите корректный email');
const passwordSchema = z.string().min(6, 'Пароль должен содержать минимум 6 символов');
const Auth: React.FC = () => {
  const navigate = useNavigate();
  const {
    signIn,
    signUp,
    signInWithGoogle
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const validateForm = (): boolean => {
    const newErrors: {
      email?: string;
      password?: string;
    } = {};
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0]?.message;
      }
    }
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0]?.message;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    if (isSignUp) {
      const {
        error
      } = await signUp(email, password);
      setIsLoading(false);
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Этот email уже зарегистрирован');
        } else {
          toast.error('Ошибка регистрации: ' + error.message);
        }
        return;
      }
      toast.success('Аккаунт создан! Добро пожаловать!');
      navigate('/');
    } else {
      const {
        error
      } = await signIn(email, password);
      setIsLoading(false);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Неверный email или пароль');
        } else {
          toast.error('Ошибка входа: ' + error.message);
        }
        return;
      }
      toast.success('Добро пожаловать!');
      navigate('/');
    }
  };
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error('Ошибка входа через Google: ' + result.error.message);
      setIsGoogleLoading(false);
    }
  };
  return <div className="min-h-screen flex flex-col lg:flex-row bg-white relative">
      {/* Logo - Top Left Corner */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-8 lg:left-16 xl:left-24 flex items-center gap-3 z-10">
        <img src={Logo} alt="Academy Logo" className="h-6 sm:h-8" />
      </div>

      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-16 xl:px-24 pt-16 pb-8 lg:py-0">
        <div className="w-full max-w-[400px] mx-auto">
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-foreground mb-6 sm:mb-8">
            {isSignUp ? 'Создайте аккаунт' : 'Войдите в аккаунт'}
          </h1>

          {/* Google Sign In Button */}
          <Button type="button" variant="outline" className="w-full h-11 bg-white border-gray-200 hover:bg-gray-50 text-gray-700 hover:text-gray-700 font-semibold" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
            {isGoogleLoading ? <Loader2 className="w-4 h-4 mr-3 animate-spin" /> : <span className="mr-3"><GoogleIcon /></span>}
            {isSignUp ? 'Зарегистрироваться через Google' : 'Войти через Google'}
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-400">Или</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-gray-700 font-semibold">
                Email
              </Label>
              <Input id="email" type="email" placeholder="Введите ваш email" value={email} onChange={e => setEmail(e.target.value)} className={`h-11 bg-gray-50 border-gray-200 focus:border-gray-300 focus:ring-0 placeholder:text-gray-400 ${errors.email ? 'border-red-400' : ''}`} />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-gray-700 font-semibold">
                Пароль
              </Label>
              <Input id="password" type="password" placeholder="Введите ваш пароль" value={password} onChange={e => setPassword(e.target.value)} className={`h-11 bg-gray-50 border-gray-200 focus:border-gray-300 focus:ring-0 placeholder:text-gray-400 ${errors.password ? 'border-red-400' : ''}`} />
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium mt-2" disabled={isLoading}>
              {isLoading ? <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isSignUp ? 'Регистрация...' : 'Вход...'}
                </> : isSignUp ? 'Зарегистрироваться' : 'Войти'}
            </Button>
          </form>

          {/* Switch mode */}
          <p className="text-center text-sm text-gray-500 mt-6">
            {isSignUp ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}{' '}
            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:underline font-medium">
              {isSignUp ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </p>

          {/* Terms */}
          {isSignUp && <p className="text-xs text-gray-400 text-center mt-4">
              Нажимая "Зарегистрироваться", вы соглашаетесь с{' '}
              <a href="#" className="text-gray-500 hover:underline">Условиями использования</a>
              {' '}и{' '}
              <a href="#" className="text-gray-500 hover:underline">Политикой конфиденциальности</a>.
            </p>}
        </div>
      </div>

      {/* Right side - Illustration */}
      <div className="hidden lg:flex lg:flex-1 p-6">
        <div className="relative w-full h-full rounded-3xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
          <img src={authIllustration} alt="Creative workspace" className="absolute inset-0 w-full h-full object-cover" fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute bottom-12 left-12 right-12">
            <h2 className="text-3xl font-semibold text-white leading-tight">
              Превращайте идеи<br />в обучающие курсы
            </h2>
          </div>
        </div>
      </div>
    </div>;
};
export default Auth;