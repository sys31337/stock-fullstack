import { Button } from '@web/shared/components/ui/button'
import { Input } from '@web/shared/components/ui/input'
import { Label } from '@web/shared/components/ui/label'
import { useFormik } from 'formik';
import { t } from 'i18next';
import { useLogin } from '@web/modules/Authentication/api/useLogin';
import { useGetAllUsers, PublicUser } from '@web/modules/Authentication/api/useGetAllUsers';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import parseJwt from '@web/shared/utils/parseJWT';
import cacheService from '@web/shared/services/cache';
import authService from '@web/shared/services/auth';
import i18next from 'i18next';
import { Lock, Loader2, ArrowLeft, Check } from 'lucide-react';
import { useState } from 'react';

const LANGUAGES = [
  { code: 'en', flag: '/assets/en.svg' },
  { code: 'fr', flag: '/assets/fr.svg' },
  { code: 'ar', flag: '/assets/ar.svg' },
];

const UserAvatar = ({ user, size = 'lg' }: { user: PublicUser; size?: 'sm' | 'lg' }) => {
  const hasImage = user.profilePicture && user.profilePicture !== 'default.png';
  const sizeClasses = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-10 h-10 text-sm';
  const iconSize = size === 'lg' ? 32 : 16;

  return (
    <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/20 ring-4 ring-white/20`}>
      {hasImage ? (
        <img src={`/assets/${user.profilePicture}`} alt={user.fullname || user.username} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-bold tracking-wide">
          {(user.fullname || user.username || '?')[0].toUpperCase()}
        </span>
      )}
    </div>
  );
};

const Authentication = () => {
  const { mutateAsync: login } = useLogin();
  const { data: users } = useGetAllUsers();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedUser, setSelectedUser] = useState<PublicUser | null>(null);

  const onSubmit = async (values: { password: string }, { setSubmitting }: { setSubmitting: (v: boolean) => void }) => {
    if (!selectedUser) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await login({ username: selectedUser.username, password: values.password });
      const parsedData = parseJwt(res.data.accessToken);
      const userData = {
        user_id: parsedData.userId,
        fullname: parsedData.fullname,
        token: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        permissions: res.data.permissions,
      };
      cacheService.set('PROFILE_PICTURE', parsedData.profilePicture || 'default.png');
      authService.saveUserInfo(userData);
      navigate('/products');
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setErrorMsg(error.response?.data?.message || error.response?.statusText || 'Login failed');
    }
    setSubmitting(false);
    setIsLoading(false);
  }

  const { handleSubmit, handleChange, values, resetForm } = useFormik({
    initialValues: { password: '' },
    onSubmit,
  })

  const handleBack = () => {
    setSelectedUser(null);
    setErrorMsg('');
    resetForm();
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <div className="w-24 h-24 rounded-3xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-8 ring-1 ring-white/20">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">SoluStock 2.0</h1>
          <p className="text-blue-100 text-lg text-center max-w-sm leading-relaxed">
            Gérez votre stock avec efficacité et simplicité
          </p>
          <div className="mt-16 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white">100%</div>
              <div className="text-blue-200 text-sm mt-1">Sécurisé</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">24/7</div>
              <div className="text-blue-200 text-sm mt-1">Disponible</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">Fast</div>
              <div className="text-blue-200 text-sm mt-1">Performance</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">SoluStock</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">
              {selectedUser ? t('password') : t('authentication')}
            </h2>
            <p className="text-muted-foreground mt-1.5">
              {selectedUser
                ? `${t('password')} pour ${selectedUser.fullname || selectedUser.username}`
                : 'Sélectionnez votre compte'}
            </p>
          </div>

          {/* Error */}
          <div
            className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-all mb-6 ${
              errorMsg
                ? 'border-destructive/50 bg-destructive/5 text-destructive'
                : 'border-transparent bg-transparent text-transparent pointer-events-none h-0 py-0 px-0 overflow-hidden'
            }`}
          >
            <span>{errorMsg}</span>
          </div>

          <form onSubmit={handleSubmit}>
            {!selectedUser ? (
              /* Step 1: User selection */
              <div className="space-y-3">
                {users?.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => setSelectedUser(user)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-accent hover:border-accent-foreground/10 transition-all duration-200 group text-left"
                  >
                    <UserAvatar user={user} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground truncate">{user.fullname || user.username}</div>
                      <div className="text-sm text-muted-foreground truncate">@{user.username}</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </button>
                ))}
                {!users?.length && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Aucun utilisateur trouvé
                  </div>
                )}
              </div>
            ) : (
              /* Step 2: Password */
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </button>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50">
                  <UserAvatar user={selectedUser} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{selectedUser.fullname || selectedUser.username}</div>
                    <div className="text-xs text-muted-foreground truncate">@{selectedUser.username}</div>
                  </div>
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    {t('password')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      placeholder="••••••"
                      onChange={handleChange}
                      value={values.password}
                      type="password"
                      className="pl-11 h-12 rounded-xl"
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl font-semibold text-base"
                  size="lg"
                  disabled={isLoading || !values.password}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    t('login')
                  )}
                </Button>
              </div>
            )}
          </form>

          {/* Language */}
          <div className="mt-10 pt-6 border-t flex items-center justify-center gap-2">
            {LANGUAGES.map(({ code, flag }) => (
              <button
                key={code}
                onClick={() => {
                  i18next.changeLanguage(code);
                  location.reload();
                }}
                className={`
                  p-1.5 rounded-full transition-all duration-200
                  ${i18next.language === code
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
                    : 'opacity-50 hover:opacity-100'
                  }
                `}
              >
                <img src={flag} alt={code} className="w-7 h-7 rounded-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Authentication;
