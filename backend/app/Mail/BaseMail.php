<?php

namespace HiEvents\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

abstract class BaseMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    protected ?string $emailLocale = null;

    public function __construct(?string $locale = null)
    {
        $this->emailLocale = $locale ?? config('app.locale');
        $this->afterCommit();
    }

    public function locale($locale): static
    {
        return parent::locale($this->emailLocale);
    }

    abstract public function envelope(): Envelope;

    abstract public function content(): Content;
}
