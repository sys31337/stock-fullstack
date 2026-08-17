import axiosInstance from '@web/shared/services/api';
import queryClient from '@web/shared/services/queryClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { IPosSession } from '../types/pos';

const useGetOpenPOSSession = () => useQuery(
  ['Get open POS session'],
  async () => axiosInstance
    .request({ url: 'pos-sessions/open' })
    .then(({ data }) => data as { session: IPosSession | null }),
);

const useGetAllPOSSessions = () => useQuery(
  ['Get all POS sessions'],
  async () => axiosInstance
    .request({ url: 'pos-sessions' })
    .then(({ data }) => data as IPosSession[]),
);

const useOpenPOSSession = () => useMutation(
  (data: { warehouse?: string; openingCash?: number; notes?: string }) => axiosInstance.request({
    method: 'POST',
    url: 'pos-sessions/open',
    data,
  }),
  {
    onSuccess: () => {
      queryClient.invalidateQueries(['Get open POS session']);
      queryClient.invalidateQueries(['Get all POS sessions']);
    },
  },
);

const useClosePOSSession = () => useMutation(
  (data: { actualCash: number; notes?: string }) => axiosInstance.request({
    method: 'POST',
    url: 'pos-sessions/close',
    data,
  }),
  {
    onSuccess: () => {
      queryClient.invalidateQueries(['Get open POS session']);
      queryClient.invalidateQueries(['Get all POS sessions']);
    },
  },
);

export {
  useGetOpenPOSSession,
  useGetAllPOSSessions,
  useOpenPOSSession,
  useClosePOSSession,
};
