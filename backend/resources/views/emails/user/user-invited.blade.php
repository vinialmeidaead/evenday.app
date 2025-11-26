@php /** @var \HiEvents\DomainObjects\UserDomainObject $invitedUser */ @endphp
@php /** @var string $inviteLink */ @endphp
@php /** @var string $appName */ @endphp

<x-mail::message>
Olá {{ $invitedUser->getFirstName() }},

Você foi convidado para participar do evenday.

Para aceitar o convite, clique no link abaixo:

<a href="{{ $inviteLink }}">Aceitar Convite</a>

Obrigado,<br>
evenday
</x-mail::message>

