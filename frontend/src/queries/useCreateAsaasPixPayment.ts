import {useQuery} from "@tanstack/react-query";
import {orderClientPublic} from "../api/order.client.ts";
import {IdParam} from "../types.ts";

export const GET_CREATE_ASAAS_PIX_PAYMENT_QUERY_KEY = 'createAsaasPixPayment';

export const useCreateAsaasPixPayment = (eventId: IdParam, orderShortId: IdParam) => {
    return useQuery({
        queryKey: [GET_CREATE_ASAAS_PIX_PAYMENT_QUERY_KEY, eventId, orderShortId],

        queryFn: async () => {
            const data = await orderClientPublic.createAsaasPixPayment(
                Number(eventId),
                String(orderShortId),
            );
            return data;
        },

        retry: false,
        staleTime: 0,
        gcTime: 0,
        enabled: !!eventId && !!orderShortId,
    });
}

