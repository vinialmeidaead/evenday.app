<?php

namespace HiEvents\Services\Domain\Payment\Asaas;

use Carbon\Carbon;
use HiEvents\Exceptions\Asaas\CreatePixPaymentFailedException;
use HiEvents\Services\Application\Handlers\Order\Payment\Asaas\DTO\CreatePixPaymentRequestDTO;
use HiEvents\Services\Application\Handlers\Order\Payment\Asaas\DTO\CreatePixPaymentResponseDTO;
use HiEvents\Services\Infrastructure\Asaas\AsaasApiClient;
use HiEvents\Services\Infrastructure\Asaas\AsaasClientFactory;
use Illuminate\Database\DatabaseManager;
use Illuminate\Http\Client\RequestException;
use Psr\Log\LoggerInterface;

class AsaasPixPaymentCreationService
{
    public function __construct(
        private readonly AsaasClientFactory $asaasClientFactory,
        private readonly LoggerInterface     $logger,
        private readonly DatabaseManager      $databaseManager,
    )
    {
    }

    /**
     * @throws CreatePixPaymentFailedException
     */
    public function createPixPayment(CreatePixPaymentRequestDTO $requestDTO): CreatePixPaymentResponseDTO
    {
        $this->logger->info('AsaasPixPaymentCreationService: Starting Pix payment creation', [
            'order_id' => $requestDTO->order->getId(),
            'order_short_id' => $requestDTO->order->getShortId(),
            'amount' => $requestDTO->amount->toFloat(),
            'currency' => $requestDTO->currencyCode,
        ]);

        try {
            $this->logger->debug('AsaasPixPaymentCreationService: Creating Asaas client');
            $asaasClient = $this->asaasClientFactory->create();
            $this->logger->debug('AsaasPixPaymentCreationService: Asaas client created successfully');
        } catch (\RuntimeException $e) {
            $this->logger->error('AsaasPixPaymentCreationService: Failed to create Asaas client', [
                'error' => $e->getMessage(),
                'order_id' => $requestDTO->order->getId(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw new CreatePixPaymentFailedException(
                __('Asaas API key not configured. Please contact support.')
            );
        }

        try {
            $this->logger->debug('AsaasPixPaymentCreationService: Starting database transaction');
            $this->databaseManager->beginTransaction();

            // Busca ou cria cliente no Asaas
            $this->logger->info('AsaasPixPaymentCreationService: Finding or creating customer', [
                'order_id' => $requestDTO->order->getId(),
                'customer_email' => $requestDTO->order->getEmail(),
            ]);

            $customer = $this->findOrCreateCustomer($requestDTO, $asaasClient);

            $this->logger->info('AsaasPixPaymentCreationService: Customer ready', [
                'customer_id' => $customer['id'] ?? null,
                'customer_name' => $customer['name'] ?? null,
            ]);

            // Cria cobrança Pix
            $paymentData = [
                'customer' => $customer['id'],
                'billingType' => 'PIX',
                'value' => $requestDTO->amount->toFloat(),
                'dueDate' => Carbon::now()->addDays(1)->format('Y-m-d'),
                'description' => sprintf('Pedido #%s - %s', $requestDTO->order->getShortId(), $requestDTO->order->getEventId()),
                'externalReference' => $requestDTO->order->getShortId(),
                'notificationDisabled' => false,
            ];

            $this->logger->info('AsaasPixPaymentCreationService: Creating Pix payment in Asaas', [
                'payment_data' => $paymentData,
            ]);

            $payment = $asaasClient->createPayment($paymentData);

            $this->logger->info('AsaasPixPaymentCreationService: Pix payment created in Asaas', [
                'payment_id' => $payment['id'] ?? null,
                'status' => $payment['status'] ?? null,
                'order_id' => $requestDTO->order->getId(),
            ]);

            // Busca o QR Code Pix usando o endpoint específico
            $pixQrCode = null;
            $pixCode = $payment['pixCopiaECola'] ?? $payment['pixTransaction']['payload'] ?? '';
            $expirationDate = $payment['pixTransaction']['expirationDate'] ?? Carbon::now()->addDays(1)->toIso8601String();

            try {
                $this->logger->info('AsaasPixPaymentCreationService: Fetching Pix QR Code', [
                    'payment_id' => $payment['id'] ?? null,
                ]);

                $pixQrCode = $asaasClient->getPixQrCode($payment['id']);
                
                // Atualiza os dados com a resposta do QR Code
                if (!empty($pixQrCode['payload'])) {
                    $pixCode = $pixQrCode['payload'];
                }
                
                if (!empty($pixQrCode['expirationDate'])) {
                    $expirationDate = $pixQrCode['expirationDate'];
                }

                $this->logger->info('AsaasPixPaymentCreationService: Pix QR Code fetched successfully', [
                    'payment_id' => $payment['id'] ?? null,
                    'has_encoded_image' => !empty($pixQrCode['encodedImage'] ?? null),
                    'has_payload' => !empty($pixQrCode['payload'] ?? null),
                ]);
            } catch (\Throwable $e) {
                $this->logger->warning('AsaasPixPaymentCreationService: Failed to fetch Pix QR Code, will use data from payment creation', [
                    'payment_id' => $payment['id'] ?? null,
                    'error' => $e->getMessage(),
                ]);
                // Continua mesmo se falhar ao buscar o QR Code
            }

            // Formata a imagem base64 se existir
            $qrCodeImage = null;
            if (!empty($pixQrCode['encodedImage'] ?? null)) {
                $encodedImage = trim($pixQrCode['encodedImage']);
                // Remove o prefixo "=" se existir (alguns formatos do Asaas incluem isso)
                if (str_starts_with($encodedImage, '=')) {
                    $encodedImage = substr($encodedImage, 1);
                }
                // Adiciona o prefixo data URI se não tiver
                if (!str_starts_with($encodedImage, 'data:image')) {
                    $qrCodeImage = 'data:image/png;base64,' . $encodedImage;
                } else {
                    $qrCodeImage = $encodedImage;
                }
            } elseif (!empty($payment['pixTransaction']['encodedImage'] ?? null)) {
                $encodedImage = trim($payment['pixTransaction']['encodedImage']);
                // Remove o prefixo "=" se existir
                if (str_starts_with($encodedImage, '=')) {
                    $encodedImage = substr($encodedImage, 1);
                }
                // Adiciona o prefixo data URI se não tiver
                if (!str_starts_with($encodedImage, 'data:image')) {
                    $qrCodeImage = 'data:image/png;base64,' . $encodedImage;
                } else {
                    $qrCodeImage = $encodedImage;
                }
            }

            $this->logger->info('AsaasPixPaymentCreationService: Preparing response DTO', [
                'payment_id' => $payment['id'] ?? null,
                'has_pix_code' => !empty($pixCode),
                'has_qr_code' => !empty($qrCodeImage),
            ]);

            $this->logger->debug('AsaasPixPaymentCreationService: Committing database transaction');
            $this->databaseManager->commit();
            $this->logger->info('AsaasPixPaymentCreationService: Database transaction committed');

            return new CreatePixPaymentResponseDTO(
                paymentId: $payment['id'],
                pixCode: $pixCode,
                qrCodeImage: $qrCodeImage,
                expirationDate: $expirationDate,
                status: $payment['status'] ?? 'PENDING',
            );
        } catch (RequestException $exception) {
            $this->databaseManager->rollBack();

            $errorMessage = $exception->getMessage();
            $responseBody = $exception->response?->body();
            $responseJson = $exception->response?->json();
            $statusCode = $exception->response?->status();
            
            $this->logger->error('Failed to create Asaas Pix payment', [
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

            throw new CreatePixPaymentFailedException($userMessage);
        } catch (\Throwable $exception) {
            $this->databaseManager->rollBack();

            $this->logger->error('Unexpected error creating Asaas Pix payment', [
                'exception' => $exception->getMessage(),
                'exception_class' => get_class($exception),
                'trace' => $exception->getTraceAsString(),
                'order_id' => $requestDTO->order->getId(),
            ]);

            throw new CreatePixPaymentFailedException(
                __('There was an error processing your payment. Please try again later.')
            );
        }
    }

    /**
     * Busca ou cria um cliente no Asaas
     */
    private function findOrCreateCustomer(CreatePixPaymentRequestDTO $requestDTO, AsaasApiClient $asaasClient): array
    {
        $email = $requestDTO->order->getEmail();
        $this->logger->debug('AsaasPixPaymentCreationService: Searching for existing customer', [
            'email' => $email,
        ]);

        $customer = $asaasClient->findCustomerByEmail($email);

        if ($customer) {
            // Se o cliente já existe mas não tem CPF/CNPJ, atualiza
            $existingCpfCnpj = $customer['cpfCnpj'] ?? null;
            if (!$existingCpfCnpj) {
                $this->logger->info('AsaasPixPaymentCreationService: Updating existing customer CPF/CNPJ', [
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
                    $this->logger->warning('AsaasPixPaymentCreationService: Failed to update customer CPF/CNPJ, will use existing customer', [
                        'customer_id' => $customer['id'] ?? null,
                        'error' => $e->getMessage(),
                    ]);
                    // Continua usando o cliente existente mesmo sem CPF/CNPJ
                    // O Asaas pode rejeitar na criação da cobrança, mas tentamos
                }
            }
            
            $this->logger->info('AsaasPixPaymentCreationService: Using existing customer', [
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
            'cpfCnpj' => $requestDTO->cpfCnpj, // CPF/CNPJ fornecido pelo cliente no checkout
            'notificationDisabled' => true,
        ];

        $this->logger->info('AsaasPixPaymentCreationService: Creating new customer', [
            'customer_data' => [
                'name' => $customerData['name'],
                'email' => $customerData['email'],
                'cpf_cnpj' => $this->maskCpfCnpj($customerData['cpfCnpj']),
            ],
        ]);

        $newCustomer = $asaasClient->createCustomer($customerData);

        $this->logger->info('AsaasPixPaymentCreationService: New customer created', [
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

