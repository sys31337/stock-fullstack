import axiosInstance from "@shared/services/api";
import queryClient from "@shared/services/queryClient";
import { Payload } from "@shared/types/payload";
import { useMutation, useQuery } from "@tanstack/react-query";

const useGetAllCustomers = () => useQuery(
  ['Get all customers'],
  async () => axiosInstance
    .request({
      url: 'customers',
    })
    .then(({ data }) => data),
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
