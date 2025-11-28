@php /** @var \HiEvents\DomainObjects\OrderDomainObject $order */ @endphp
@php /** @var \HiEvents\DomainObjects\EventDomainObject $event */ @endphp
@php /** @var \HiEvents\DomainObjects\OrganizerDomainObject $organizer */ @endphp
@php /** @var \HiEvents\Values\MoneyValue $refundAmount */ @endphp
@php /** @var \HiEvents\DomainObjects\EventSettingDomainObject $eventSettings */ @endphp

@php /** @see \HiEvents\Mail\Order\OrderRefunded */ @endphp

<x-mail::message>
{{ __('Olá') }},

{{ __('Você recebeu um reembolso de :refundAmount para o seguinte evento: :eventTitle.', ['refundAmount' => $refundAmount, 'eventTitle' => $event->getTitle()]) }}

{{ __('Obrigado') }},<br>
{{ $organizer->getName() ?: config('app.name') }}

{!! $eventSettings->getGetEmailFooterHtml() !!}
</x-mail::message>
