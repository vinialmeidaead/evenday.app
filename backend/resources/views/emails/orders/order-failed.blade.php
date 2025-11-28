@php /** @var \HiEvents\DomainObjects\OrderDomainObject $order */ @endphp
@php /** @var \HiEvents\DomainObjects\OrganizerDomainObject $organizer */ @endphp
@php /** @var \HiEvents\DomainObjects\EventDomainObject $event */ @endphp
@php /** @var \HiEvents\DomainObjects\EventSettingDomainObject $eventSettings */ @endphp
@php /** @var string $eventUrl */ @endphp

@php /** @see \HiEvents\Mail\Order\OrderFailed */ @endphp

<x-mail::message>
{{ __('Olá') }},

{{ __('Seu pedido recente para') }} <b>{{$event->getTitle()}}</b> {{ __('não foi bem-sucedido.') }}

<x-mail::button :url="$eventUrl">
{{ __('Ver Página Inicial do Evento') }}
</x-mail::button>

{{ __('Se você tiver alguma dúvida ou precisar de assistência, entre em contato com nossa equipe de suporte') }}
{{ __('em') }} {{ $supportEmail ?? 'contato@evenday.app' }}.

{{ __('Atenciosamente') }},<br>
{{ $organizer->getName() ?: config('app.name') }}

{!! $eventSettings->getGetEmailFooterHtml() !!}
</x-mail::message>
