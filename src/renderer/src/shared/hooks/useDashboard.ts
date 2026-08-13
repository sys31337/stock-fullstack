import { useQuery } from '@tanstack/react-query';
import api from '@web/shared/services/api';

export interface DashboardStats {
  statisticsEnabled: boolean;
  statisticsBlurred: boolean;
  totalProducts?: number;
  totalCustomers?: number;
  totalSuppliers?: number;
  todaySales?: number;
  todayPurchases?: number;
  todaySalesAmount?: number;
  todayPurchasesAmount?: number;
  yesterdaySalesAmount?: number;
  totalSalesAmount?: number;
  totalPurchasesAmount?: number;
  pendingOrders?: number;
  lowStockProducts?: number;
  totalWarehouses?: number;
  totalUsers?: number;
  recentMovements?: any[];
}

export interface RevenuePoint {
  date: string;
  total: number;
}

export interface CategorySlice {
  name: string;
  value: number;
}

export interface TopProduct {
  name: string;
  quantity: number;
  total: number;
}

export interface DashboardAnalytics extends DashboardStats {
  revenueTrend: RevenuePoint[];
  salesByCategory: CategorySlice[];
  topProducts: TopProduct[];
}

export const useDashboardStats = () => useQuery({
  queryKey: ['dashboard-stats'],
  queryFn: () => api.get('dashboard').then((r) => r.data as DashboardStats),
  refetchInterval: 30 * 1000,
  refetchOnWindowFocus: true,
});

export interface DashboardAnalyticsFilters {
  warehouse?: string;
  days?: number;
}

export const useDashboardAnalytics = (filters: DashboardAnalyticsFilters = {}, enabled = false) => useQuery({
  queryKey: ['dashboard-analytics', filters],
  queryFn: () => api.get('dashboard/analytics', { params: filters }).then((r) => r.data as DashboardAnalytics),
  enabled,
  staleTime: 60 * 1000,
  refetchInterval: enabled ? 30 * 1000 : false,
  refetchOnWindowFocus: true,
});
