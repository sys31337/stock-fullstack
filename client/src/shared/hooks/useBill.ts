import axiosInstance from "@shared/services/api";
import { useMutation, useQuery } from "@tanstack/react-query";

const useCreateBill = () => useMutation((data) => axiosInstance.request({
  method: 'POST',
  url: 'bills',
  data,
}));

const useGetAllBills = (type: string) => useQuery(
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
    .then(({ data }) => data.pop().orderId),
);

const useGetBillInfo = (id: string) => useQuery(
  ['Get bill information', id],
  async () => axiosInstance
    .request({
      url: `bills/info/${id}`,
    })
    .then(({ data }) => data),
);

export { useCreateBill, useGetLatestBillNumber, useGetBillInfo, useGetAllBills };
