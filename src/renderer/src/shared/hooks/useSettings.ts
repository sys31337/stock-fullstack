import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@web/shared/services/api';

export const useGetSettings = (enabled = true) => useQuery({
  queryKey: ['settings'],
  queryFn: () => api.get('settings').then((r) => r.data),
  enabled,
});

export const useUpdateSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.put('settings', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
};
