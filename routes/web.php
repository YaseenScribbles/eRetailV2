<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CostVsSaleController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\ReceivedController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use SebastianBergmann\CodeCoverage\Report\Html\Dashboard;

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
    return to_route('login.show');
});

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'loginForm'])->name('login.show');
    Route::post('/login', [AuthController::class, 'login'])->name('login');
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/dashboard', [DashboardController::class, 'show'])->name('dashboard');
    Route::get('/sales', [SalesController::class, 'show'])->name('sales');
    Route::post('/sales-report', [SalesController::class, 'report'])->name('sales.report');
    Route::get('/received', [ReceivedController::class, 'show'])->name('received');
    Route::post('/received-report', [ReceivedController::class, 'report'])->name('received.report');
    Route::get('/stock', [StockController::class, 'show'])->name('stock');
    Route::post('/stock-report', [StockController::class, 'report'])->name('stock.report');
    Route::get('/invoice', [InvoiceController::class, 'show'])->name('invoice');
    Route::post('/invoice-report', [InvoiceController::class, 'report'])->name('invoice.report');
    Route::get('/cvs', [CostVsSaleController::class, 'show'])->name('cvs');
    Route::post('/cvs-report', [CostVsSaleController::class, 'report'])->name('cvs.report');
    Route::get('/users', [UserController::class, 'show'])->name('users.show');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::put('/users/{user}',[UserController::class,'update'])->name('users.update');

    Route::get('/buyers', function (Request $request) {
        $f_year = $request->query('f_year');
        $buyers = auth()->user()->buyer_id;
        if ($f_year === "2324") {
            $sqlconnection = "sqlsrv2";
        } else {
            $sqlconnection = "sqlsrv3";
        }

        $buyersList = DB::connection($sqlconnection)->select("select distinct im.destination,b.buyername + ', ' + im.destination name from invoicemaster im, buyer b
        where im.buyerid = b.buyerid and im.buyerid in ($buyers)");
        return response()->json(['buyers' => $buyersList]);
    });

    Route::get('/stock-summary',[DashboardController::class,'stockSummaryReport']);
});
