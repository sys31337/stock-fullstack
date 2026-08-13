import axiosInstance from "@web/shared/services/api";
import queryClient from "@web/shared/services/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Payload } from "../types/payload";

const useGetAllBills = () => useQuery(
  ['Get all bills'],
  async () => axiosInstance
    .request({
      url: 'bills',
    })
    .then(({ data }) => data),
);

const useGetAllBillsOfType = (type: string) => useQuery(
  ['Get all bills of type', type],
  async () => axiosInstance
    .request({
      url: `bills/${type}`,
    })
    .then(({ data }) => data),
);

const useGetLatestBillNumber = (type: string) => useQuery(
  ['Get latest bill number', type],
  async () => axiosInstance
    .request({
      url: `bills/${type}`,
    })
    .then(({ data }) => {
      const latest = (data || []).find((b: any) => /^\d+$/.test(String(b.orderId)));
      return latest ? Number(latest.orderId) : 0;
    }),
);

const useGetBillInfo = (id: string, options?: any) => useQuery(
  ['Get bill information', id],
  async () => axiosInstance
    .request({
      url: `bills/info/${id}`,
    })
    .then(({ data }) => data),
  options
);

const useCreateBill = () => useMutation((data: Payload) => axiosInstance.request({
  method: 'POST',
  url: 'bills',
  data,
}), {
  onSuccess: () => {
    queryClient.invalidateQueries(['Get all bills']);
    queryClient.invalidateQueries(['Get all bills of type']);
    queryClient.invalidateQueries(['Get all products']);
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'], refetchType: 'all' });
    queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'], refetchType: 'all' });
  }
});

const useUpdateBill = (id?: string) => useMutation((data) => axiosInstance.request({
  method: 'PUT',
  url: `bills/info/${id}`,
  data,
}), {
  onSuccess: () => {
    queryClient.invalidateQueries(['Get all bills']);
    queryClient.invalidateQueries(['Get all bills of type']);
    queryClient.invalidateQueries(['Get bill information', id])
    queryClient.invalidateQueries(['Get all products']);
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'], refetchType: 'all' });
    queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'], refetchType: 'all' });
  }
});


const useCancelOrder = () => useMutation((id: string) => axiosInstance.request({
  method: 'PUT',
  url: `bills/order/${id}/cancel`,
}), {
  onSuccess: () => {
    queryClient.invalidateQueries(['Get all bills']);
    queryClient.invalidateQueries(['Get all bills of type']);
    queryClient.invalidateQueries(['Get all products']);
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'], refetchType: 'all' });
    queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'], refetchType: 'all' });
  }
});

const useCompleteOrder = () => useMutation((id: string) => axiosInstance.request({
  method: 'PUT',
  url: `bills/order/${id}/complete`,
}), {
  onSuccess: () => {
    queryClient.invalidateQueries(['Get all bills']);
    queryClient.invalidateQueries(['Get all bills of type']);
    queryClient.invalidateQueries(['Get all products']);
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'], refetchType: 'all' });
    queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'], refetchType: 'all' });
  }
});

const useUpdateBillContent = (id?: string) => useMutation((data: { content: string; description?: string }) => axiosInstance.request({
  method: 'PUT',
  url: `bills/info/${id}/content`,
  data,
}), {
  onSuccess: () => {
    queryClient.invalidateQueries(['Get bill information', id])
    queryClient.invalidateQueries(['Get all bills']);
    queryClient.invalidateQueries(['Get all bills of type']);
  }
});

const useCheckBillOrderId = () => useMutation(({ type, orderId }: { type: string, orderId: string }) => axiosInstance.request({
  url: `bills/${type}/check-id/${orderId}`,
}).then(({ data }) => data.exists));

export { useGetAllBills, useGetAllBillsOfType, useGetLatestBillNumber, useGetBillInfo, useCreateBill, useUpdateBill, useCancelOrder, useCompleteOrder, useCheckBillOrderId, useUpdateBillContent, };
