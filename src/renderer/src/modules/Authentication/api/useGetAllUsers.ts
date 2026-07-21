import axiosInstance from '@web/shared/services/api';
import { useQuery } from '@tanstack/react-query';

export interface PublicUser {
  _id: string;
  username: string;
  fullname?: string;
  profilePicture?: string;
}

export const useGetAllUsers = () => useQuery(['users'], async () => {
  const { data } = await axiosInstance.request<PublicUser[]>({
    method: 'GET',
    url: 'users',
  });
  return data;
});
