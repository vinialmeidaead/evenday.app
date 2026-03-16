<?php

declare(strict_types=1);

namespace HiEvents\Services\Application\Handlers\Admin\DTO;

readonly class BlockUserDTO
{
    public function __construct(
        public int $userId,
    ) {
    }
}

