import React, {useState} from "react";
import {useNavigate, useParams} from "react-router";
import {useGetEventPublic} from "../../../../queries/useGetEventPublic.ts";
import {CheckoutContent} from "../../../layouts/Checkout/CheckoutContent";
import {StripePaymentMethod} from "./PaymentMethods/Stripe";
import {OfflinePaymentMethod} from "./PaymentMethods/Offline";
import {AsaasPixPaymentMethod} from "./PaymentMethods/AsaasPix";
import {AsaasCreditCardPaymentMethod} from "./PaymentMethods/AsaasCreditCard";
import {Event, Order} from "../../../../types.ts";
import {CheckoutFooter} from "../../../layouts/Checkout/CheckoutFooter";
import {Group, Button, Card, Text} from "@mantine/core";
import {formatCurrency} from "../../../../utilites/currency.ts";
import {t} from "@lingui/macro";
import {useGetOrderPublic} from "../../../../queries/useGetOrderPublic.ts";
import {
    useTransitionOrderToOfflinePaymentPublic
} from "../../../../mutations/useTransitionOrderToOfflinePaymentPublic.ts";
import {showError} from "../../../../utilites/notifications.tsx";

const Payment = () => {
    const navigate = useNavigate();
    const {eventId, orderShortId} = useParams();
    const {data: event, isFetched: isEventFetched} = useGetEventPublic(eventId);
    const {data: order, isFetched: isOrderFetched} = useGetOrderPublic(eventId, orderShortId, ['event']);
    const isLoading = !isOrderFetched;
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);
    const [activePaymentMethod, setActivePaymentMethod] = useState<'STRIPE' | 'OFFLINE' | 'ASAAS_PIX' | 'ASAAS_CREDIT_CARD' | null>(null);
    const [submitHandler, setSubmitHandler] = useState<(() => Promise<void>) | null>(null);
    const transitionOrderToOfflinePaymentMutation = useTransitionOrderToOfflinePaymentPublic();

    const isStripeEnabled = event?.settings?.payment_providers?.includes('STRIPE');
    const isOfflineEnabled = event?.settings?.payment_providers?.includes('OFFLINE');
    const isAsaasPixEnabled = event?.settings?.payment_providers?.includes('ASAAS_PIX');
    const isAsaasCreditCardEnabled = event?.settings?.payment_providers?.includes('ASAAS_CREDIT_CARD');

    React.useEffect(() => {
        // Automatically set the first available payment method (but NOT Asaas methods - user must choose)
        if (isStripeEnabled) {
            setActivePaymentMethod('STRIPE');
        } else if (isOfflineEnabled) {
            setActivePaymentMethod('OFFLINE');
        } else {
            // Don't auto-select Asaas methods - user must choose
            setActivePaymentMethod(null);
        }
    }, [isStripeEnabled, isOfflineEnabled]);

    const handleParentSubmit = () => {
        if (submitHandler) {
            setIsPaymentLoading(true);
            submitHandler().finally(() => setIsPaymentLoading(false));
        }
    };

    const handleSubmit = async () => {
        if (activePaymentMethod === 'STRIPE') {
            handleParentSubmit();
        } else if (activePaymentMethod === 'ASAAS_PIX' || activePaymentMethod === 'ASAAS_CREDIT_CARD') {
            // Asaas payments don't require submit - payment is done externally
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

    if (!isStripeEnabled && !isOfflineEnabled && !isAsaasPixEnabled && !isAsaasCreditCardEnabled && isOrderFetched && isEventFetched) {
        return (
            <CheckoutContent>
                <Card>
                    {t`No payment methods are currently available. Please contact the event organizer for assistance.`}
                </Card>
            </CheckoutContent>
        );
    }

    // Conta quantos métodos de pagamento estão disponíveis
    const availableMethodsCount = [
        isStripeEnabled,
        isAsaasPixEnabled,
        isAsaasCreditCardEnabled,
        isOfflineEnabled
    ].filter(Boolean).length;

    // Mostra botões de seleção se há múltiplos métodos ou se nenhum está selecionado
    const showMethodSelection = availableMethodsCount > 1 || activePaymentMethod === null;
    const isAsaasMethodSelected = activePaymentMethod === 'ASAAS_PIX' || activePaymentMethod === 'ASAAS_CREDIT_CARD';

    return (
        <>
            <CheckoutContent>
                {/* Seção de seleção de métodos de pagamento */}
                {showMethodSelection && (
                    <Card padding="lg" radius="md" withBorder mb="md">
                        <Text fw={500} size="lg" mb="md">{t`Selecione o método de pagamento`}</Text>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                            {isStripeEnabled && (
                                <Button
                                    variant={activePaymentMethod === 'STRIPE' ? 'filled' : 'outline'}
                                    onClick={() => setActivePaymentMethod('STRIPE')}
                                    fullWidth
                                >
                                    {t`Cartão de Crédito (Stripe)`}
                                </Button>
                            )}
                            {isAsaasPixEnabled && (
                                <Button
                                    variant={activePaymentMethod === 'ASAAS_PIX' ? 'filled' : 'outline'}
                                    onClick={() => setActivePaymentMethod('ASAAS_PIX')}
                                    fullWidth
                                >
                                    {t`Pix`}
                                </Button>
                            )}
                            {isAsaasCreditCardEnabled && (
                                <Button
                                    variant={activePaymentMethod === 'ASAAS_CREDIT_CARD' ? 'filled' : 'outline'}
                                    onClick={() => setActivePaymentMethod('ASAAS_CREDIT_CARD')}
                                    fullWidth
                                >
                                    {t`Cartão de Crédito (Asaas)`}
                                </Button>
                            )}
                            {isOfflineEnabled && (
                                <Button
                                    variant={activePaymentMethod === 'OFFLINE' ? 'filled' : 'outline'}
                                    onClick={() => setActivePaymentMethod('OFFLINE')}
                                    fullWidth
                                >
                                    {t`Pagamento Direto ao Organizador`}
                                </Button>
                            )}
                        </div>
                    </Card>
                )}

                {/* Métodos de pagamento */}
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

                {isAsaasCreditCardEnabled && (
                    <div style={{display: activePaymentMethod === 'ASAAS_CREDIT_CARD' ? 'block' : 'none'}}>
                        <AsaasCreditCardPaymentMethod enabled={true} />
                    </div>
                )}

                {isOfflineEnabled && (
                    <div style={{display: activePaymentMethod === 'OFFLINE' ? 'block' : 'none'}}>
                        <OfflinePaymentMethod event={event as Event}/>
                    </div>
                )}
            </CheckoutContent>

            {/* Footer com botão - só aparece se não for método Asaas */}
            {!isAsaasMethodSelected && (
                <CheckoutFooter
                    event={event as Event}
                    order={order as Order}
                    isLoading={isLoading || isPaymentLoading}
                    onClick={handleSubmit}
                    buttonContent={order?.is_payment_required ? (
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
            )}
        </>
    );
}

export default Payment;
