<?php

namespace HiEvents\Services\Infrastructure\Asaas;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Psr\Log\LoggerInterface;

class AsaasApiClient
{
    private PendingRequest $client;

    public function __construct(
        private readonly string $apiKey,
        private readonly string $apiUrl,
        private readonly LoggerInterface $logger
    ) {
        // Asaas usa access_token como header, não Authorization Bearer
        $this->client = Http::withHeaders([
            'access_token' => $this->apiKey,
            'Content-Type' => 'application/json',
        ])->baseUrl($this->apiUrl);
        
        $this->logger->debug('AsaasApiClient initialized', [
            'api_url' => $this->apiUrl,
            'api_key_set' => !empty($this->apiKey),
        ]);
    }

    /**
     * Cria um cliente no Asaas
     *
     * @param array $data Dados do cliente (name, email, cpfCnpj, etc.)
     * @return array Resposta da API
     * @throws RequestException
     */
    public function createCustomer(array $data): array
    {
        try {
            $this->logger->debug('Creating Asaas customer', [
                'url' => $this->apiUrl . '/customers',
                'data' => $data,
            ]);

            $response = $this->client->post('/customers', $data);
            
            $this->logger->debug('Asaas customer response', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            $response->throw();

            $this->logger->debug('Asaas customer created', [
                'response' => $response->json(),
            ]);

            return $response->json();
        } catch (RequestException $e) {
            $this->logger->error('Failed to create Asaas customer', [
                'error' => $e->getMessage(),
                'status' => $e->response?->status(),
                'data' => $data,
                'response_body' => $e->response?->body(),
                'response_json' => $e->response?->json(),
            ]);

            throw $e;
        }
    }

    /**
     * Atualiza um cliente no Asaas
     *
     * @param string $customerId ID do cliente no Asaas
     * @param array $data Dados a serem atualizados
     * @return array Resposta da API
     * @throws RequestException
     */
    public function updateCustomer(string $customerId, array $data): array
    {
        try {
            $this->logger->debug('AsaasApiClient: Updating customer', [
                'url' => $this->apiUrl . '/customers/' . $customerId,
                'customer_id' => $customerId,
                'data' => $data,
            ]);

            $response = $this->client->put("/customers/{$customerId}", $data);

            $this->logger->debug('AsaasApiClient: Customer update response', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            $response->throw();

            $this->logger->info('AsaasApiClient: Customer updated', [
                'customer_id' => $customerId,
            ]);

            return $response->json();
        } catch (RequestException $e) {
            $this->logger->error('AsaasApiClient: Failed to update customer', [
                'error' => $e->getMessage(),
                'status' => $e->response?->status(),
                'customer_id' => $customerId,
                'data' => $data,
                'response_body' => $e->response?->body(),
                'response_json' => $e->response?->json(),
            ]);

            throw $e;
        }
    }

    /**
     * Busca um cliente no Asaas por email
     *
     * @param string $email Email do cliente
     * @return array|null Resposta da API ou null se não encontrado
     */
    public function findCustomerByEmail(string $email): ?array
    {
        try {
            $this->logger->debug('AsaasApiClient: Searching customer by email', [
                'url' => $this->apiUrl . '/customers',
                'email' => $email,
            ]);

            $response = $this->client->get('/customers', [
                'email' => $email,
            ]);

            $this->logger->debug('AsaasApiClient: Customer search response', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            $response->throw();

            $data = $response->json();
            $customers = $data['data'] ?? [];

            if (!empty($customers)) {
                $this->logger->info('AsaasApiClient: Customer found by email', [
                    'email' => $email,
                    'customer_id' => $customers[0]['id'] ?? null,
                ]);
                return $customers[0];
            }

            $this->logger->debug('AsaasApiClient: Customer not found by email', [
                'email' => $email,
            ]);

            return null;
        } catch (RequestException $e) {
            $this->logger->warning('AsaasApiClient: Error searching customer by email', [
                'email' => $email,
                'error' => $e->getMessage(),
                'status' => $e->response?->status(),
                'response_body' => $e->response?->body(),
            ]);

            return null;
        }
    }

    /**
     * Cria uma cobrança Pix no Asaas
     *
     * @param array $data Dados da cobrança
     * @return array Resposta da API
     * @throws RequestException
     */
    public function createPayment(array $data): array
    {
        try {
            $this->logger->debug('Creating Asaas payment', [
                'url' => $this->apiUrl . '/payments',
                'data' => $data,
            ]);

            $response = $this->client->post('/payments', $data);
            
            $this->logger->debug('Asaas payment response', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            $response->throw();

            $this->logger->debug('Asaas payment created', [
                'payment_id' => $response->json()['id'] ?? null,
            ]);

            return $response->json();
        } catch (RequestException $e) {
            $this->logger->error('Failed to create Asaas payment', [
                'error' => $e->getMessage(),
                'status' => $e->response?->status(),
                'data' => $data,
                'response_body' => $e->response?->body(),
                'response_json' => $e->response?->json(),
            ]);

            throw $e;
        }
    }

    /**
     * Busca um pagamento no Asaas por ID
     *
     * @param string $paymentId ID do pagamento
     * @return array Resposta da API
     * @throws RequestException
     */
    public function getPayment(string $paymentId): array
    {
        try {
            $response = $this->client->get("/payments/{$paymentId}");
            $response->throw();

            return $response->json();
        } catch (RequestException $e) {
            $this->logger->error('Failed to get Asaas payment', [
                'error' => $e->getMessage(),
                'payment_id' => $paymentId,
            ]);

            throw $e;
        }
    }

    /**
     * Obtém o QR Code Pix de um pagamento
     *
     * @param string $paymentId ID do pagamento
     * @return array Resposta da API com encodedImage, payload e expirationDate
     * @throws RequestException
     */
    public function getPixQrCode(string $paymentId): array
    {
        try {
            $this->logger->debug('AsaasApiClient: Getting Pix QR Code', [
                'url' => $this->apiUrl . '/payments/' . $paymentId . '/pixQrCode',
                'payment_id' => $paymentId,
            ]);

            $response = $this->client->get("/payments/{$paymentId}/pixQrCode");
            
            $this->logger->debug('AsaasApiClient: Pix QR Code response', [
                'status' => $response->status(),
                'has_encoded_image' => !empty($response->json()['encodedImage'] ?? null),
                'has_payload' => !empty($response->json()['payload'] ?? null),
            ]);

            $response->throw();

            return $response->json();
        } catch (RequestException $e) {
            $this->logger->error('AsaasApiClient: Failed to get Pix QR Code', [
                'error' => $e->getMessage(),
                'status' => $e->response?->status(),
                'payment_id' => $paymentId,
                'response_body' => $e->response?->body(),
            ]);

            throw $e;
        }
    }

    /**
     * Paga uma cobrança com cartão de crédito
     *
     * @param string $paymentId ID do pagamento
     * @param array $data Dados do cartão e titular
     * @return array Resposta da API
     * @throws RequestException
     */
    public function payWithCreditCard(string $paymentId, array $data): array
    {
        try {
            $this->logger->debug('AsaasApiClient: Paying with credit card', [
                'url' => $this->apiUrl . '/payments/' . $paymentId . '/payWithCreditCard',
                'payment_id' => $paymentId,
                'has_credit_card' => !empty($data['creditCard'] ?? null),
                'has_holder_info' => !empty($data['creditCardHolderInfo'] ?? null),
            ]);

            $response = $this->client->post("/payments/{$paymentId}/payWithCreditCard", $data);
            
            $this->logger->debug('AsaasApiClient: Credit card payment response', [
                'status' => $response->status(),
                'payment_id' => $response->json()['id'] ?? null,
                'payment_status' => $response->json()['status'] ?? null,
            ]);

            $response->throw();

            $this->logger->info('AsaasApiClient: Credit card payment processed', [
                'payment_id' => $response->json()['id'] ?? null,
                'status' => $response->json()['status'] ?? null,
            ]);

            return $response->json();
        } catch (RequestException $e) {
            $this->logger->error('AsaasApiClient: Failed to pay with credit card', [
                'error' => $e->getMessage(),
                'status' => $e->response?->status(),
                'payment_id' => $paymentId,
                'response_body' => $e->response?->body(),
                'response_json' => $e->response?->json(),
            ]);

            throw $e;
        }
    }
}

