import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { login } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
});
type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => { setTokens(data.access_token, data.refresh_token); navigate('/dashboard'); },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🏍</div>
          <h1 className="text-2xl font-bold">BikeTrack</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input {...register('email')} type="email" placeholder="you@example.com"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input {...register('password')} type="password" placeholder="••••••••"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          {mutation.isError && (
            <p className="text-red-500 text-sm text-center">Invalid email or password.</p>
          )}
          <button type="submit" disabled={mutation.isPending}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {mutation.isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-500">
          No account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">Register</Link>
        </p>
      </div>
    </div>
  );
}
