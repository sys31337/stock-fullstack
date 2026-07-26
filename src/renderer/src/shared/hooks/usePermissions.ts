import { useQuery } from '@tanstack/react-query';
import api from '@web/shared/services/api';

export const useGetPermissions = () => useQuery({
  queryKey: ['permissions'],
  queryFn: () => api.get('permissions').then((r) => r.data),
});
