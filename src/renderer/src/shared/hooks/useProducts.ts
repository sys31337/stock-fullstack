import axiosInstance from "@shared/services/api";
import queryClient from "@shared/services/queryClient";
import { Payload } from "@shared/types/payload";
import { useMutation, useQuery } from "@tanstack/react-query";

const useGetAllProducts = () => useQuery(
  ['Get all products'],
  async () => axiosInstance
    .request({
      url: 'products',
    })
    .then(({ data }) => data),
);

const useUpdateProduct = (id: string) => useMutation((payload: Payload) => axiosInstance.request({
  method: 'PUT',
  url: `products/${id}`,
  data: payload,
}), { onSuccess: () => queryClient.invalidateQueries(['Get all products']) });

export {
  useUpdateProduct,
  useGetAllProducts,
}