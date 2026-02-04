import {useParams, useNavigate} from "react-router";
import {useEffect, useState} from "react";
import {useGetEventPublic} from "../../../../../../queries/useGetEventPublic.ts";
import {CheckoutContent} from "../../../../../layouts/Checkout/CheckoutContent";
import {HomepageInfoMessage} from "../../../../../common/HomepageInfoMessage";
import {t} from "@lingui/macro";
import {eventHomepagePath, eventCheckoutPath} from "../../../../../../utilites/urlHelper.ts";
import {LoadingMask} from "../../../../../common/LoadingMask";
import {Event} from "../../../../../../types.ts";
import {Card, Group, Text, Button, TextInput, Alert, Stack} from "@mantine/core";
import {formatCurrency} from "../../../../../../utilites/currency.ts";
import {useGetOrderPublic} from "../../../../../../queries/useGetOrderPublic.ts";
import {usePollGetOrderPublic} from "../../../../../../queries/usePollGetOrderPublic.ts";
import {orderClientPublic} from "../../../../../../api/order.client.ts";
import {showError} from "../../../../../../utilites/notifications.tsx";

interface AsaasCreditCardPaymentMethodProps {
    enabled: boolean;
}

export const AsaasCreditCardPaymentMethod = ({enabled}: AsaasCreditCardPaymentMethodProps) => {
    const {eventId, orderShortId} = useParams();
    const navigate = useNavigate();
    const {data: event} = useGetEventPublic(eventId);
    const {data: order, isFetched: isOrderFetched} = useGetOrderPublic(eventId, orderShortId);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
    
    // Form fields
    const [cpfCnpj, setCpfCnpj] = useState<string>('');
    const [holderName, setHolderName] = useState<string>('');
    const [cardNumber, setCardNumber] = useState<string>('');
    const [expiryMonth, setExpiryMonth] = useState<string>('');
    const [expiryYear, setExpiryYear] = useState<string>('');
    const [ccv, setCcv] = useState<string>('');
    const [postalCode, setPostalCode] = useState<string>('');
    const [addressNumber, setAddressNumber] = useState<string>('');
    const [addressComplement, setAddressComplement] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [mobilePhone, setMobilePhone] = useState<string>('');
    
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Usa polling quando o pagamento está sendo processado
    const shouldPoll = isProcessing || paymentStatus !== null;
    const {data: polledOrder} = usePollGetOrderPublic(
        eventId, 
        orderShortId, 
        shouldPoll,
        ['event']
    );
    
    const currentOrder = polledOrder || order;

    const formatCpfCnpj = (value: string): string => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 11) {
            return numbers.replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        return numbers.replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    };

    const formatCardNumber = (value: string): string => {
        const numbers = value.replace(/\D/g, '');
        return numbers.replace(/(\d{4})(?=\d)/g, '$1 ');
    };

    const formatPostalCode = (value: string): string => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 5) {
            return numbers;
        }
        return numbers.replace(/(\d{5})(\d)/, '$1-$2');
    };

    const formatPhone = (value: string): string => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 10) {
            return numbers.replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{4})(\d)/, '$1-$2');
        }
        return numbers.replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2');
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        
        const cpfCnpjNumbers = cpfCnpj.replace(/\D/g, '');
        if (cpfCnpjNumbers.length !== 11 && cpfCnpjNumbers.length !== 14) {
            newErrors.cpfCnpj = t`CPF must have 11 digits or CNPJ must have 14 digits.`;
        }
        
        if (!holderName.trim()) {
            newErrors.holderName = t`Cardholder name is required.`;
        }
        
        const cardNumberNumbers = cardNumber.replace(/\D/g, '');
        if (cardNumberNumbers.length < 13 || cardNumberNumbers.length > 19) {
            newErrors.cardNumber = t`Invalid card number.`;
        }
        
        if (!expiryMonth || parseInt(expiryMonth) < 1 || parseInt(expiryMonth) > 12) {
            newErrors.expiryMonth = t`Invalid expiry month.`;
        }
        
        const currentYear = new Date().getFullYear();
        if (!expiryYear || expiryYear.length !== 4 || parseInt(expiryYear) < currentYear) {
            newErrors.expiryYear = t`Invalid expiry year.`;
        }
        
        if (ccv.length < 3 || ccv.length > 4) {
            newErrors.ccv = t`CVV must have 3 or 4 digits.`;
        }
        
        const postalCodeNumbers = postalCode.replace(/\D/g, '');
        if (postalCodeNumbers.length !== 8) {
            newErrors.postalCode = t`Postal code must have 8 digits.`;
        }
        
        if (!addressNumber.trim()) {
            newErrors.addressNumber = t`Address number is required.`;
        }
        
        const phoneNumbers = phone.replace(/\D/g, '');
        if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
            newErrors.phone = t`Invalid phone format.`;
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsProcessing(true);
        setErrors({});

        try {
            const cardData = {
                cpf_cnpj: cpfCnpj.replace(/\D/g, ''),
                holder_name: holderName.trim(),
                card_number: cardNumber.replace(/\D/g, ''),
                expiry_month: expiryMonth,
                expiry_year: expiryYear,
                ccv: ccv,
                postal_code: postalCode.replace(/\D/g, ''),
                address_number: addressNumber.trim(),
                address_complement: addressComplement.trim() || undefined,
                phone: phone.replace(/\D/g, ''),
                mobile_phone: mobilePhone.trim() ? mobilePhone.replace(/\D/g, '') : undefined,
            };

            const data = await orderClientPublic.createAsaasCreditCardPayment(
                Number(eventId),
                String(orderShortId),
                cardData
            );
            
            setPaymentStatus(data.status);
            
            // Se o pagamento foi confirmado imediatamente, aguarda um pouco antes de verificar
            if (data.status === 'CONFIRMED' || data.status === 'RECEIVED') {
                setTimeout(() => {
                    // O polling vai atualizar o pedido
                }, 2000);
            }
        } catch (err: any) {
            setIsProcessing(false);
            const errorMessage = err.response?.data?.message || t`Failed to process payment. Please try again.`;
            showError(errorMessage);
            
            // Tenta extrair erros de validação específicos
            if (err.response?.data?.errors) {
                const validationErrors: Record<string, string> = {};
                err.response.data.errors.forEach((error: any) => {
                    if (error.field) {
                        validationErrors[error.field] = error.message;
                    }
                });
                if (Object.keys(validationErrors).length > 0) {
                    setErrors(validationErrors);
                }
            }
        }
    };

    // Verifica se o pagamento foi confirmado e redireciona
    useEffect(() => {
        if (!currentOrder || !paymentStatus) {
            return;
        }

        if (currentOrder.payment_status === 'PAYMENT_RECEIVED' || currentOrder.status === 'COMPLETED') {
            setIsProcessing(false);
            navigate(eventCheckoutPath(eventId, orderShortId, 'summary'));
        }
    }, [currentOrder?.payment_status, currentOrder?.status, paymentStatus, navigate, eventId, orderShortId]);

    if (!isOrderFetched || !currentOrder?.payment_status) {
        return (
            <CheckoutContent>
                <LoadingMask/>
            </CheckoutContent>
        );
    }

    if (currentOrder?.payment_status === 'PAYMENT_RECEIVED') {
        return (
            <CheckoutContent>
                <HomepageInfoMessage
                    message={t`This order has already been paid.`}
                    linkText={t`View order details`}
                    link={eventCheckoutPath(eventId, orderShortId, 'summary')}
                />
            </CheckoutContent>
        );
    }

    if (currentOrder?.payment_status !== 'AWAITING_PAYMENT' && currentOrder?.payment_status !== 'PAYMENT_FAILED') {
        return (
            <CheckoutContent>
                <HomepageInfoMessage
                    message={t`This order page is no longer available.`}
                    linkText={t`View order details`}
                    link={eventHomepagePath(event as Event)}
                />
            </CheckoutContent>
        );
    }

    if (!enabled) {
        return (
            <CheckoutContent>
                <HomepageInfoMessage
                    message={t`Credit card payments are not enabled for this event.`}
                    link={eventHomepagePath(event as Event)}
                    linkText={t`Return to event page`}
                />
            </CheckoutContent>
        );
    }

    return (
        <CheckoutContent>
            <Card padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="xs">
                    <Text fw={500} size="lg">{t`Pay with Credit Card`}</Text>
                    {currentOrder && (
                        <Text size="sm" c="dimmed">
                            {formatCurrency(currentOrder.total_gross, currentOrder.currency)}
                        </Text>
                    )}
                </Group>

                {paymentStatus && paymentStatus !== 'CONFIRMED' && paymentStatus !== 'RECEIVED' && (
                    <Alert color="yellow" mb="md">
                        {paymentStatus === 'PENDING' && t`Payment is being processed. Please wait...`}
                        {paymentStatus === 'AWAITING_RISK_ANALYSIS' && t`Payment is under risk analysis. Please wait...`}
                        {paymentStatus === 'AUTHORIZED' && t`Payment authorized. Waiting for confirmation...`}
                    </Alert>
                )}

                <Stack gap="md">
                    <TextInput
                        label={t`CPF or CNPJ`}
                        placeholder={t`000.000.000-00 or 00.000.000/0000-00`}
                        value={cpfCnpj}
                        onChange={(e) => {
                            const formatted = formatCpfCnpj(e.target.value);
                            setCpfCnpj(formatted);
                            if (errors.cpfCnpj) delete errors.cpfCnpj;
                        }}
                        error={errors.cpfCnpj}
                        required
                        maxLength={18}
                    />

                    <TextInput
                        label={t`Cardholder Name`}
                        placeholder={t`Name as it appears on card`}
                        value={holderName}
                        onChange={(e) => {
                            setHolderName(e.target.value);
                            if (errors.holderName) delete errors.holderName;
                        }}
                        error={errors.holderName}
                        required
                    />

                    <TextInput
                        label={t`Card Number`}
                        placeholder={t`0000 0000 0000 0000`}
                        value={cardNumber}
                        onChange={(e) => {
                            const formatted = formatCardNumber(e.target.value);
                            setCardNumber(formatted);
                            if (errors.cardNumber) delete errors.cardNumber;
                        }}
                        error={errors.cardNumber}
                        required
                        maxLength={19}
                    />

                    <Group grow>
                        <TextInput
                            label={t`Expiry Month`}
                            placeholder={t`MM`}
                            value={expiryMonth}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                                setExpiryMonth(value);
                                if (errors.expiryMonth) delete errors.expiryMonth;
                            }}
                            error={errors.expiryMonth}
                            required
                            maxLength={2}
                        />
                        <TextInput
                            label={t`Expiry Year`}
                            placeholder={t`YYYY`}
                            value={expiryYear}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                setExpiryYear(value);
                                if (errors.expiryYear) delete errors.expiryYear;
                            }}
                            error={errors.expiryYear}
                            required
                            maxLength={4}
                        />
                        <TextInput
                            label={t`CVV`}
                            placeholder={t`123`}
                            value={ccv}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                setCcv(value);
                                if (errors.ccv) delete errors.ccv;
                            }}
                            error={errors.ccv}
                            required
                            maxLength={4}
                        />
                    </Group>

                    <TextInput
                        label={t`Postal Code (CEP)`}
                        placeholder={t`00000-000`}
                        value={postalCode}
                        onChange={(e) => {
                            const formatted = formatPostalCode(e.target.value);
                            setPostalCode(formatted);
                            if (errors.postalCode) delete errors.postalCode;
                        }}
                        error={errors.postalCode}
                        required
                        maxLength={9}
                    />

                    <Group grow>
                        <TextInput
                            label={t`Address Number`}
                            placeholder={t`123`}
                            value={addressNumber}
                            onChange={(e) => {
                                setAddressNumber(e.target.value);
                                if (errors.addressNumber) delete errors.addressNumber;
                            }}
                            error={errors.addressNumber}
                            required
                        />
                        <TextInput
                            label={t`Address Complement`}
                            placeholder={t`Apt, Suite, etc.`}
                            value={addressComplement}
                            onChange={(e) => setAddressComplement(e.target.value)}
                        />
                    </Group>

                    <TextInput
                        label={t`Phone`}
                        placeholder={t`(00) 0000-0000`}
                        value={phone}
                        onChange={(e) => {
                            const formatted = formatPhone(e.target.value);
                            setPhone(formatted);
                            if (errors.phone) delete errors.phone;
                        }}
                        error={errors.phone}
                        required
                    />

                    <TextInput
                        label={t`Mobile Phone (Optional)`}
                        placeholder={t`(00) 00000-0000`}
                        value={mobilePhone}
                        onChange={(e) => {
                            const formatted = formatPhone(e.target.value);
                            setMobilePhone(formatted);
                        }}
                    />

                    <Button
                        onClick={handleSubmit}
                        loading={isProcessing}
                        fullWidth
                        mt="md"
                        disabled={isProcessing}
                    >
                        {isProcessing ? t`Processing...` : t`Pay Now`}
                    </Button>
                </Stack>
            </Card>
        </CheckoutContent>
    );
};
