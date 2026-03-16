<?php

declare(strict_types=1);

namespace HiEvents\Services\Application\Handlers\Admin;

use HiEvents\DomainObjects\Status\EventStatus;
use HiEvents\Models\AccountUser;
use HiEvents\Repository\Interfaces\EventRepositoryInterface;
use HiEvents\Services\Application\Handlers\Admin\DTO\BlockUserDTO;
use Illuminate\Database\DatabaseManager;
use Throwable;

class BlockUserHandler
{
    public function __construct(
        private readonly EventRepositoryInterface $eventRepository,
        private readonly DatabaseManager          $databaseManager,
    ) {
    }

    /**
     * @throws Throwable
     */
    public function handle(BlockUserDTO $dto): void
    {
        $this->databaseManager->transaction(function () use ($dto) {
            // Mark all account relationships for this user as inactive (blocked)
            AccountUser::where('user_id', $dto->userId)
                ->update(['status' => 'INACTIVE']);

            // Archive all active (live) events created by this user
            $this->eventRepository->updateWhere(
                attributes: ['status' => EventStatus::ARCHIVED->name],
                where: [
                    'user_id' => $dto->userId,
                    'status' => EventStatus::LIVE->name,
                ],
            );
        });
    }
}

