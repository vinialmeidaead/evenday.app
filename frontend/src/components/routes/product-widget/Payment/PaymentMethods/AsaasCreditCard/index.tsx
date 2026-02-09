import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useGetEventPublic } from "../../../../../../queries/useGetEventPublic.ts";
import { CheckoutContent } from "../../../../../layouts/Checkout/CheckoutContent";
import { HomepageInfoMessage } from "../../../../../common/HomepageInfoMessage";
import { t } from "@lingui/macro";
import {
  eventHomepagePath,
  eventCheckoutPath,
} from "../../../../../../utilites/urlHelper.ts";
import { LoadingMask } from "../../../../../common/LoadingMask";
import { Event } from "../../../../../../types.ts";
import {
  Card,
  Group,
  Text,
  Button,
  TextInput,
  Alert,
  Stack,
  Select,
  Divider,
  LoadingOverlay,
} from "@mantine/core";
import { formatCurrency } from "../../../../../../utilites/currency.ts";
import { useGetOrderPublic } from "../../../../../../queries/useGetOrderPublic.ts";
import { usePollGetOrderPublic } from "../../../../../../queries/usePollGetOrderPublic.ts";
import { orderClientPublic } from "../../../../../../api/order.client.ts";
import { showError } from "../../../../../../utilites/notifications.tsx";

interface AsaasCreditCardPaymentMethodProps {
  enabled: boolean;
}

