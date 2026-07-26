import { useQuery } from '@tanstack/react-query';
import api from '@web/shared/services/api';

export const useGetStockMovements = (params?: Record<string, any>) => useQuery({
  queryKey: ['stock-movements', params],
  queryFn: () => api.get('stock-movements', { params }).then((r) => r.data),
});
