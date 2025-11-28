@php /** @var \HiEvents\DomainObjects\OrderDomainObject $order */ @endphp
@php /** @var \HiEvents\DomainObjects\EventDomainObject $event */ @endphp
@php /** @var \HiEvents\DomainObjects\OrganizerDomainObject $organizer */ @endphp
@php /** @var \HiEvents\DomainObjects\EventSettingDomainObject $eventSettings */ @endphp

@php /** @see \HiEvents\Mail\Order\PaymentSuccessButOrderExpiredMail */ @endphp

<x-mail::message>
{{ __('Olá') }},

<p>
{{ __('Seu pedido recente para :eventTitle não foi bem-sucedido. O pedido expirou enquanto você estava concluindo o pagamento. Emitimos um reembolso para o pedido.', ['eventTitle' => $event->getTitle()]) }}
</p>

<p>
{{ __('Pedimos desculpas pelo inconveniente. Se você tiver alguma dúvida ou precisar de assistência, entre em contato conosco em') }} <a href="mailto:{{$organizer->getEmail()}}">{{$organizer->getEmail()}}</a>.
</p>

<x-mail::button :url="$event->getEventUrl()">
{{ __('Ver Página do Evento') }}
</x-mail::button>

{{ __('Atenciosamente') }},<br>
{{ $organizer->getName() ?: config('app.name') }}

{!! $eventSettings->getGetEmailFooterHtml() !!}
</x-mail::message>
