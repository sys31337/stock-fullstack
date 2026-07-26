import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@web/shared/services/api';

export const useGetAllUsersEnhanced = (params?: Record<string, any>) => useQuery({
  queryKey: ['users-enhanced', params],
  queryFn: () => api.get('users-enhanced', { params }).then((r) => r.data),
});

export const useGetUserEnhanced = (id: string) => useQuery({
  queryKey: ['users-enhanced', id],
  queryFn: () => api.get(`users-enhanced/${id}`).then((r) => r.data),
  enabled: !!id,
});

export const useCreateUserEnhanced = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('users-enhanced', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users-enhanced'] }),
  });
};

export const useUpdateUserEnhanced = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`users-enhanced/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users-enhanced'] }),
  });
};

export const useDeleteUserEnhanced = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`users-enhanced/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users-enhanced'] }),
  });
};

export const useForceLogout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`users-enhanced/${id}/force-logout`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users-enhanced'] }),
  });
};

export const useSwitchWarehouse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (warehouseId: string) => api.post('users-enhanced/switch-warehouse', { warehouseId }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users-enhanced'] }),
  });
};

export const useGetMyPermissions = () => useQuery({
  queryKey: ['my-permissions'],
  queryFn: () => api.get('users-enhanced/permissions').then((r) => r.data),
});
