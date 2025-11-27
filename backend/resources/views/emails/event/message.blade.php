@php /** @var \HiEvents\DomainObjects\EventDomainObject $event */ @endphp
@php /** @var \HiEvents\DomainObjects\EventSettingDomainObject $eventSettings */ @endphp
@php /** @var \HiEvents\Services\Application\Handlers\Message\DTO\SendMessageDTO $messageData */ @endphp

@php /** @see \HiEvents\Mail\Event\EventMessage */ @endphp

<x-mail::message>
{!! $messageData->message !!}

{!! $eventSettings->getGetEmailFooterHtml() !!}

<div style="color: #888; margin-top: 30px; font-size: .8em;">
{{ __('Você está recebendo esta comunicação porque você está registrado como participante para o seguinte evento:') }}
<b>{{ $event->getTitle() }}</b>. {{ __('Se você acredita que recebeu este e-mail por engano,') }}
{{ __('entre em contato com o organizador do evento em') }} <a
        href="mailto:{{$eventSettings->getSupportEmail()}}">{{$eventSettings->getSupportEmail()}}</a>.
{{ __('Se você acredita que este é spam, por favor, informe-nos') }} <a href="mailto:{{config('mail.from.address')}}">{{config('mail.from.address')}}</a>.
</div>
</x-mail::message>
