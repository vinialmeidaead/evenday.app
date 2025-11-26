<?php

namespace HiEvents\Mail\Account;

use HiEvents\DomainObjects\UserDomainObject;
use HiEvents\Helper\Url;
use HiEvents\Mail\BaseMail;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * @uses /backend/resources/views/emails/user/confirm-email-address.blade.php
 */
class ConfirmEmailAddressEmail extends BaseMail
{
    private UserDomainObject $userDomainObject;

    private string $token;

    public function __construct(UserDomainObject $user, string $token)
    {
        parent::__construct($user->getLocale());

        $this->userDomainObject = $user;
        $this->token = $token;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Bem-vindo ao evenday! Confirme seu endereço de e-mail',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.user.confirm-email-address',
            with: [
                'user' => $this->userDomainObject,
                'link' => sprintf(Url::getFrontEndUrlFromConfig(Url::CONFIRM_EMAIL_ADDRESS), $this->token),
            ]
        );
    }
}
