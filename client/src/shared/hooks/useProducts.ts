import axiosInstance from "@shared/services/api";
import { useQuery } from "@tanstack/react-query";

const useGetAllProducts = () => useQuery(
  ['Get all products'],
  async () => axiosInstance
    .request({
      url: 'products',
    })
    .then(({ data }) => data),
);

export {
  useGetAllProducts,
}