<?php

namespace HiEvents\DomainObjects\Enums;

enum EmailTemplateType: string
{
    use BaseEnum;

    case ORDER_CONFIRMATION = 'order_confirmation';
    case ATTENDEE_TICKET = 'attendee_ticket';

    public function label(): string
    {
        return match ($this) {
            self::ORDER_CONFIRMATION => __('Confirmação de Pedido'),
            self::ATTENDEE_TICKET => __('Ingresso do Participante'),
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::ORDER_CONFIRMATION => __('Enviado ao cliente após realizar um pedido'),
            self::ATTENDEE_TICKET => __('Enviado a cada participante com seu ingresso'),
        };
    }
}