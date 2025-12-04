<?php

namespace HiEvents\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Sentry\Laravel\Facade as Sentry;
use Symfony\Component\Routing\Exception\ResourceNotFoundException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that are not reported.
     *
     * @var array
     */
    protected $dontReport = [
        // Add exceptions that shouldn't be reported
    ];

    /**
     * A list of the inputs that are never flashed for validation exceptions.
     *
     * @var array
     */
    protected $dontFlash = [
        'password',
        'password_confirmation',
    ];

    /**
     * Report or log an exception.
     *
     * @param Throwable $e
     * @return void
     * @throws Throwable
     */
    public function report(Throwable $e)
    {
        if ($this->shouldReport($e)) {
            Sentry::captureException($e);
        }

        parent::report($e);
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @param \Illuminate\Http\Request $request
     * @param Throwable $exception
     * @return \Illuminate\Http\JsonResponse|\Illuminate\Http\Response
     * @throws Throwable
     */
    public function render($request, Throwable $exception)
    {
        // Log all exceptions for debugging
        if (config('app.debug') || str_contains($request->path(), 'asaas')) {
            logger()->error('ExceptionHandler: Exception caught', [
                'exception_class' => get_class($exception),
                'exception_message' => $exception->getMessage(),
                'request_path' => $request->path(),
                'request_method' => $request->method(),
                'trace' => $exception->getTraceAsString(),
            ]);
        }

        if ($exception instanceof ResourceNotFoundException) {
            return response()->json([
                'message' => $exception->getMessage() ?: 'Resource not found',
            ], 404);
        }

        return parent::render($request, $exception);
    }
}
