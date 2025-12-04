import React, {useState} from "react";
import {useNavigate, useParams} from "react-router";
import {useGetEventPublic} from "../../../../queries/useGetEventPublic.ts";
import {CheckoutContent} from "../../../layouts/Checkout/CheckoutContent";
import {StripePaymentMethod} from "./PaymentMethods/Stripe";
import {OfflinePaymentMethod} from "./PaymentMethods/Offline";
import {AsaasPixPaymentMethod} from "./PaymentMethods/AsaasPix";
import {Event, Order} from "../../../../types.ts";
import {CheckoutFooter} from "../../../layouts/Checkout/CheckoutFooter";
import {Group} from "@mantine/core";
import {formatCurrency} from "../../../../utilites/currency.ts";
import {t} from "@lingui/macro";
import {useGetOrderPublic} from "../../../../queries/useGetOrderPublic.ts";
import {
    useTransitionOrderToOfflinePaymentPublic
} from "../../../../mutations/useTransitionOrderToOfflinePaymentPublic.ts";
import {Card} from "../../../common/Card";
import {showError} from "../../../../utilites/notifications.tsx";

const Payment = () => {
    const navigate = useNavigate();
    const {eventId, orderShortId} = useParams();
    const {data: event, isFetched: isEventFetched} = useGetEventPublic(eventId);
    const {data: order, isFetched: isOrderFetched} = useGetOrderPublic(eventId, orderShortId, ['event']);
    const isLoading = !isOrderFetched;
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);
    const [activePaymentMethod, setActivePaymentMethod] = useState<'STRIPE' | 'OFFLINE' | 'ASAAS_PIX' | null>(null);
    const [submitHandler, setSubmitHandler] = useState<(() => Promise<void>) | null>(null);
    const transitionOrderToOfflinePaymentMutation = useTransitionOrderToOfflinePaymentPublic();

    const isStripeEnabled = event?.settings?.payment_providers?.includes('STRIPE');
    const isOfflineEnabled = event?.settings?.payment_providers?.includes('OFFLINE');
    const isAsaasPixEnabled = event?.settings?.payment_providers?.includes('ASAAS_PIX');

    React.useEffect(() => {
        // Automatically set the first available payment method
        if (isStripeEnabled) {
            setActivePaymentMethod('STRIPE');
        } else if (isAsaasPixEnabled) {
            setActivePaymentMethod('ASAAS_PIX');
        } else if (isOfflineEnabled) {
            setActivePaymentMethod('OFFLINE');
        } else {
            setActivePaymentMethod(null); // No methods available
        }
    }, [isStripeEnabled, isAsaasPixEnabled, isOfflineEnabled]);

    const handleParentSubmit = () => {
        if (submitHandler) {
            setIsPaymentLoading(true);
            submitHandler().finally(() => setIsPaymentLoading(false));
        }
    };

    const handleSubmit = async () => {
        if (activePaymentMethod === 'STRIPE') {
            handleParentSubmit();
        } else if (activePaymentMethod === 'ASAAS_PIX') {
            // Pix payment doesn't require submit - payment is done externally
            // The webhook will handle the confirmation
            // Just show a message or redirect to summary
        } else if (activePaymentMethod === 'OFFLINE') {
            setIsPaymentLoading(true);

            await transitionOrderToOfflinePaymentMutation.mutateAsync({
                eventId,
                orderShortId
            }, {
                onSuccess: () => {
                    navigate(`/checkout/${eventId}/${orderShortId}/summary`);
                },
                onError: (error: any) => {
                    setIsPaymentLoading(false);
                    showError(error.response?.data?.message || t`Offline payment failed. Please try again or contact the event organizer.`);
                }
            });
        }
    };

    if (!isStripeEnabled && !isOfflineEnabled && !isAsaasPixEnabled && isOrderFetched && isEventFetched) {
        return (
            <CheckoutContent>
                <Card>
                    {t`No payment methods are currently available. Please contact the event organizer for assistance.`}
                </Card>
            </CheckoutContent>
        );
    }

    return (
        <>
            <CheckoutContent>
                {isStripeEnabled && (
                    <div style={{display: activePaymentMethod === 'STRIPE' ? 'block' : 'none'}}>
                        <StripePaymentMethod enabled={true} setSubmitHandler={setSubmitHandler}/>
                    </div>
                )}

                {isAsaasPixEnabled && (
                    <div style={{display: activePaymentMethod === 'ASAAS_PIX' ? 'block' : 'none'}}>
                        <AsaasPixPaymentMethod enabled={true} />
                    </div>
                )}

                {isOfflineEnabled && (
                    <div style={{display: activePaymentMethod === 'OFFLINE' ? 'block' : 'none'}}>
                        <OfflinePaymentMethod event={event as Event}/>
                    </div>
                )}

                {((isStripeEnabled && isOfflineEnabled) || 
                  (isStripeEnabled && isAsaasPixEnabled) || 
                  (isAsaasPixEnabled && isOfflineEnabled) ||
                  (isStripeEnabled && isOfflineEnabled && isAsaasPixEnabled)) && (
                    <div style={{marginTop: '20px'}}>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                            {isStripeEnabled && activePaymentMethod !== 'STRIPE' && (
                                <a
                                    onClick={() => setActivePaymentMethod('STRIPE')}
                                    style={{cursor: 'pointer'}}
                                >
                                    {t`Eu gostaria de pagar usando cartão de crédito (Stripe)`}
                                </a>
                            )}
                            {isAsaasPixEnabled && activePaymentMethod !== 'ASAAS_PIX' && (
                                <a
                                    onClick={() => setActivePaymentMethod('ASAAS_PIX')}
                                    style={{cursor: 'pointer'}}
                                >
                                    {t`Eu gostaria de pagar usando Pix`}
                                </a>
                            )}
                            {isOfflineEnabled && activePaymentMethod !== 'OFFLINE' && (
                                <a
                                    onClick={() => setActivePaymentMethod('OFFLINE')}
                                    style={{cursor: 'pointer'}}
                                >
                                    {t`Eu gostaria de pagar diretamente ao organizador (offline)`}
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </CheckoutContent>

            <CheckoutFooter
                event={event as Event}
                order={order as Order}
                isLoading={isLoading || isPaymentLoading}
                onClick={activePaymentMethod === 'ASAAS_PIX' ? undefined : handleSubmit}
                buttonContent={order?.is_payment_required && activePaymentMethod !== 'ASAAS_PIX' ? (
                    <Group gap={'10px'}>
                        <div style={{fontWeight: "bold"}}>
                            {t`Place Order`}
                        </div>
                        <div style={{fontSize: 14}}>
                            {formatCurrency(order.total_gross, order.currency)}
                        </div>
                        <div style={{fontSize: 14, fontWeight: 500}}>
                            {order.currency}
                        </div>
                    </Group>
                ) : t`Complete Payment`}
            />
        </>
    );
}

export default Payment;
