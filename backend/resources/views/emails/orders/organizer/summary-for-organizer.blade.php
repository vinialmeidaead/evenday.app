@php use HiEvents\Helper\Currency @endphp

@php /** @uses /backend/app/Mail/OrderSummary.php */ @endphp
@php /** @var \HiEvents\DomainObjects\OrderDomainObject $order */ @endphp
@php /** @var \HiEvents\DomainObjects\EventDomainObject $event */ @endphp

<x-mail::message>
# {{ __('Você recebeu um novo pedido!') }} 🎉

<br>
{{ __('Parabéns! Você recebeu um novo pedido para ') }} <b>{{ $event->getTitle() }}</b>! {{ __('Veja os detalhes abaixo.') }}
<br>
<br>

@if($order->isOrderAwaitingOfflinePayment())
<div style="border-radius: 4px; background-color: #f8d7da; color: #842029; margin-bottom: 1.5rem; padding: 1rem;">
<p>
{{ __('ℹ️ Este pedido está aguardando pagamento. Por favor, marque o pagamento como recebido na página de gerenciamento de pedidos assim que o pagamento for recebido.') }}
</p>
</div>
@endif

{{ __('Nome') }}: <b>{{ $order->getFullName() }}</b><br>
{{ __('E-mail') }}: <b>{{ $order->getEmail() }}</b><br>
{{ __('Valor do Pedido:') }} <b>{{ Currency::format($order->getTotalGross(), $event->getCurrency()) }}</b><br>
{{ __('ID do Pedido:') }} <b>{{ $order->getPublicId() }}</b><br>
{{ __('Status do Pedido:') }} <b>{{ $order->getHumanReadableStatus() }}</b>
<br>

<x-mail::button :url="$orderUrl">
    {{ __('Ver Pedido') }}
</x-mail::button>

</x-mail::message>






