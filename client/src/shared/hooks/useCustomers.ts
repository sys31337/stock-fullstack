import axiosInstance from "@shared/services/api";
import { useQuery } from "@tanstack/react-query";

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

export {
  useGetAllCustomers, 
  useGetClients,
  useGetSuppliers,
}
