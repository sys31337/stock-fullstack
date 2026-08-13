import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@web/shared/services/api';
import {
  ReportsOverview,
  LedgerResponse,
  LedgerDetailResponse,
  LedgerStatementResponse,
  CashStatementResponse,
  ProductStatsResponse,
  SalespersonOption,
  SalespersonChartResponse,
} from '@web/shared/types/reports';

export interface LedgerFilters {
  page?: number;
  limit?: number;
  party?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const useReportsOverview = () => useQuery({
  queryKey: ['reports-overview'],
  queryFn: () => api.get('reports/overview').then((r) => r.data as ReportsOverview),
  staleTime: 60 * 1000,
});

export const useLedger = (filters: LedgerFilters) => useQuery({
  queryKey: ['reports-ledger', filters],
  queryFn: () => api.get('reports/ledger', { params: filters }).then((r) => r.data as LedgerResponse),
  keepPreviousData: true,
});

export const useLedgerDetail = (id: string, range?: { startDate?: string; endDate?: string }, enabled = true) => useQuery({
  queryKey: ['reports-ledger-detail', id, range],
  queryFn: () => api.get(`reports/ledger/detail/${id}`, { params: range }).then((r) => r.data as LedgerDetailResponse),
  enabled: !!id && enabled,
});

export const useLedgerStatement = (id: string, range?: { startDate?: string; endDate?: string }, enabled = true) => useQuery({
  queryKey: ['reports-ledger-statement', id, range],
  queryFn: () => api.get(`reports/ledger/statement/${id}`, { params: range }).then((r) => r.data as LedgerStatementResponse),
  enabled: !!id && enabled,
});

export const useCashStatement = (range: { startDate?: string; endDate?: string }, enabled = true) => useQuery({
  queryKey: ['reports-cash-statement', range],
  queryFn: () => api.get('reports/cash-statement', { params: range }).then((r) => r.data as CashStatementResponse),
  enabled,
});

export interface ProductStatFilters {
  page?: number;
  limit?: number;
  party?: string;
  startDate?: string;
  endDate?: string;
}

export const useProductStats = (id: string, filters: ProductStatFilters, enabled = true) => useQuery({
  queryKey: ['reports-product-stats', id, filters],
  queryFn: () => api.get(`reports/products/${id}`, { params: filters }).then((r) => r.data as ProductStatsResponse),
  enabled: !!id && enabled,
  keepPreviousData: true,
});

export const useSalespeople = () => useQuery({
  queryKey: ['reports-salespeople'],
  queryFn: () => api.get('reports/salespeople').then((r) => r.data as SalespersonOption[]),
});

export const useSalespersonChart = (
  id: string,
  range?: { startDate?: string; endDate?: string; groupBy?: string },
  enabled = true,
) => useQuery({
  queryKey: ['reports-salesperson-chart', id, range],
  queryFn: () => api.get(`reports/salespeople/${id}`, { params: range }).then((r) => r.data as SalespersonChartResponse),
  enabled: !!id && enabled,
});

export const useDeleteTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`transactions/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports-ledger'] });
      qc.invalidateQueries({ queryKey: ['reports-ledger-detail'] });
      qc.invalidateQueries({ queryKey: ['reports-ledger-statement'] });
      qc.invalidateQueries({ queryKey: ['reports-cash-statement'] });
      qc.invalidateQueries({ queryKey: ['reports-overview'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      qc.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      qc.invalidateQueries(['Get all bills']);
      qc.invalidateQueries(['Get all products']);
    },
  });
};
