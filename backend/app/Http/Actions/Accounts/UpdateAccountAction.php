<?php

namespace HiEvents\Http\Actions\Accounts;

use HiEvents\DomainObjects\Enums\Role;
use HiEvents\Http\Actions\BaseAction;
use HiEvents\Http\Request\Account\UpdateAccountRequest;
use HiEvents\Resources\Account\AccountResource;
use HiEvents\Services\Application\Handlers\Account\DTO\UpdateAccountDTO;
use HiEvents\Services\Application\Handlers\Account\UpdateAccountHanlder;
use Illuminate\Http\JsonResponse;

class UpdateAccountAction extends BaseAction
{
    private UpdateAccountHanlder $updateAccountHandler;

    public function __construct(UpdateAccountHanlder $updateAccountHandler)
    {
        $this->updateAccountHandler = $updateAccountHandler;
    }

    public function __invoke(UpdateAccountRequest $request): JsonResponse
    {
        $this->minimumAllowedRole(Role::ADMIN);

        $authUser = $this->getAuthenticatedUser();

        $validated = $request->validated();

        $payload = array_merge($validated, [
            'account_id' => $this->getAuthenticatedAccountId(),
            'updated_by_user_id' => $authUser->getId(),
        ]);

        $fiscalKeys = ['organizer_tax_id_type', 'organizer_tax_id', 'pix_key_type', 'pix_key_value'];
        $fiscalAttributes = array_intersect_key($validated, array_flip($fiscalKeys));

        $account = $this->updateAccountHandler->handle(
            UpdateAccountDTO::fromArray($payload),
            $fiscalAttributes,
        );

        return $this->resourceResponse(AccountResource::class, $account);
    }
}
