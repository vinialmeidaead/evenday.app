import {useParams, useNavigate} from "react-router";
import {useEffect, useState} from "react";
import {useGetEventPublic} from "../../../../../../queries/useGetEventPublic.ts";
import {CheckoutContent} from "../../../../../layouts/Checkout/CheckoutContent";
import {HomepageInfoMessage} from "../../../../../common/HomepageInfoMessage";
import {t} from "@lingui/macro";
import {eventHomepagePath, eventCheckoutPath} from "../../../../../../utilites/urlHelper.ts";
import {LoadingMask} from "../../../../../common/LoadingMask";
import {Event} from "../../../../../../types.ts";
import {Card, Group, Text, Button, CopyButton, Image, Alert, TextInput} from "@mantine/core";
import {IconCopy, IconCheck, IconClock} from "@tabler/icons-react";
import {formatCurrency} from "../../../../../../utilites/currency.ts";
import {useGetOrderPublic} from "../../../../../../queries/useGetOrderPublic.ts";
import {usePollGetOrderPublic} from "../../../../../../queries/usePollGetOrderPublic.ts";
import {orderClientPublic} from "../../../../../../api/order.client.ts";
import {showError} from "../../../../../../utilites/notifications.tsx";

interface AsaasPixPaymentMethodProps {
    enabled: boolean;
}

