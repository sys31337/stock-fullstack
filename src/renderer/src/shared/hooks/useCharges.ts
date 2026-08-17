import axiosInstance from '@web/shared/services/api';
import queryClient from '@web/shared/services/queryClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ICharge, ChargeSummary } from '../types/charges';

interface ChargesFilter {
  type?: string;
  startDate?: string;
  endDate?: string;
  warehouse?: string;
}

const useGetCharges = (filter?: ChargesFilter) => useQuery(
  ['Get charges', filter],
  async () => axiosInstance
    .request({
      url: 'charges',
      params: filter,
    })
    .then(({ data }) => data as ICharge[]),
);

const useGetChargeSummary = (filter?: ChargesFilter) => useQuery(
  ['Get charge summary', filter],
  async () => axiosInstance
    .request({
      url: 'charges/summary',
      params: filter,
    })
    .then(({ data }) => data as ChargeSummary),
);

const useCreateCharge = () => useMutation(
  (data: Partial<ICharge>) => axiosInstance.request({
    method: 'POST',
    url: 'charges',
    data,
  }),
  {
    onSuccess: () => {
      queryClient.invalidateQueries(['Get charges']);
      queryClient.invalidateQueries(['Get charge summary']);
    },
  },
);

const useUpdateCharge = (id?: string) => useMutation(
  (data: Partial<ICharge>) => axiosInstance.request({
    method: 'PUT',
    url: `charges/${id}`,
    data,
  }),
  {
    onSuccess: () => {
      queryClient.invalidateQueries(['Get charges']);
      queryClient.invalidateQueries(['Get charge summary']);
    },
  },
);

const useDeleteCharge = () => useMutation(
  (id: string) => axiosInstance.request({
    method: 'DELETE',
    url: `charges/${id}`,
  }),
  {
    onSuccess: () => {
      queryClient.invalidateQueries(['Get charges']);
      queryClient.invalidateQueries(['Get charge summary']);
    },
  },
);

export {
  useGetCharges,
  useGetChargeSummary,
  useCreateCharge,
  useUpdateCharge,
  useDeleteCharge,
};
