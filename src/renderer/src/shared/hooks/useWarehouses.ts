import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@web/shared/services/api';

export const useGetAllWarehouses = () => useQuery({
  queryKey: ['warehouses'],
  queryFn: () => api.get('warehouses').then((r) => r.data),
});

export const useGetWarehouse = (id: string) => useQuery({
  queryKey: ['warehouses', id],
  queryFn: () => api.get(`warehouses/${id}`).then((r) => r.data),
  enabled: !!id,
});

export const useCreateWarehouse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('warehouses', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  });
};

export const useUpdateWarehouse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`warehouses/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  });
};

export const useDeleteWarehouse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`warehouses/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
  });
};
