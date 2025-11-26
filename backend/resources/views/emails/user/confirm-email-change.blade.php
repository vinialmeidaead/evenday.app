@php /** @var \HiEvents\DomainObjects\UserDomainObject $user */ @endphp
@php /** @var string $link */ @endphp

<x-mail::message>
Olá {{ $user->getFirstName() }},

Você solicitou a alteração do seu endereço de e-mail para <b>{{ $user->getPendingEmail() }}</b>. Clique no link abaixo para confirmar esta alteração.

<a href="{{ $link }}">Confirmar alteração de e-mail</a>

Se você não solicitou esta alteração, altere sua senha imediatamente.

Obrigado,
</x-mail::message>

