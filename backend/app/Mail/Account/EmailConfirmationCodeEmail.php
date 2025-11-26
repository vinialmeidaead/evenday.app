<?php

namespace HiEvents\Mail\Account;

use HiEvents\DomainObjects\UserDomainObject;
use HiEvents\Mail\BaseMail;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * @uses /backend/resources/views/emails/user/email-confirmation-code.blade.php
 */
class EmailConfirmationCodeEmail extends BaseMail
{
    private UserDomainObject $userDomainObject;

    private string $code;

    public function __construct(UserDomainObject $user, string $token)
    {
        parent::__construct($user->getLocale());

        $this->userDomainObject = $user;
        $this->code = $token;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Seu código de confirmação para evenday é ' . $this->code,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.user.email-confirmation-code',
            with: [
                'user' => $this->userDomainObject,
                'code' => $this->code,
            ]
        );
    }
}