export const AsaasCreditCardPaymentMethod = ({
  enabled,
}: AsaasCreditCardPaymentMethodProps) => {
  const { eventId, orderShortId } = useParams();
  const navigate = useNavigate();
  const { data: event } = useGetEventPublic(eventId);
  const { data: order, isFetched: isOrderFetched } = useGetOrderPublic(
    eventId,
    orderShortId,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  // Form fields
  const [cpfCnpj, setCpfCnpj] = useState<string>("");
  const [holderName, setHolderName] = useState<string>("");
  const [cardNumber, setCardNumber] = useState<string>("");
  const [expiryMonth, setExpiryMonth] = useState<string>("");
  const [expiryYear, setExpiryYear] = useState<string>("");
  const [ccv, setCcv] = useState<string>("");
  const [postalCode, setPostalCode] = useState<string>("");
  const [addressNumber, setAddressNumber] = useState<string>("");
  const [addressComplement, setAddressComplement] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [installmentCount, setInstallmentCount] = useState<number>(1);
  const [installmentCalculation, setInstallmentCalculation] = useState<{
    total_value: number;
    installment_value: number;
    surcharge_percentage: number;
    surcharge_amount: number;
  } | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Usa polling quando o pagamento está sendo processado
  const shouldPoll = isProcessing || paymentStatus !== null;
  const { data: polledOrder } = usePollGetOrderPublic(
    eventId,
    orderShortId,
    shouldPoll,
    ["event"],
  );

  const currentOrder = polledOrder || order;

  // Tabela de acréscimos por número de parcelas
  const installmentSurcharges: Record<number, number> = {
    1: 0.0,
    2: 6.3,
    3: 7.7,
    4: 9.0,
    5: 10.3,
    6: 11.6,
    7: 12.9,
    8: 14.2,
    9: 15.5,
    10: 16.8,
    11: 18.1,
    12: 19.4,
  };

  // Calcula valores de parcelamento quando o número de parcelas ou valor do pedido mudar
  useEffect(() => {
    if (currentOrder?.total_gross && currentOrder?.currency) {
      const calculateInstallment = async () => {
        try {
          const result = await orderClientPublic.calculateInstallment(
            currentOrder.total_gross,
            installmentCount,
          );
          setInstallmentCalculation({
            total_value: result.total_value,
            installment_value: result.installment_value,
            surcharge_percentage: result.surcharge_percentage,
            surcharge_amount: result.surcharge_amount,
          });
        } catch (error) {
          console.error("Erro ao calcular parcelamento:", error);
          // Em caso de erro, calcula localmente
          const surchargePercentage =
            installmentSurcharges[installmentCount] || 0;
          const totalValue =
            currentOrder.total_gross * (1 + surchargePercentage / 100);
          const installmentValue =
            installmentCount === 1
              ? totalValue
              : Math.floor((totalValue * 100) / installmentCount) / 100;

          setInstallmentCalculation({
            total_value: totalValue,
            installment_value: installmentValue,
            surcharge_percentage: surchargePercentage,
            surcharge_amount: totalValue - currentOrder.total_gross,
          });
        }
      };
      calculateInstallment();
    }
  }, [currentOrder?.total_gross, currentOrder?.currency, installmentCount]);

  const formatCpfCnpj = (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return numbers
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  };

  const formatCardNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatPostalCode = (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) {
      return numbers;
    }
    return numbers.replace(/(\d{5})(\d)/, "$1-$2");
  };

  const formatPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const cpfCnpjNumbers = cpfCnpj.replace(/\D/g, "");
    if (cpfCnpjNumbers.length !== 11 && cpfCnpjNumbers.length !== 14) {
      newErrors.cpfCnpj = t`CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos.`;
    }

    if (!holderName.trim()) {
      newErrors.holderName = t`Nome do titular é obrigatório.`;
    }

    const cardNumberNumbers = cardNumber.replace(/\D/g, "");
    if (cardNumberNumbers.length < 13 || cardNumberNumbers.length > 19) {
      newErrors.cardNumber = t`Número do cartão inválido.`;
    }

    if (
      !expiryMonth ||
      parseInt(expiryMonth) < 1 ||
      parseInt(expiryMonth) > 12
    ) {
      newErrors.expiryMonth = t`Mês de expiração inválido.`;
    }

    const currentYear = new Date().getFullYear();
    if (
      !expiryYear ||
      expiryYear.length !== 4 ||
      parseInt(expiryYear) < currentYear
    ) {
      newErrors.expiryYear = t`Ano de expiração inválido.`;
    }

    if (ccv.length < 3 || ccv.length > 4) {
      newErrors.ccv = t`CVV deve ter 3 ou 4 dígitos.`;
    }

    const postalCodeNumbers = postalCode.replace(/\D/g, "");
    if (postalCodeNumbers.length !== 8) {
      newErrors.postalCode = t`CEP deve ter 8 dígitos.`;
    }

    if (!addressNumber.trim()) {
      newErrors.addressNumber = t`Número do endereço é obrigatório.`;
    }

    const phoneNumbers = phone.replace(/\D/g, "");
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      newErrors.phone = t`Formato de telefone inválido.`;
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
        cpf_cnpj: cpfCnpj.replace(/\D/g, ""),
        holder_name: holderName.trim(),
        card_number: cardNumber.replace(/\D/g, ""),
        expiry_month: expiryMonth,
        expiry_year: expiryYear,
        ccv: ccv,
        postal_code: postalCode.replace(/\D/g, ""),
        address_number: addressNumber.trim(),
        address_complement: addressComplement.trim() || undefined,
        phone: phone.replace(/\D/g, ""),
        installment_count: installmentCount,
      };

      const data = await orderClientPublic.createAsaasCreditCardPayment(
        Number(eventId),
        String(orderShortId),
        cardData,
      );

      setPaymentStatus(data.status);

      // Não para o loading aqui - deixa o polling verificar o status
      // O webhook vai atualizar o pedido e o polling vai detectar a mudança
    } catch (err: any) {
      setIsProcessing(false);
      const errorMessage =
        err.response?.data?.message ||
        t`Falha ao processar pagamento. Por favor, tente novamente.`;
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
    if (!currentOrder) {
      return;
    }

    // Se o pedido foi pago ou completado, para o loading e redireciona
    if (
      currentOrder.payment_status === "PAYMENT_RECEIVED" ||
      currentOrder.status === "COMPLETED"
    ) {
      setIsProcessing(false);
      setPaymentStatus(null);
      navigate(eventCheckoutPath(eventId, orderShortId, "summary"));
    }
  }, [
    currentOrder?.payment_status,
    currentOrder?.status,
    navigate,
    eventId,
    orderShortId,
  ]);

  if (!isOrderFetched || !currentOrder?.payment_status) {
    return (
      <CheckoutContent>
        <LoadingMask />
      </CheckoutContent>
    );
  }

  if (currentOrder?.payment_status === "PAYMENT_RECEIVED") {
    return (
      <CheckoutContent>
        <HomepageInfoMessage
          message={t`Este pedido já foi pago.`}
          linkText={t`Ver detalhes do pedido`}
          link={eventCheckoutPath(eventId, orderShortId, "summary")}
        />
      </CheckoutContent>
    );
  }

  if (
    currentOrder?.payment_status !== "AWAITING_PAYMENT" &&
    currentOrder?.payment_status !== "PAYMENT_FAILED"
  ) {
    return (
      <CheckoutContent>
        <HomepageInfoMessage
          message={t`Esta página de pedido não está mais disponível.`}
          linkText={t`Ver detalhes do pedido`}
          link={eventHomepagePath(event as Event)}
        />
      </CheckoutContent>
    );
  }

  if (!enabled) {
    return (
      <CheckoutContent>
        <HomepageInfoMessage
          message={t`Pagamentos com cartão de crédito não estão habilitados para este evento.`}
          link={eventHomepagePath(event as Event)}
          linkText={t`Voltar para a página do evento`}
        />
      </CheckoutContent>
    );
  }

  return (
    <CheckoutContent>
      <Card padding="lg" radius="md" withBorder style={{ position: 'relative' }}>
        <LoadingOverlay
          visible={isProcessing}
          loaderProps={{ size: 'lg', type: 'dots' }}
          overlayProps={{ radius: 'md', blur: 2 }}
          zIndex={1000}
        />
        <Group justify="space-between" mb="xs">
          <Text fw={500} size="lg">{t`Pagar com Cartão de Crédito`}</Text>
          {currentOrder && (
            <Text size="sm" c="dimmed">
              {formatCurrency(currentOrder.total_gross, currentOrder.currency)}
            </Text>
          )}
        </Group>

        <Select
          label={t`Número de Parcelas`}
          placeholder={t`Selecione o número de parcelas`}
          value={installmentCount.toString()}
          onChange={(value) => setInstallmentCount(parseInt(value || "1"))}
          data={Array.from({ length: 12 }, (_, i) => {
            const count = i + 1;
            const surcharge = installmentSurcharges[count] || 0;
            return {
              value: count.toString(),
              label:
                count === 1
                  ? t`${count}x sem acréscimo`
                  : t`${count}x com ${surcharge.toFixed(2)}% de acréscimo`,
            };
          })}
          mb="md"
        />

        {installmentCalculation &&
          installmentCount > 1 &&
          installmentCalculation.surcharge_percentage > 0 && (
            <Alert color="blue" mb="md">
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" fw={500}>{t`Valor original:`}</Text>
                  <Text size="sm">
                    {formatCurrency(
                      currentOrder?.total_gross || 0,
                      currentOrder?.currency || "BRL",
                    )}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text
                    size="sm"
                    fw={500}
                  >{t`Acréscimo (${installmentCalculation.surcharge_percentage.toFixed(2)}%):`}</Text>
                  <Text size="sm" c="red">
                    +
                    {formatCurrency(
                      installmentCalculation.surcharge_amount,
                      currentOrder?.currency || "BRL",
                    )}
                  </Text>
                </Group>
                <Divider />
                <Group justify="space-between">
                  <Text size="sm" fw={700}>{t`Valor total:`}</Text>
                  <Text size="sm" fw={700}>
                    {formatCurrency(
                      installmentCalculation.total_value,
                      currentOrder?.currency || "BRL",
                    )}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">{t`Valor por parcela:`}</Text>
                  <Text size="sm" fw={500}>
                    {formatCurrency(
                      installmentCalculation.installment_value,
                      currentOrder?.currency || "BRL",
                    )}
                  </Text>
                </Group>
              </Stack>
            </Alert>
          )}

        {isProcessing && (
          <Alert color="blue" mb="md">
            <Stack gap="xs">
              <Text size="sm" fw={500}>{t`Processando pagamento...`}</Text>
              <Text size="xs" c="dimmed">{t`Por favor, aguarde enquanto processamos seu pagamento. Não feche esta página.`}</Text>
            </Stack>
          </Alert>
        )}

        {paymentStatus &&
          paymentStatus !== "CONFIRMED" &&
          paymentStatus !== "RECEIVED" &&
          !isProcessing && (
            <Alert color="yellow" mb="md">
              {paymentStatus === "PENDING" &&
                t`Pagamento está sendo processado. Por favor, aguarde...`}
              {paymentStatus === "AWAITING_RISK_ANALYSIS" &&
                t`Pagamento está em análise de risco. Por favor, aguarde...`}
              {paymentStatus === "AUTHORIZED" &&
                t`Pagamento autorizado. Aguardando confirmação...`}
            </Alert>
          )}

        <Stack gap="md">
          <TextInput
            label={t`CPF ou CNPJ`}
            placeholder={t`000.000.000-00 ou 00.000.000/0000-00`}
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
            label={t`Nome do Titular`}
            placeholder={t`Nome como aparece no cartão`}
            value={holderName}
            onChange={(e) => {
              setHolderName(e.target.value);
              if (errors.holderName) delete errors.holderName;
            }}
            error={errors.holderName}
            required
          />

          <TextInput
            label={t`Número do Cartão`}
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
              label={t`Mês de Expiração`}
              placeholder={t`MM`}
              value={expiryMonth}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 2);
                setExpiryMonth(value);
                if (errors.expiryMonth) delete errors.expiryMonth;
              }}
              error={errors.expiryMonth}
              required
              maxLength={2}
            />
            <TextInput
              label={t`Ano de Expiração`}
              placeholder={t`AAAA`}
              value={expiryYear}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 4);
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
                const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                setCcv(value);
                if (errors.ccv) delete errors.ccv;
              }}
              error={errors.ccv}
              required
              maxLength={4}
            />
          </Group>

          <TextInput
            label={t`CEP`}
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
              label={t`Nome da Rua`}
              placeholder={t`Ex: Rua das Flores`}
              value={addressComplement}
              onChange={(e) => setAddressComplement(e.target.value)}
            />
            <TextInput
              label={t`Número do Endereço`}
              placeholder={t`123`}
              value={addressNumber}
              onChange={(e) => {
                setAddressNumber(e.target.value);
                if (errors.addressNumber) delete errors.addressNumber;
              }}
              error={errors.addressNumber}
              required
            />
          </Group>

          <TextInput
            label={t`Telefone`}
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

          <Button
            onClick={handleSubmit}
            loading={isProcessing}
            fullWidth
            mt="md"
            disabled={isProcessing}
          >
            {isProcessing ? t`Processando...` : t`Pagar Agora`}
          </Button>
        </Stack>
      </Card>
    </CheckoutContent>
  );
};
