<?php

namespace HiEvents\Services\Domain\Email;

use HiEvents\DomainObjects\EmailTemplateDomainObject;
use HiEvents\DomainObjects\Enums\EmailTemplateType;
use HiEvents\Repository\Interfaces\EmailTemplateRepositoryInterface;
use HiEvents\Services\Domain\Email\DTO\RenderedEmailTemplateDTO;
use HiEvents\Services\Infrastructure\Email\LiquidTemplateRenderer;
use Symfony\Component\Routing\Exception\ResourceNotFoundException;

class EmailTemplateService
{
    public function __construct(
        private readonly EmailTemplateRepositoryInterface $emailTemplateRepository,
        private readonly LiquidTemplateRenderer $liquidRenderer,
        private readonly EmailTokenContextBuilder $tokenBuilder
    ) {
    }

    public function getTemplateByType(
        EmailTemplateType $type,
        int $accountId,
        ?int $eventId = null,
        ?int $organizerId = null
    ): ?EmailTemplateDomainObject {
        return $this->emailTemplateRepository->findByTypeWithFallback(
            $type,
            $accountId,
            $eventId,
            $organizerId
        );
    }

    public function renderTemplate(EmailTemplateDomainObject $template, array $context): RenderedEmailTemplateDTO
    {
        $renderedSubject = $this->liquidRenderer->render($template->getSubject(), $context);
        $renderedBody = $this->liquidRenderer->render($template->getBody(), $context);

        $cta = null;

        // Handle CTA if present
        if ($template->getCta()) {
            $templateCta = $template->getCta();
            if (isset($templateCta['label'], $templateCta['url_token'])) {
                // Replace the URL token with actual value from context
                // Handle dot notation (e.g., 'order.url' -> $context['order']['url'])
                $ctaUrl = $this->getValueFromDotNotation($context, $templateCta['url_token']) ?? '#';
                $cta = [
                    'label' => $templateCta['label'],
                    'url' => $ctaUrl,
                ];
            }
        }

        return new RenderedEmailTemplateDTO(
            subject: $renderedSubject,
            body: $renderedBody,
            cta: $cta,
        );
    }

    /**
     * Get default template content
     */
    public function getDefaultTemplate(EmailTemplateType $type): array
    {
        $defaults = $this->getDefaultTemplates();
        $ctaDefaults = $this->getDefaultCTAs();

        $template = $defaults[$type->value] ?? throw new ResourceNotFoundException('No default template for type ' . $type->value);

        $template['cta'] = $ctaDefaults[$type->value] ?? null;

        return $template;
    }

    public function previewTemplate(string $subject, string $body, EmailTemplateType $type, ?array $cta = null): array
    {
        $context = $this->tokenBuilder->buildPreviewContext($type->value);

        $renderedBody = $this->liquidRenderer->render($body, $context);

        // Add CTA button if provided
        if ($cta && isset($cta['label'])) {
            $ctaUrl = $this->getValueFromDotNotation($context, $cta['url_token'] ?? '') ?? '#';
            $ctaHtml = sprintf(
                '<div style="text-align: center; margin: 30px 0;">
                    <a href="%s" style="display: inline-block; padding: 12px 30px; background-color: #213850; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">%s</a>
                </div>',
                htmlspecialchars($ctaUrl),
                htmlspecialchars($cta['label'])
            );
            $renderedBody .= $ctaHtml;
        }

        return [
            'subject' => $this->liquidRenderer->render($subject, $context),
            'body' => $renderedBody,
            'context' => $context, // Return context for debugging
        ];
    }

