import axiosInstance from "@web/shared/services/api";
import queryClient from "@web/shared/services/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";

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
  ['Get latest bill number'],
  async () => axiosInstance
    .request({
      url: `bills/${type}`,
    })
    .then(({ data }) => data.shift()?.orderId || 0),
);

const useGetBillInfo = (id: string) => useQuery(
  ['Get bill information', id],
  async () => axiosInstance
    .request({
      url: `bills/info/${id}`,
    })
    .then(({ data }) => data),
);

const useCreateBill = () => useMutation((data) => axiosInstance.request({
  method: 'POST',
  url: 'bills',
  data,
}), {
  onSuccess: () => {
    queryClient.invalidateQueries(['Get all bills']);
    queryClient.invalidateQueries(['Get all products']);
  }
});

const useUpdateBill = (id?: string) => useMutation((data) => axiosInstance.request({
  method: 'PUT',
  url: `bills/info/${id}`,
  data,
}), {
  onSuccess: () => {
    queryClient.invalidateQueries(['Get all bills']);
    queryClient.invalidateQueries(['Get bill information', id])
    queryClient.invalidateQueries(['Get all products']);
  }
});


export { useGetAllBills, useGetAllBillsOfType, useGetLatestBillNumber, useGetBillInfo, useCreateBill, useUpdateBill, };
