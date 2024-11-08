<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function loginForm()
    {
        return inertia('Login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'email|required|exists:web_users,email',
            'password' => 'required'
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();
            return to_route('dashboard');
        } else {
            return inertia('Login')->with('message', 'Invalid credentials');
        }
    }

    public function logout(Request $request)
    {
        $request->session()->invalidate();
        return to_route('login.show');
    }
}
