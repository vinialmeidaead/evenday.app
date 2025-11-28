@php /** @var \HiEvents\DomainObjects\OrderDomainObject $order */ @endphp
@php /** @var \HiEvents\DomainObjects\OrganizerDomainObject $organizer */ @endphp
@php /** @var \HiEvents\DomainObjects\EventDomainObject $event */ @endphp
@php /** @var \HiEvents\DomainObjects\EventSettingDomainObject $eventSettings */ @endphp
@php /** @var string $ticketUrl */ @endphp

@php /** @see \HiEvents\Mail\Order\OrderCancelled */ @endphp

<x-mail::message>
{{ __('Olá') }},

{{ __('Seu pedido para') }} <b>{{$event->getTitle()}}</b> {{ __('foi cancelado.') }}
<br>
<br>
{{ __('Número do Pedido:') }} <b>{{$order->getPublicId()}}</b>
<br>
<br>
{{ __('Se você tiver alguma dúvida ou precisar de assistência, responda a este e-mail.') }}
<br><br>
{{ __('Obrigado') }},<br>
{{ $organizer->getName() ?: config('app.name') }}

{!! $eventSettings->getGetEmailFooterHtml() !!}
</x-mail::message>
