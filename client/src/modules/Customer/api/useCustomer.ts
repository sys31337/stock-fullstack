import axiosInstance from '@shared/services/api';
import { Payload } from '@shared/types/payload';
import { useMutation } from '@tanstack/react-query';

export const useCreateCustomer = () => useMutation((payload: Payload) => axiosInstance.request({
  method: 'POST',
  url: 'customers',
  data: payload,
}));