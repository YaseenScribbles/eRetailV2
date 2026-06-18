<?php

namespace App\Http\Controllers;

use App\Models\User;
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

        $user = User::where('email', $credentials['email'])->first();

        if ($user && $user->api_only) {
            return inertia('Login')->with('message', 'Invalid credentials');
        }

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
