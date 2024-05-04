'use client'

import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react'
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
  const toast = useToast();
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
    <Flex
      minH={'100vh'}
      align={'center'}
      justify={'center'}
      bg={useColorModeValue('gray.50', 'gray.800')}>
      <Stack
        spacing={4}
        w={'full'}
        maxW={'md'}
        bg={useColorModeValue('white', 'gray.700')}
        rounded={'xl'}
        boxShadow={'lg'}
        p={6}
        my={12}>
        <Heading lineHeight={1.1} fontSize={{ base: '2xl', md: '3xl' }}>
          {t('authentication')}
        </Heading>
        <form onSubmit={handleSubmit}>

          <FormControl id="username" isRequired>
            <FormLabel>{t('username')}</FormLabel>
            <Input
              placeholder="E.g. Admin"
              onChange={handleChange}
              value={values.username}
              _placeholder={{ color: 'gray.500' }}
              type="username"
            />
          </FormControl>
          <FormControl id="password" isRequired>
            <FormLabel>{t('password')}</FormLabel>
            <Input onChange={handleChange} value={values.password} type="password" />
          </FormControl>
          <Stack mt={5} spacing={6}>
            <Button
              bg={'blue.400'}
              type={'submit'}
              color={'white'}
              _hover={{
                bg: 'blue.500',
              }}>
              {t('login')}
            </Button>
          </Stack>
        </form>
      </Stack>
    </Flex>
  )
}

export default Authentication;
