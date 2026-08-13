import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import parseJwt from '@web/shared/utils/parseJWT';
import cacheService from '@web/shared/services/cache';
import authService from '@web/shared/services/auth';
import { assetsBase } from '@web/config';
import { useLogin } from '@web/modules/Authentication/api/useLogin';
import { useGetAllUsers } from '@web/modules/Authentication/api/useGetAllUsers';
import LoginForm from '@web/modules/Authentication/components/LoginForm';
import LanguageSwitcher from '@web/modules/Authentication/components/LanguageSwitcher';

const Authentication = () => {
  const { mutateAsync: login } = useLogin();
  const { data: users } = useGetAllUsers();
  const navigate = useNavigate();

  const singleUser = users?.length === 1 ? users[0] : undefined;

  const onSubmit = async ({ username, password }: { username: string; password: string }) => {
    const res = await login({ username, password });
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
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-10 bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="pointer-events-none absolute -top-32 -left-32 w-[28rem] h-[28rem] bg-primary/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[42rem] h-[42rem] bg-primary/5 rounded-full blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)',
          backgroundSize: '26px 26px',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img
            src={`${assetsBase}assets/logo-h.png`}
            alt="SoluStock"
            className="h-11 sm:h-14 w-auto object-contain drop-shadow-md"
          />
        </div>

        <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-2xl shadow-foreground/10 p-6 sm:p-9">
          <div className="mb-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('welcomeBack')}</h2>
            <p className="text-muted-foreground mt-1.5 text-sm">{t('enterCredentials')}</p>
          </div>

          <LoginForm users={users ?? []} initialUsername={singleUser?.username} onSubmit={onSubmit} />
        </div>

        <LanguageSwitcher />
      </div>
    </div>
  );
};

export default Authentication;
