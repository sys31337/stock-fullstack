import axiosInstance from "@shared/services/api";
import { useMutation, useQuery } from "@tanstack/react-query";

const useCreateBill = () => useMutation((data) => axiosInstance.request({
  method: 'POST',
  url: 'bills',
  data,
}));

const useGetLatestBillNumber = (type: string) => useQuery(
  ['Get latest bill number'],
  async () => axiosInstance
    .request({
      url: `bills/${type}`,
    })
    .then(({ data }) => data),
);

export { useCreateBill, useGetLatestBillNumber };
