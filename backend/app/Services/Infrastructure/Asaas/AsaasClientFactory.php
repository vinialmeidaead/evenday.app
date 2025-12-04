<?php

namespace HiEvents\Services\Infrastructure\Asaas;

use Illuminate\Config\Repository;
use Psr\Log\LoggerInterface;

class AsaasClientFactory
{
    public function __construct(
        private readonly Repository $config,
        private readonly LoggerInterface $logger
    ) {
    }

    public function create(): AsaasApiClient
    {
        $this->logger->debug('AsaasClientFactory: Creating Asaas API client');

        $apiKey = $this->config->get('services.asaas.api_key');
        $apiUrl = $this->config->get('services.asaas.api_url');

        $this->logger->debug('AsaasClientFactory: Configuration loaded', [
            'api_url' => $apiUrl,
            'api_key_set' => !empty($apiKey),
            'api_key_length' => $apiKey ? strlen($apiKey) : 0,
            'api_key_prefix' => $apiKey ? substr($apiKey, 0, 4) : null,
        ]);

        if (empty($apiKey)) {
            $this->logger->error('AsaasClientFactory: API key not configured');
            throw new \RuntimeException('Asaas API key not configured');
        }

        $this->logger->info('AsaasClientFactory: Asaas API client created successfully', [
            'api_url' => $apiUrl,
        ]);

        return new AsaasApiClient(
            apiKey: $apiKey,
            apiUrl: $apiUrl,
            logger: $this->logger
        );
    }
}

