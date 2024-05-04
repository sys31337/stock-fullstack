import { useMutation, useQuery } from '@tanstack/react-query';
import { defaultId } from '@web/config';
import axiosInstance from '@web/shared/services/api';
import queryClient from '@web/shared/services/queryClient';
import { Payload } from '@web/shared/types/payload';

const useGetAllCustomers = () => useQuery(
  ['Get all customers'],
  async () => axiosInstance
    .request({
      url: 'customers',
    })
    .then(({ data }) => {
      const defaultCustomer = data.find((customer) => customer._id === defaultId);
      const restOfCustomers = data.filter((customer) => customer._id !== defaultId);
      return [defaultCustomer, ...restOfCustomers];
    }),
);

const useGetClients = () => useQuery(
  ['Get all clients'],
  async () => axiosInstance
    .request({
      url: 'customers/clients',
    })
    .then(({ data }) => data),
);

const useGetSuppliers = () => useQuery(
  ['Get all suppliers'],
  async () => axiosInstance
    .request({
      url: 'customers/suppliers',
    })
    .then(({ data }) => data),
);

const useCreateCustomer = () => useMutation((payload: Payload) => axiosInstance.request({
  method: 'POST',
  url: 'customers',
  data: payload,
}), { onSuccess: () => queryClient.invalidateQueries(['Get all customers']) });

export {
  useCreateCustomer,
  useGetAllCustomers,
  useGetClients,
  useGetSuppliers,
}
