@php use HiEvents\Helper\DateHelper; @endphp
@php /** @uses \HiEvents\Mail\Order\OrderSummary */ @endphp
@php /** @var \HiEvents\DomainObjects\EventDomainObject $event */ @endphp
@php /** @var \HiEvents\DomainObjects\EventSettingDomainObject $eventSettings */ @endphp
@php /** @var \HiEvents\DomainObjects\OrganizerDomainObject $organizer */ @endphp
@php /** @var \HiEvents\DomainObjects\AttendeeDomainObject $attendee */ @endphp
@php /** @var \HiEvents\DomainObjects\OrderDomainObject $order */ @endphp

@php /** @var string $ticketUrl */ @endphp
@php /** @see \HiEvents\Mail\Attendee\AttendeeTicketMail */ @endphp

<x-mail::message>
# Você vai para {{ $event->getTitle() }}! 🎉
<br>
<br>
@if($order->isOrderAwaitingOfflinePayment())
<div style="border-radius: 4px; background-color: #f8d7da; color: #842029; margin-bottom: 1.5rem; padding: 1rem;">
<p>
ℹ️ Seu pedido está aguardando pagamento. Os ingressos foram emitidos, mas não serão válidos até que o pagamento seja recebido.
</p>
</div>
@endif

Veja os detalhes do seu ingresso abaixo.

<x-mail::button :url="$ticketUrl">
Ver Ingresso
</x-mail::button>

Se você tiver alguma dúvida ou precisar de assistência, responda a este e-mail ou entre em contato com o organizador do evento em <a href="mailto:{{$eventSettings->getSupportEmail()}}">{{$eventSettings->getSupportEmail()}}</a>.

Atenciosamente,<br>
{{ $organizer->getName() ?: 'evenday' }}

</x-mail::message>