    public function validateTemplate(string $subject, string $body): array
    {
        $errors = [];

        $subjectError = $this->liquidRenderer->getValidationErrors($subject);
        if ($subjectError) {
            $errors['subject'] = $subjectError;
        }

        $bodyError = $this->liquidRenderer->getValidationErrors($body);
        if ($bodyError) {
            $errors['body'] = $bodyError;
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * Get value from array using dot notation
     * e.g., 'order.url' will get $array['order']['url']
     */
    private function getValueFromDotNotation(array $array, string $key)
    {
        $keys = explode('.', $key);
        $value = $array;

        foreach ($keys as $k) {
            if (!isset($value[$k])) {
                return null;
            }
            $value = $value[$k];
        }

        return $value;
    }

    private function getDefaultCTAs(): array
    {
        return [
            EmailTemplateType::ORDER_CONFIRMATION->value => [
                'label' => __('Ver Pedido e Ingressos'),
                'url_token' => 'order.url',
            ],
            EmailTemplateType::ATTENDEE_TICKET->value => [
                'label' => __('Ver Ingresso'),
                'url_token' => 'ticket.url',
            ],
        ];
    }

    private function getDefaultTemplates(): array
    {
        return [
            EmailTemplateType::ORDER_CONFIRMATION->value => [
                'subject' => 'Seu Pedido foi Confirmado! 🎉',
                'body' => <<<'LIQUID'
<strong>Seu Pedido foi Confirmado! 🎉</strong><br>

{% if order.is_awaiting_offline_payment %}
<strong>ℹ️ Pagamento Pendente:</strong> Seu pedido está aguardando pagamento. Os ingressos foram emitidos, mas não serão válidos até que o pagamento seja recebido.<br>
<strong>Instruções de Pagamento</strong><br>
Por favor, siga as instruções abaixo para concluir seu pagamento:<br>
{% if settings.offline_payment_instructions %}
{{ settings.offline_payment_instructions }}<br>
{% endif %}

{% else %}
Parabéns! Seu pedido para <strong>{{ event.title }}</strong> no dia <strong>{{ event.date }}</strong> às <strong>{{ event.time }}</strong> foi realizado com sucesso. Por favor, confira os detalhes do seu pedido abaixo.<br>
{% endif %}

<strong>Detalhes do Evento</strong><br>
<strong>Nome do Evento:</strong> {{ event.title }}<br>
<strong>Data e Horário:</strong> {{ event.date }} às {{ event.time }}<br>
{% if event.full_address %}<strong>Local:</strong> {{ event.full_address }}<br>{% endif %}
<br>

{% if settings.post_checkout_message %}
<strong>Informações Adicionais</strong><br>
{{ settings.post_checkout_message }}<br>
{% endif %}

<strong>Resumo do Pedido</strong><br>
<strong>Número do Pedido:</strong> {{ order.number }}<br>
<strong>Valor Total:</strong> {{ order.total }}<br>

Se você tiver alguma dúvida ou precisar de assistência, entre em contato com <a href="mailto:{{ settings.support_email }}">{{ settings.support_email }}</a>.<br>

Atenciosamente,<br>
{{ organizer.name }}
LIQUID
            ],
            EmailTemplateType::ATTENDEE_TICKET->value => [
                'subject' => '🎟️ Seu Ingresso para {{ event.title }}',
                'body' => <<<'LIQUID'
<strong>Você vai para {{ event.title }}! 🎉</strong><br>

{% if order.is_awaiting_offline_payment %}
<strong>ℹ️ Pagamento Pendente:</strong> Seu pedido está aguardando pagamento. Os ingressos foram emitidos, mas não serão válidos até que o pagamento seja recebido.<br>
{% endif %}

Olá {{ attendee.name }},<br>

Por favor, confira os detalhes do seu ingresso abaixo.<br>

<strong>Informações do Evento</strong><br>
<strong>Evento:</strong> {{ event.title }}<br>
<strong>Data:</strong> {{ event.date }}<br>
<strong>Horário:</strong> {{ event.time }}<br>
{% if event.full_address %}<strong>Local:</strong> {{ event.full_address }}<br>{% endif %}
<br>

<strong>Seu Ingresso</strong><br>
<strong>Tipo de Ingresso:</strong> {{ ticket.name }}<br>
<strong>Preço:</strong> {{ ticket.price }}<br>
<strong>Participante:</strong> {{ attendee.name }}<br>

<strong>💡Lembre-se:</strong> Por favor, tenha seu ingresso pronto quando chegar ao evento.<br>

Se você tiver alguma dúvida ou precisar de assistência, responda este e-mail ou entre em contato com o organizador do evento em <a href="mailto:{{ settings.support_email }}">{{ settings.support_email }}</a>.<br>

LIQUID
            ],
        ];
    }
}
