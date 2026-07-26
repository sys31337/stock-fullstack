import { useQuery } from '@tanstack/react-query';
import api from '@web/shared/services/api';

export const useGetAuditLogs = (params?: Record<string, any>) => useQuery({
  queryKey: ['audit-logs', params],
  queryFn: () => api.get('audit-logs', { params }).then((r) => r.data),
});
