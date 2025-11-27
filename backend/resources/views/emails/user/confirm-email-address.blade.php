@php /** @var \HiEvents\DomainObjects\UserDomainObject $user */ @endphp
@php /** @var string $link */ @endphp

<x-mail::message>
Olá {{ $user->getFirstName() }},

Bem-vindo (a) ao evenday! Estamos muito felizes em ter você conosco!

Para começar e ativar sua conta, clique no link abaixo para confirmar seu endereço de e-mail:

<x-mail::button :url="$link">
    Confirmar E-mail
</x-mail::button>

Se você não criou uma conta conosco, nenhuma ação adicional é necessária. Seu endereço de e-mail não será usado sem confirmação.

Atenciosamente,<br>
Equipe evenday
</x-mail::message>