export const AsaasPixPaymentMethod = ({enabled}: AsaasPixPaymentMethodProps) => {
    const {eventId, orderShortId} = useParams();
    const navigate = useNavigate();
    const {data: event} = useGetEventPublic(eventId);
    const {data: order, isFetched: isOrderFetched} = useGetOrderPublic(eventId, orderShortId);
    const [pixPaymentData, setPixPaymentData] = useState<{
        payment_id: string,
        pix_code: string,
        qr_code_image?: string,
        expiration_date: string,
        status: string,
    } | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [cpfCnpj, setCpfCnpj] = useState<string>('');
    const [cpfCnpjError, setCpfCnpjError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);
    
    // Calcula se o pagamento expirou
    const isExpired = pixPaymentData ? (
        timeRemaining === t`Expired` || 
        (pixPaymentData.expiration_date && new Date(pixPaymentData.expiration_date) < new Date())
    ) : false;
    
    // Usa polling quando o pagamento Pix foi criado para verificar se foi confirmado
    // Poll apenas se o pagamento foi criado e não expirou
    const shouldPoll = pixPaymentData !== null && !isExpired;
    const {data: polledOrder} = usePollGetOrderPublic(
        eventId, 
        orderShortId, 
        shouldPoll,
        ['event']
    );
    
    // Usa o pedido com polling se disponível, senão usa o pedido normal
    const currentOrder = polledOrder || order;

    const formatCpfCnpj = (value: string): string => {
        // Remove tudo que não é número
        const numbers = value.replace(/\D/g, '');
        
        // Formata CPF (11 dígitos)
        if (numbers.length <= 11) {
            return numbers.replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        
        // Formata CNPJ (14 dígitos)
        return numbers.replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    };

    const handleCpfCnpjChange = (value: string) => {
        const formatted = formatCpfCnpj(value);
        setCpfCnpj(formatted);
        setCpfCnpjError('');
    };

    const validateCpfCnpj = (value: string): boolean => {
        const numbers = value.replace(/\D/g, '');
        return numbers.length === 11 || numbers.length === 14;
    };

    const createPixPayment = async () => {
        const numbers = cpfCnpj.replace(/\D/g, '');
        
        if (!validateCpfCnpj(cpfCnpj)) {
            setCpfCnpjError(t`CPF must have 11 digits or CNPJ must have 14 digits.`);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await orderClientPublic.createAsaasPixPayment(
                Number(eventId),
                String(orderShortId),
                numbers
            );
            setPixPaymentData(data);
        } catch (err: any) {
            setError(err);
            showError(err.response?.data?.message || t`Failed to create Pix payment. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };

    // Verifica se o pagamento foi confirmado e redireciona
    useEffect(() => {
        if (!currentOrder || !pixPaymentData) {
            return;
        }

        // Se o pedido foi pago ou completado, redireciona para summary
        if (currentOrder.payment_status === 'PAYMENT_RECEIVED' || currentOrder.status === 'COMPLETED') {
            navigate(eventCheckoutPath(eventId, orderShortId, 'summary'));
        }
    }, [currentOrder?.payment_status, currentOrder?.status, pixPaymentData, navigate, eventId, orderShortId]);

    // Atualiza o timer de expiração
    useEffect(() => {
        if (!pixPaymentData?.expiration_date) {
            return;
        }

        const updateTimeRemaining = () => {
            const expiration = new Date(pixPaymentData.expiration_date);
            const now = new Date();
            const diff = expiration.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeRemaining(t`Expired`);
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (hours > 0) {
                setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
            } else if (minutes > 0) {
                setTimeRemaining(`${minutes}m ${seconds}s`);
            } else {
                setTimeRemaining(`${seconds}s`);
            }
        };

        updateTimeRemaining();
        const interval = setInterval(updateTimeRemaining, 1000);

        return () => clearInterval(interval);
    }, [pixPaymentData?.expiration_date]);

    if (!isOrderFetched || !currentOrder?.payment_status) {
        return (
            <CheckoutContent>
                <LoadingMask/>
            </CheckoutContent>
        );
    }

    // Se o pedido já foi pago, mostra mensagem e link para summary
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

    // Verifica se o pedido está em um estado válido para pagamento
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
                    message={t`Pix payments are not enabled for this event.`}
                    link={eventHomepagePath(event as Event)}
                    linkText={t`Return to event page`}
                />
            </CheckoutContent>
        );
    }

    if (error && event) {
        return (
            <CheckoutContent>
                <HomepageInfoMessage
                    /* @ts-ignore */
                    message={error.response?.data?.message || t`Sorry, something has gone wrong. Please restart the checkout process.`}
                    link={eventHomepagePath(event)}
                    linkText={t`Return to event page`}
                />
            </CheckoutContent>
        );
    }

    // Se ainda não criou o pagamento, mostra formulário para coletar CPF/CNPJ
    if (!pixPaymentData) {
        return (
            <CheckoutContent>
                <Card padding="lg" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                        <Text fw={500} size="lg">{t`Pagar com Pix`}</Text>
                        {currentOrder && (
                            <Text size="sm" c="dimmed">
                                {formatCurrency(currentOrder.total_gross, currentOrder.currency)}
                            </Text>
                        )}
                    </Group>

                    <Text size="sm" c="dimmed" mb="md">
                        {t`Para completar seu pagamento com Pix, por favor, forneça seu CPF ou CNPJ.`}
                    </Text>

                    <TextInput
                        label={t`CPF ou CNPJ`}
                        placeholder={t`000.000.000-00 ou 00.000.000/0000-00`}
                        value={cpfCnpj}
                        onChange={(e) => handleCpfCnpjChange(e.target.value)}
                        error={cpfCnpjError}
                        required
                        mb="md"
                        maxLength={18}
                    />

                    <Button
                        onClick={createPixPayment}
                        loading={isLoading}
                        fullWidth
                        disabled={!cpfCnpj || cpfCnpj.replace(/\D/g, '').length < 11}
                    >
                        {t`Gerar código Pix`}
                    </Button>
                </Card>
            </CheckoutContent>
        );
    }

    return (
        <CheckoutContent>
            <Card padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="xs">
                    <Text fw={500} size="lg">{t`Pagar com Pix`}</Text>
                    {currentOrder && (
                        <Text size="sm" c="dimmed">
                            {formatCurrency(currentOrder.total_gross, currentOrder.currency)}
                        </Text>
                    )}
                </Group>

                {isExpired ? (
                    <Alert color="orange" title={t`Payment Expired`} mb="md">
                        {t`O código Pix expirou. Por favor, gere um novo.`}
                        <Button
                            mt="md"
                            onClick={() => {
                                setPixPaymentData(null);
                                setCpfCnpj('');
                            }}
                            fullWidth
                        >
                            {t`Gerar novo código Pix`}
                        </Button>
                    </Alert>
                ) : (
                    <>
                        {timeRemaining && (
                            <Alert
                                icon={<IconClock size={16} />}
                                color="blue"
                                mb="md"
                            >
                                <Group gap="xs">
                                    <Text size="sm">{t`Expira em:`}</Text>
                                    <Text size="sm" fw={500}>{timeRemaining}</Text>
                                </Group>
                            </Alert>
                        )}

                        {pixPaymentData.qr_code_image && (
                            <div style={{textAlign: 'center', marginBottom: '20px'}}>
                                <Image
                                    src={pixPaymentData.qr_code_image}
                                    alt="QR Code Pix"
                                    style={{maxWidth: '300px', margin: '0 auto'}}
                                />
                                <Text size="sm" c="dimmed" mt="xs">
                                    {t`Escaneie o QR Code com o seu aplicativo de banco`}
                                </Text>
                            </div>
                        )}

                        <Card withBorder padding="md" mb="md">
                            <Text size="sm" fw={500} mb="xs">{t`Código Pix (Copiar e Colar)`}</Text>
                            <Group gap="xs">
                                <Text
                                    style={{
                                        flex: 1,
                                        wordBreak: 'break-all',
                                        fontFamily: 'monospace',
                                        fontSize: '12px',
                                    }}
                                >
                                    {pixPaymentData.pix_code}
                                </Text>
                                <CopyButton value={pixPaymentData.pix_code}>
                                    {({copied, copy}) => (
                                        <Button
                                            color={copied ? 'teal' : 'blue'}
                                            onClick={copy}
                                            leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                        >
                                            {copied ? t`Copiado` : t`Copiar`}
                                        </Button>
                                    )}
                                </CopyButton>
                            </Group>
                        </Card>

                        <Alert color="blue" title={t`Instructions`}>
                            <Text size="sm">
                                {t`1. Copie o código Pix acima ou escaneie o QR Code`}
                                <br />
                                {t`2. Abra seu aplicativo de banco`}
                                <br />
                                {t`3. Cole o código ou escaneie o QR Code`}
                                <br />
                                {t`4. Complete o pagamento`}
                                <br />
                                {t`5. Seu pedido será confirmado automaticamente`}
                            </Text>
                        </Alert>
                    </>
                )}
            </Card>
        </CheckoutContent>
    );
}

