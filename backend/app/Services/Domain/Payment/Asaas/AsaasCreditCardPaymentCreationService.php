<?php

namespace HiEvents\Services\Domain\Payment\Asaas;

use Carbon\Carbon;
use HiEvents\Exceptions\Asaas\CreateCreditCardPaymentFailedException;
use HiEvents\Services\Application\Handlers\Order\Payment\Asaas\DTO\CreateCreditCardPaymentRequestDTO;
use HiEvents\Services\Application\Handlers\Order\Payment\Asaas\DTO\CreateCreditCardPaymentResponseDTO;
use HiEvents\Services\Infrastructure\Asaas\AsaasApiClient;
use HiEvents\Services\Infrastructure\Asaas\AsaasClientFactory;
use Illuminate\Database\DatabaseManager;
use Illuminate\Http\Client\RequestException;
use Psr\Log\LoggerInterface;

class AsaasCreditCardPaymentCreationService
{
    public function __construct(
        private readonly AsaasClientFactory $asaasClientFactory,
        private readonly LoggerInterface     $logger,
        private readonly DatabaseManager      $databaseManager,
        private readonly InstallmentCalculationService $installmentCalculationService,
    )
    {
    }

    /**
     * @throws CreateCreditCardPaymentFailedException
     */
    public function createCreditCardPayment(CreateCreditCardPaymentRequestDTO $requestDTO): CreateCreditCardPaymentResponseDTO
    {
        $this->logger->info('AsaasCreditCardPaymentCreationService: Starting credit card payment creation', [
            'order_id' => $requestDTO->order->getId(),
            'order_short_id' => $requestDTO->order->getShortId(),
            'amount' => $requestDTO->amount->toFloat(),
            'currency' => $requestDTO->currencyCode,
        ]);

        try {
            $this->logger->debug('AsaasCreditCardPaymentCreationService: Creating Asaas client');
            $asaasClient = $this->asaasClientFactory->create();
            $this->logger->debug('AsaasCreditCardPaymentCreationService: Asaas client created successfully');
        } catch (\RuntimeException $e) {
            $this->logger->error('AsaasCreditCardPaymentCreationService: Failed to create Asaas client', [
                'error' => $e->getMessage(),
                'order_id' => $requestDTO->order->getId(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw new CreateCreditCardPaymentFailedException(
                __('Asaas API key not configured. Please contact support.')
            );
        }

        try {
            $this->logger->debug('AsaasCreditCardPaymentCreationService: Starting database transaction');
            $this->databaseManager->beginTransaction();

            // Busca ou cria cliente no Asaas
            $this->logger->info('AsaasCreditCardPaymentCreationService: Finding or creating customer', [
                'order_id' => $requestDTO->order->getId(),
                'customer_email' => $requestDTO->order->getEmail(),
            ]);

            $customer = $this->findOrCreateCustomer($requestDTO, $asaasClient);

            $this->logger->info('AsaasCreditCardPaymentCreationService: Customer ready', [
                'customer_id' => $customer['id'] ?? null,
                'customer_name' => $customer['name'] ?? null,
            ]);

            // Calcula valores de parcelamento se necessário
            $originalValue = $requestDTO->amount->toFloat();
            $installmentCount = $requestDTO->installmentCount ?? 1;
            
            $this->logger->info('AsaasCreditCardPaymentCreationService: Calculating installment values', [
                'original_value' => $originalValue,
                'installment_count' => $installmentCount,
            ]);

            // Primeiro cria a cobrança
            $paymentData = [
                'customer' => $customer['id'],
                'billingType' => 'CREDIT_CARD',
                'dueDate' => Carbon::now()->addDays(1)->format('Y-m-d'),
                'description' => sprintf('Pedido #%s - %s', $requestDTO->order->getShortId(), $requestDTO->order->getEventId()),
                'externalReference' => $requestDTO->order->getShortId(),
                'notificationDisabled' => false,
            ];

            // Se for parcelamento (2x ou mais), usa os campos de parcelamento
            if ($installmentCount > 1) {
                $installmentCalculation = $this->installmentCalculationService->calculate(
                    $originalValue,
                    $installmentCount
                );
                
                $paymentData['installmentCount'] = $installmentCount;
                // Usa totalValue conforme documentação do Asaas - a diferença será compensada na última parcela
                $paymentData['totalValue'] = $installmentCalculation->totalValue;
                
                $this->logger->info('AsaasCreditCardPaymentCreationService: Using installment payment', [
                    'installment_count' => $installmentCount,
                    'total_value' => $installmentCalculation->totalValue,
                    'installment_value' => $installmentCalculation->installmentValue,
                    'surcharge_percentage' => $installmentCalculation->surchargePercentage,
                ]);
            } else {
                // Para 1x, usa apenas o campo value
                $paymentData['value'] = $originalValue;
                
                $this->logger->info('AsaasCreditCardPaymentCreationService: Using single payment', [
                    'value' => $originalValue,
                ]);
            }

            $this->logger->info('AsaasCreditCardPaymentCreationService: Creating credit card payment in Asaas', [
                'payment_data' => $paymentData,
            ]);

            $payment = $asaasClient->createPayment($paymentData);

            $this->logger->info('AsaasCreditCardPaymentCreationService: Payment created, processing with credit card', [
                'payment_id' => $payment['id'] ?? null,
                'status' => $payment['status'] ?? null,
                'order_id' => $requestDTO->order->getId(),
            ]);

            // Agora paga a cobrança com o cartão
            $creditCardHolderInfo = [
                'name' => $requestDTO->order->getFullName(),
                'email' => $requestDTO->order->getEmail(),
                'cpfCnpj' => $requestDTO->cpfCnpj,
                'postalCode' => $requestDTO->postalCode,
                'addressNumber' => $requestDTO->addressNumber,
                'phone' => $requestDTO->phone,
            ];
            
            // Adiciona campos opcionais apenas se não forem null
            if ($requestDTO->addressComplement !== null) {
                $creditCardHolderInfo['addressComplement'] = $requestDTO->addressComplement;
            }
            
            if ($requestDTO->mobilePhone !== null) {
                $creditCardHolderInfo['mobilePhone'] = $requestDTO->mobilePhone;
            }
            
            $creditCardData = [
                'creditCard' => [
                    'holderName' => $requestDTO->holderName,
                    'number' => $requestDTO->cardNumber,
                    'expiryMonth' => $requestDTO->expiryMonth,
                    'expiryYear' => $requestDTO->expiryYear,
                    'ccv' => $requestDTO->ccv,
                ],
                'creditCardHolderInfo' => $creditCardHolderInfo,
            ];

            $this->logger->info('AsaasCreditCardPaymentCreationService: Paying with credit card', [
                'payment_id' => $payment['id'] ?? null,
            ]);

            $paidPayment = $asaasClient->payWithCreditCard($payment['id'], $creditCardData);

            $this->logger->info('AsaasCreditCardPaymentCreationService: Credit card payment processed', [
                'payment_id' => $paidPayment['id'] ?? null,
                'status' => $paidPayment['status'] ?? null,
                'order_id' => $requestDTO->order->getId(),
            ]);

            $this->logger->debug('AsaasCreditCardPaymentCreationService: Committing database transaction');
            $this->databaseManager->commit();
            $this->logger->info('AsaasCreditCardPaymentCreationService: Database transaction committed');

            return new CreateCreditCardPaymentResponseDTO(
                paymentId: $paidPayment['id'],
                status: $paidPayment['status'] ?? 'PENDING',
                creditCardNumber: $paidPayment['creditCard']['creditCardNumber'] ?? null,
                creditCardBrand: $paidPayment['creditCard']['creditCardBrand'] ?? null,
            );
        } catch (RequestException $exception) {
            $this->databaseManager->rollBack();

            $errorMessage = $exception->getMessage();
            $responseBody = $exception->response?->body();
            $responseJson = $exception->response?->json();
            $statusCode = $exception->response?->status();
            
            $this->logger->error('Failed to create Asaas credit card payment', [
                'exception' => $errorMessage,
                'status_code' => $statusCode,
                'order_id' => $requestDTO->order->getId(),
                'response_body' => $responseBody,
                'response_json' => $responseJson,
            ]);

            // Tenta extrair mensagem de erro mais específica do Asaas
            $userMessage = __('There was an error communicating with the payment provider. Please try again later.');
            
            if (isset($responseJson['errors']) && is_array($responseJson['errors'])) {
                $firstError = reset($responseJson['errors']);
                if (isset($firstError['description'])) {
                    $userMessage = $firstError['description'];
                }
            } elseif (isset($responseJson['message'])) {
                $userMessage = $responseJson['message'];
            }

            throw new CreateCreditCardPaymentFailedException($userMessage);
        } catch (\Throwable $exception) {
            $this->databaseManager->rollBack();

            $this->logger->error('Unexpected error creating Asaas credit card payment', [
                'exception' => $exception->getMessage(),
                'exception_class' => get_class($exception),
                'trace' => $exception->getTraceAsString(),
                'order_id' => $requestDTO->order->getId(),
            ]);

            throw new CreateCreditCardPaymentFailedException(
                __('There was an error processing your payment. Please try again later.')
            );
        }
    }

    /**
     * Busca ou cria um cliente no Asaas
     */
    private function findOrCreateCustomer(CreateCreditCardPaymentRequestDTO $requestDTO, AsaasApiClient $asaasClient): array
    {
        $email = $requestDTO->order->getEmail();
        $this->logger->debug('AsaasCreditCardPaymentCreationService: Searching for existing customer', [
            'email' => $email,
        ]);

        $customer = $asaasClient->findCustomerByEmail($email);

        if ($customer) {
            // Se o cliente já existe mas não tem CPF/CNPJ, atualiza
            $existingCpfCnpj = $customer['cpfCnpj'] ?? null;
            if (!$existingCpfCnpj) {
                $this->logger->info('AsaasCreditCardPaymentCreationService: Updating existing customer CPF/CNPJ', [
                    'customer_id' => $customer['id'] ?? null,
                    'new_cpf_cnpj' => $this->maskCpfCnpj($requestDTO->cpfCnpj),
                ]);
                
                try {
                    // Atualiza o CPF/CNPJ do cliente existente
                    $updatedCustomer = $asaasClient->updateCustomer($customer['id'], [
                        'cpfCnpj' => $requestDTO->cpfCnpj,
                    ]);
                    
                    return $updatedCustomer;
                } catch (\Throwable $e) {
                    $this->logger->warning('AsaasCreditCardPaymentCreationService: Failed to update customer CPF/CNPJ, will use existing customer', [
                        'customer_id' => $customer['id'] ?? null,
                        'error' => $e->getMessage(),
                    ]);
                    // Continua usando o cliente existente mesmo sem CPF/CNPJ
                }
            }
            
            $this->logger->info('AsaasCreditCardPaymentCreationService: Using existing customer', [
                'customer_id' => $customer['id'] ?? null,
                'email' => $email,
                'has_cpf_cnpj' => !empty($existingCpfCnpj),
            ]);
            return $customer;
        }

        // Cria novo cliente (notificações desativadas por padrão)
        $customerData = [
            'name' => $requestDTO->order->getFullName(),
            'email' => $email,
            'cpfCnpj' => $requestDTO->cpfCnpj,
            'notificationDisabled' => true,
        ];

        $this->logger->info('AsaasCreditCardPaymentCreationService: Creating new customer', [
            'customer_data' => [
                'name' => $customerData['name'],
                'email' => $customerData['email'],
                'cpf_cnpj' => $this->maskCpfCnpj($customerData['cpfCnpj']),
            ],
        ]);

        $newCustomer = $asaasClient->createCustomer($customerData);

        $this->logger->info('AsaasCreditCardPaymentCreationService: New customer created', [
            'customer_id' => $newCustomer['id'] ?? null,
            'email' => $email,
        ]);

        return $newCustomer;
    }

    /**
     * Mascara CPF/CNPJ para logs (oculta parte dos dígitos)
     */
    private function maskCpfCnpj(string $cpfCnpj): string
    {
        $length = strlen($cpfCnpj);
        if ($length === 11) {
            // CPF: 000.000.000-00
            return substr($cpfCnpj, 0, 3) . '.***.***-' . substr($cpfCnpj, -2);
        } elseif ($length === 14) {
            // CNPJ: 00.000.000/0000-00
            return substr($cpfCnpj, 0, 2) . '.***.***/****-' . substr($cpfCnpj, -2);
        }
        return substr($cpfCnpj, 0, 3) . '***';
    }
}
