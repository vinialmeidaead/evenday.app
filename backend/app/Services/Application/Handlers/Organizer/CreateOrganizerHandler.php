<?php

namespace HiEvents\Services\Application\Handlers\Organizer;

use HiEvents\DomainObjects\ImageDomainObject;
use HiEvents\DomainObjects\OrganizerDomainObject;
use HiEvents\Repository\Interfaces\OrganizerRepositoryInterface;
use HiEvents\Services\Application\Handlers\Organizer\DTO\CreateOrganizerDTO;
use HiEvents\Services\Domain\Organizer\CreateDefaultOrganizerSettingsService;
use Illuminate\Database\DatabaseManager;
use Throwable;

class CreateOrganizerHandler
{
    public function __construct(
        private readonly OrganizerRepositoryInterface          $organizerRepository,
        private readonly DatabaseManager                       $databaseManager,
        private readonly CreateDefaultOrganizerSettingsService $createDefaultOrganizerSettingsService,
    )
    {
    }

    /**
     * @param array<string, string|null>|null $initialSocialMediaHandles
     * @param array<string, string|null>|null $initialLocationDetails
     * @throws Throwable
     */
    public function handle(
        CreateOrganizerDTO $organizerData,
        ?array $initialSocialMediaHandles = null,
        ?array $initialLocationDetails = null,
    ): OrganizerDomainObject {
        return $this->databaseManager->transaction(
            fn() => $this->createOrganizer($organizerData, $initialSocialMediaHandles, $initialLocationDetails)
        );
    }

    /**
     * @param array<string, string|null>|null $initialSocialMediaHandles
     * @param array<string, string|null>|null $initialLocationDetails
     */
    private function createOrganizer(
        CreateOrganizerDTO $organizerData,
        ?array $initialSocialMediaHandles = null,
        ?array $initialLocationDetails = null,
    ): OrganizerDomainObject {
        $organizer = $this->organizerRepository->create([
            'name' => $organizerData->name,
            'email' => $organizerData->email,
            'phone' => $organizerData->phone,
            'website' => $organizerData->website,
            'description' => $organizerData->description,
            'account_id' => $organizerData->account_id,
            'timezone' => $organizerData->timezone,
            'currency' => $organizerData->currency,
        ]);

        $this->createDefaultOrganizerSettingsService->createOrganizerSettings(
            $organizer,
            $initialSocialMediaHandles,
            $initialLocationDetails,
        );

        return $this->organizerRepository
            ->loadRelation(ImageDomainObject::class)
            ->findById($organizer->getId());
    }
}
