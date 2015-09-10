<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the controller to call when that URI is requested.
|
*/

$app->get('/', function () {
    return view('reference');
});

$app->get('/item', 'App\Http\Controllers\ItemsController@itemQuery');
$app->post('/item', 'App\Http\Controllers\ItemsController@itemQuery');
$app->get('/item/{id}', 'App\Http\Controllers\ItemsController@item');
$app->post('/item/{id}', 'App\Http\Controllers\ItemsController@item');

$app->get('/items', 'App\Http\Controllers\ItemsController@itemsQuery');
$app->post('/items', 'App\Http\Controllers\ItemsController@itemsQuery');
$app->get('/items/all', 'App\Http\Controllers\TradeableItemsController@items');
$app->post('/items/all', 'App\Http\Controllers\TradeableItemsController@items');
$app->get('/items/categories', 'App\Http\Controllers\ItemsController@categories');
$app->get('/items/autocomplete', 'App\Http\Controllers\ItemsController@autocomplete');
$app->get('/items/by-name', 'App\Http\Controllers\ItemsController@byName');
$app->post('/items/by-name', 'App\Http\Controllers\ItemsController@byName');
$app->get('/items/by-skin', 'App\Http\Controllers\ItemsController@bySkin');
$app->post('/items/by-skin', 'App\Http\Controllers\ItemsController@bySkin');
$app->get('/items/{id}', 'App\Http\Controllers\ItemsController@items');
$app->post('/items/{id}', 'App\Http\Controllers\ItemsController@items');

$app->get('/image/{hash:[a-fA-F0-9]{32}}/{size:64|32|20}', 'App\Http\Controllers\ImageController@show');

$app->get('/skins/resolve', 'App\Http\Controllers\SkinsController@resolve');

$app->get('/leaderboard/pvp', 'App\Http\Controllers\LeaderboardController@pvpIndex');
$app->get('/leaderboard/pvp/{name}', 'App\Http\Controllers\LeaderboardController@pvpByUser');