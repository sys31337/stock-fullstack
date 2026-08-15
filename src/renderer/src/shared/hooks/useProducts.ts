import axiosInstance from "@web/shared/services/api";
import queryClient from "@web/shared/services/queryClient";
import { Payload } from "@web/shared/types/payload";
import { useMutation, useQuery } from "@tanstack/react-query";

const useGetAllProducts = (params?: { warehouse?: string }) => useQuery(
  ['Get all products', params?.warehouse],
  () => axiosInstance
    .request({
      url: 'products',
      params: params?.warehouse ? { warehouse: params.warehouse } : undefined,
    })
    .then(({ data }) => data),
);

const useUpdateProduct = (id: string) => useMutation((payload: Payload) => axiosInstance.request({
  method: 'PUT',
  url: `products/${id}`,
  data: payload,
}), { onSuccess: () => queryClient.invalidateQueries(['Get all products']) });

const useDeleteProduct = () => useMutation((id: string) => axiosInstance.request({
  method: 'DELETE',
  url: `products/${id}`,
}), { onSuccess: () => queryClient.invalidateQueries(['Get all products']) });

export {
  useUpdateProduct,
  useGetAllProducts,
  useDeleteProduct,
}
