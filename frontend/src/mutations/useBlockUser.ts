import {useMutation, useQueryClient} from "@tanstack/react-query";
import {adminClient} from "../api/admin.client";
import {IdParam} from "../types";
import {GET_ALL_USERS_QUERY_KEY} from "../queries/useGetAllUsers";

export const useBlockUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: IdParam) => adminClient.blockUser(userId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: [GET_ALL_USERS_QUERY_KEY]});
        },
    });
};

