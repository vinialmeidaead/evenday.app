<?php

namespace HiEvents\Services\Domain\Organizer;

use HiEvents\DomainObjects\Enums\ColorTheme;
use HiEvents\DomainObjects\Enums\OrganizerHomepageVisibility;
use HiEvents\DomainObjects\OrganizerDomainObject;
use HiEvents\Repository\Interfaces\OrganizerSettingsRepositoryInterface;

class CreateDefaultOrganizerSettingsService
{
    public function __construct(
        private readonly OrganizerSettingsRepositoryInterface $organizerSettingsRepository
    )
    {
    }

    /**
     * @param array<string, string|null>|null $socialMediaHandles
     * @param array<string, string|null>|null $locationDetails
     */
    public function createOrganizerSettings(
        OrganizerDomainObject $organizer,
        ?array $socialMediaHandles = null,
        ?array $locationDetails = null,
    ): void {
        /** @var ColorTheme $defaultTheme */
        $defaultTheme = config('app.organizer_homepage_default_theme');

        $payload = [
            'organizer_id' => $organizer->getId(),
            'homepage_visibility' => OrganizerHomepageVisibility::PUBLIC->name,

            // Use the "Modern" theme as default
            'homepage_theme_settings' => $defaultTheme->getThemeData(),
        ];

        if ($socialMediaHandles !== null) {
            $payload['social_media_handles'] = $socialMediaHandles;
        }

        if ($locationDetails !== null) {
            $payload['location_details'] = $locationDetails;
        }

        $this->organizerSettingsRepository->create($payload);
    }
}
