<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

// Serve public storage files (images, etc.)
Route::get('/{path}', function ($path) {
    $file = storage_path('app/public/' . $path);
    
    if (file_exists($file)) {
        return response()->file($file);
    }
    
    abort(404);
})->where('path', '(organizer_cover|organizer_logo|event_cover|event_images|ticket_logo)/.*');
