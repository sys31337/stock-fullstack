import { useMutation, useQuery } from '@tanstack/react-query';
import axiosInstance from '@web/shared/services/api';
import queryClient from '@web/shared/services/queryClient';
import { Payload } from '@web/shared/types/payload';

const useGetAllTransactions = () => useQuery(
  ['Get all transactions'],
  async () => axiosInstance
    .request({
      url: 'transactions',
    })
    .then(({ data }) => data),
);

const useGetTransactionsByCustomer = (id: string) => useQuery(
  ['Get transactions by customer', id],
  async () => axiosInstance
    .request({
      url: `transactions/customer/${id}`,
    })
    .then(({ data }) => data),
  { enabled: !!id },
);

const useCreateTransaction = () => useMutation((payload: Payload) => axiosInstance.request({
  method: 'POST',
  url: 'transactions',
  data: payload,
}), {
  onSuccess: () => {
    queryClient.invalidateQueries(['Get all transactions']);
    queryClient.invalidateQueries(['Get all customers']);
    queryClient.invalidateQueries(['Get all clients']);
    queryClient.invalidateQueries(['Get all suppliers']);
  },
});

export {
  useGetAllTransactions,
  useGetTransactionsByCustomer,
  useCreateTransaction,
}
