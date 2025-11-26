@php /** @var \HiEvents\DomainObjects\UserDomainObject $user */ @endphp
@php /** @var string $link */ @endphp

<x-mail::message>
Olá,

Você solicitou a redefinição de senha para sua conta no evenday.

Clique no link abaixo para redefinir sua senha.

<a href="{{ $link }}">Redefinir Senha</a>

Se você não solicitou a redefinição de senha, ignore este e-mail ou responda para nos informar.

Obrigado

</x-mail::message>

