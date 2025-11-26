@php use Carbon\Carbon; use HiEvents\Helper\Currency; use HiEvents\Helper\DateHelper; @endphp
@php /** @var \HiEvents\DomainObjects\OrderDomainObject $order */ @endphp
@php /** @var \HiEvents\DomainObjects\EventDomainObject $event */ @endphp
@php /** @var \HiEvents\DomainObjects\OrganizerDomainObject $organizer */ @endphp
@php /** @var \HiEvents\DomainObjects\EventSettingDomainObject $eventSettings */ @endphp
@php /** @var string $orderUrl */ @endphp

@php /** @see \HiEvents\Mail\Order\OrderSummary */ @endphp

<x-mail::message>
# Seu Pedido foi Confirmado! 🎉

@if($order->isOrderAwaitingOfflinePayment() === false)

<p>
Parabéns! Seu pedido para {{ $event->getTitle() }} em {{ (new Carbon(DateHelper::convertFromUTC($event->getStartDate(), $event->getTimezone())))->format('d/m/Y') }} às {{ (new Carbon(DateHelper::convertFromUTC($event->getStartDate(), $event->getTimezone())))->format('H:i') }} foi realizado com sucesso. Veja os detalhes do seu pedido abaixo.
</p>

@else

<div>
<p>
Seu pedido está aguardando pagamento. Os ingressos foram emitidos, mas não serão válidos até que o pagamento seja recebido.
</p>

<div style="border-radius: 4px; background-color: #d7e8f8; color: #204e84; margin-bottom: 1.5rem; padding: 1rem;">
<h2>Instruções de Pagamento</h2>
Siga as instruções abaixo para concluir seu pagamento.
{!! $eventSettings->getOfflinePaymentInstructions() !!}
</div>
</div>

@endif

<p>

# Detalhes do Evento
**Nome do Evento:** {{ $event->getTitle() }}
    <br>
**Data e Hora:** {{ (new Carbon(DateHelper::convertFromUTC($event->getStartDate(), $event->getTimezone())))->format('d/m/Y') }} às {{ (new Carbon(DateHelper::convertFromUTC($event->getStartDate(), $event->getTimezone())))->format('H:i') }}

</p>

@if($eventSettings->getPostCheckoutMessage() && $order->isOrderCompleted())
<p>

# Informações Adicionais

{!! $eventSettings->getPostCheckoutMessage() !!}

</p>
@endif

# Resumo do Pedido
- **Número do Pedido:** {{ $order->getPublicId() }}
- **Valor Total:** {{ Currency::format($order->getTotalGross(), $event->getCurrency()) }}

<x-mail::button :url="$orderUrl">
    Ver Resumo do Pedido e Ingressos
</x-mail::button>

Se você tiver alguma dúvida ou precisar de assistência, entre em contato com <a href="mailto:{{ $organizer->getEmail() }}">{{ $organizer->getEmail() }}</a>.

Atenciosamente,<br>
{{ $organizer->getName() ?: 'evenday' }}
</x-mail::message>

