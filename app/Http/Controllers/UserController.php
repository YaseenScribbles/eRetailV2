<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class UserController extends Controller
{
    public function show()
    {
        $users = User::all();
        $shops = DB::select('select shopid,shopname from shops');
        $buyers = DB::select('select id,name from buyers');
        return Inertia::render('Users', ['users' => $users, 'shops' => $shops, 'buyers' => $buyers]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:web_users,email',
            'password' => 'required|confirmed',
            'mobile' => 'nullable|min:10|max:10|unique:web_users,mobile',
            'role' => 'required|string',
            'shops' => 'required|string',
            'buyer_id' => 'required|string',
            'sale_report' => 'required|string',
            'has_invoice_report' => 'boolean',
        ]);

        User::create($data);
        return to_route('users.show');
    }

    public function update(User $user, Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:web_users,email,' . $user->id,
            'password' => 'confirmed',
            'mobile' => 'nullable|min:10|max:10|unique:web_users,mobile,' . $user->id,
            'role' => 'required|string',
            'shops' => 'required|string',
            'buyer_id' => 'required|string',
            'sale_report' => 'required|string',
            'has_invoice_report' => 'boolean',
        ]);

        if (empty($data['password'])) {
            unset($data['password']); // Skip password update if empty
            unset($data['password_confirmation']);
        }

        $user->update($data);
        return to_route('users.show');
    }
}
