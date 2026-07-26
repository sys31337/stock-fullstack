import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@web/shared/services/api';

export const useGetAllTransfers = (params?: Record<string, any>) => useQuery({
  queryKey: ['warehouse-transfers', params],
  queryFn: () => api.get('warehouse-transfers', { params }).then((r) => r.data),
});

export const useCreateTransfer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('warehouse-transfers', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouse-transfers'] }),
  });
};

export const useApproveTransfer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`warehouse-transfers/${id}/approve`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouse-transfers'] }),
  });
};

export const useCancelTransfer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => api.put(`warehouse-transfers/${id}/cancel`, { reason }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouse-transfers'] }),
  });
};
