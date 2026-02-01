'use client'

import { Button } from '@web/shared/components/ui/button'
import { Input } from '@web/shared/components/ui/input'
import { Label } from '@web/shared/components/ui/label'
import { useToast } from '@web/shared/components/ui/use-toast'
import { useFormik } from 'formik';
import { t } from 'i18next';
import { useLogin } from '@web/modules/Authentication/api/useLogin';
import { useNavigate } from 'react-router-dom';
import showToast from '@web/shared/functions/showToast';
import { AxiosError } from 'axios';
import parseJwt from '@web/shared/utils/parseJWT';
import cacheService from '@web/shared/services/cache';
import authService from '@web/shared/services/auth';

interface initialValues {
  username: string;
  password: string;
}

const Authentication = () => {
  const { mutateAsync: login } = useLogin();
  const { toast } = useToast();
  const navigate = useNavigate();

  const initialValues = {
    username: 'admin',
    password: '123123',
  };
  const onSubmit = async (values: initialValues, { setSubmitting }: { setSubmitting: (v: boolean) => void }) => {
    const { username, password } = values;
    try {
      const payload = { username, password };
      const res = await login(payload);
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
      navigate('/');
      showToast(
        toast,
        { title: 'Logged in', description: 'Logged in successfully' },
      );
      navigate('/products');
    } catch (err) {
      const error = err as AxiosError;
      showToast(
        toast,
        { title: `Error occured ${error.response?.status}`, description: `${error.response?.statusText} - Please try again later`, status: 'error' },
      );
    }

    setSubmitting(false);

  }

  const { handleSubmit, handleChange, values } = useFormik({
    initialValues,
    onSubmit,
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800">
      <div className="w-full max-w-md bg-white dark:bg-gray-700 rounded-xl shadow-lg p-6 my-12 space-y-4">
        <h1 className="leading-tight text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {t('authentication')}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-gray-700 dark:text-gray-200">{t('username')} <span className="text-red-500">*</span></Label>
            <Input
              id="username"
              placeholder="E.g. Admin"
              onChange={handleChange}
              value={values.username}
              type="text"
              className="dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 dark:text-gray-200">{t('password')} <span className="text-red-500">*</span></Label>
            <Input 
              id="password" 
              onChange={handleChange} 
              value={values.password} 
              type="password" 
              className="dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="pt-5">
            <Button
              type="submit"
              className="w-full bg-blue-400 hover:bg-blue-500 text-white"
            >
              {t('login')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Authentication;
