import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@web/shared/services/api';

export const useGetAllRoles = () => useQuery({
  queryKey: ['roles'],
  queryFn: () => api.get('roles').then((r) => r.data),
});

export const useGetRole = (id: string) => useQuery({
  queryKey: ['roles', id],
  queryFn: () => api.get(`roles/${id}`).then((r) => r.data),
  enabled: !!id,
});

export const useCreateRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('roles', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
};

export const useUpdateRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`roles/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
};

export const useDeleteRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`roles/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
};

export const useSeedRoles = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('roles/seed').then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
};
