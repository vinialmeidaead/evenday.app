<?php

declare(strict_types=1);

namespace HiEvents\Http\Actions\Admin\Users;

use HiEvents\DomainObjects\Enums\Role;
use HiEvents\Http\Actions\BaseAction;
use HiEvents\Services\Application\Handlers\Admin\BlockUserHandler;
use HiEvents\Services\Application\Handlers\Admin\DTO\BlockUserDTO;
use Illuminate\Http\JsonResponse;

class BlockUserAction extends BaseAction
{
    public function __construct(
        private readonly BlockUserHandler $handler,
    ) {
    }

    public function __invoke(int $userId): JsonResponse
    {
        $this->minimumAllowedRole(Role::SUPERADMIN);

        $this->handler->handle(new BlockUserDTO(
            userId: $userId,
        ));

        return $this->jsonResponse([
            'message' => __('User has been blocked and active events have been archived.'),
        ]);
    }
}

