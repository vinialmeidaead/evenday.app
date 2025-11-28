@php /** @var string $organizerName */ @endphp
@php /** @var string $senderName */ @endphp
@php /** @var string $senderEmail */ @endphp
@php /** @var string $messageContent */ @endphp
@php /** @var string $replySubject */ @endphp

@php /** @see \HiEvents\Mail\Organizer\OrganizerContactEmail */ @endphp

<x-mail::message>
{{ __('Olá :name', ['name' => $organizerName]) }},

{{ __('Você recebeu uma nova mensagem de') }} **{{ $senderName }}** ({{ $senderEmail }}).

<div style="border-radius: 5px; background-color: #eeeeee; margin: 10px 0; padding: 20px;">

{!! nl2br(e($messageContent)) !!}

</div>

<x-mail::button :url="'mailto:' . $senderEmail . '?subject=' . $replySubject">
{{ __('Responder a :name', ['name' => $senderName]) }}
</x-mail::button>

{{ __('Esta mensagem foi enviada através do seu formulário de contato de organizador.') }}

</x-mail::message>
