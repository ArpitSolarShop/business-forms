import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Lock } from 'lucide-react';

export default function LoginPage() {
  async function login(formData: FormData) {
    'use server';
    const pin = formData.get('pin');
    if (pin === '1911') {
      const cookieStore = await cookies();
      cookieStore.set('admin_pin', '1911', { 
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
      redirect('/');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <form action={login} className="bg-white p-8 rounded-2xl shadow-lg space-y-6 max-w-sm w-full border border-slate-200 text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
          <Lock className="w-6 h-6" />
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>
          <p className="text-sm text-slate-500 mt-1">Enter your PIN to access the dashboard.</p>
        </div>

        <input 
          type="password" 
          name="pin" 
          placeholder="••••"
          required
          autoFocus
          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-center font-mono text-2xl tracking-[0.5em] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
        
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors text-sm uppercase tracking-wider shadow-sm">
          Unlock Dashboard
        </button>
      </form>
    </div>
  );
}
