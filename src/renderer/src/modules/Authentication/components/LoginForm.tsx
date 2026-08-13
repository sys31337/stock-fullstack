import { useEffect, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import { Button } from '@web/shared/components/ui/button';
import { Input } from '@web/shared/components/ui/input';
import { Label } from '@web/shared/components/ui/label';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { t } from 'i18next';
import { PublicUser } from '../api/useGetAllUsers';
import UserSelect from './UserSelect';

interface LoginFormProps {
  users: PublicUser[];
  initialUsername?: string;
  onSubmit: (values: { username: string; password: string }) => Promise<void>;
}

const LoginForm = ({ users, initialUsername, onSubmit }: LoginFormProps) => {
  const [username, setUsername] = useState(initialUsername ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialUsername && !username) {
      setUsername(initialUsername);
    }
  }, [initialUsername, username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || isLoading) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      await onSubmit({ username: username.trim(), password });
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setErrorMsg(error.response?.data?.message || error.response?.statusText || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {t('account')}
        </Label>
        <UserSelect
          users={users}
          value={username}
          onPickUser={(user) => {
            setUsername(user.username);
            setErrorMsg('');
            passwordRef.current?.focus();
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          {t('password')}
        </Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="password"
            name="password"
            ref={passwordRef}
            placeholder="••••••"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorMsg('');
            }}
            className="pl-11 pr-11 h-12 rounded-xl"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={showPassword ? t('hidePassword') : t('showPassword')}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/5 text-destructive px-4 py-3 text-sm">
          <span>{errorMsg}</span>
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full h-12 rounded-xl font-semibold text-base"
        disabled={isLoading || !username.trim() || !password}
      >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('login')}
      </Button>
    </form>
  );
};

export default LoginForm;
