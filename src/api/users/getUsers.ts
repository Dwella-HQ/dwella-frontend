import useSWR from "swr";

import { createUrl } from "@/utils/createUrl";

import type { UserDTO, UsersResponseDTO } from "./users.schema";
import { usersResponseSchema } from "./users.schema";

const USERS_ROUTE = "/api/users";

const fetchUsers = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.statusText}`);
  }

  const payload = await response.json();
  const parsed = usersResponseSchema.parse(payload);

  return parsed;
};

export type UseGetUsersParams = {
  search?: string;
  status?: UserDTO["status"];
};

export const getUsersKey = (params?: UseGetUsersParams) =>
  createUrl(USERS_ROUTE, {
    search: params?.search,
    status: params?.status,
  });

export const useGetUsers = (params?: UseGetUsersParams) =>
  useSWR<UsersResponseDTO>(getUsersKey(params), (url: string) =>
    fetchUsers(url)
  );
