@php /** @var \HiEvents\DomainObjects\UserDomainObject $user */ @endphp
@php /** @var string $code */ @endphp

<x-mail::message>
Olá {{ $user->getFirstName() }},

Bem-vindo ao evenday! Estamos muito felizes em ter você conosco!

Seu código de confirmação de e-mail é:

<h2>{{ $code }}</h2>

Se você não criou uma conta conosco, nenhuma ação adicional é necessária. Seu endereço de e-mail não será usado sem confirmação.

Atenciosamente,<br>
Equipe evenday
</x-mail::message>

