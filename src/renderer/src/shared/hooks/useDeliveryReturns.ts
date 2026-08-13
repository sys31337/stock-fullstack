import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@web/shared/services/api';
import { DeliveryReturnListResponse, DeliveryReturnRecord } from '@web/shared/types/reports';

export interface DeliveryReturnFilters {
  page?: number;
  limit?: number;
  deliveryPerson?: string;
  warehouse?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const useDeliveryReturns = (filters: DeliveryReturnFilters) => useQuery({
  queryKey: ['delivery-returns', filters],
  queryFn: () => api.get('delivery-returns', { params: filters }).then((r) => r.data as DeliveryReturnListResponse),
  keepPreviousData: true,
});

export const useCreateDeliveryReturn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('delivery-returns', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delivery-returns'] });
      qc.invalidateQueries({ queryKey: ['reports-overview'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
};

export const useUpdateDeliveryReturn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`delivery-returns/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delivery-returns'] });
      qc.invalidateQueries({ queryKey: ['reports-overview'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
};

export const useDeleteDeliveryReturn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`delivery-returns/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delivery-returns'] });
      qc.invalidateQueries({ queryKey: ['reports-overview'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
};

export const getDeliveryPersonName = (r: DeliveryReturnRecord | undefined | null): string => {
  if (!r) return '';
  const p = r.deliveryPerson;
  if (typeof p === 'object' && p) return p.fullname || p.username || '';
  return '';
};
