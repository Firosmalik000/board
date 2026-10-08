import NewPasswordController from '@/actions/App/Http/Controllers/Auth/NewPasswordController';
import { InputError } from '@/components/shared/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { Form, Head } from '@inertiajs/react';
import { Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface ResetPasswordProps {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    return (
        <AuthLayout
            title="Atur Ulang Password"
            description="Buat password baru yang kuat untuk akun Anda"
        >
            <Head title="Reset Password" />

            {/* Info box */}
            <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3.5 dark:border-blue-900/40 dark:bg-blue-950/20">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0052cc]/10">
                    <ShieldCheck className="h-4 w-4 text-[#0052cc]" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                    Buat password baru minimal <span className="font-semibold text-slate-800 dark:text-slate-200">8 karakter</span> untuk akun{' '}
                    <span className="font-semibold text-[#0052cc]">{email}</span>.
                </p>
            </div>

            <Form
                {...NewPasswordController.store.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
                className="space-y-5"
            >
                {({ processing, errors }) => (
                    <>
                        {/* Email (readonly) */}
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="email"
                                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                            >
                                Email
                            </Label>
                            <div className="relative">
                                <Mail className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    value={email}
                                    readOnly
                                    className="h-10 rounded-lg border-slate-300 bg-slate-50 pl-9 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/60"
                                />
                            </div>
                            <InputError message={errors.email} className="mt-1" />
                        </div>

                        {/* New Password */}
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="password"
                                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                            >
                                Password Baru
                            </Label>
                            <div className="relative">
                                <Lock className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    autoComplete="new-password"
                                    autoFocus
                                    placeholder="Minimal 8 karakter"
                                    className="h-10 rounded-lg border-slate-300 pr-10 pl-9 text-sm focus-visible:ring-[#0052cc] dark:border-slate-700"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="password_confirmation"
                                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                            >
                                Konfirmasi Password Baru
                            </Label>
                            <div className="relative">
                                <KeyRound className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="password_confirmation"
                                    type={showConfirm ? 'text' : 'password'}
                                    name="password_confirmation"
                                    autoComplete="new-password"
                                    placeholder="Ulangi password baru"
                                    className="h-10 rounded-lg border-slate-300 pr-10 pl-9 text-sm focus-visible:ring-[#0052cc] dark:border-slate-700"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                >
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <InputError message={errors.password_confirmation} className="mt-1" />
                        </div>

                        <Button
                            type="submit"
                            className="h-10 w-full rounded-lg bg-[#0052cc] text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0747a6] disabled:opacity-60"
                            disabled={processing}
                            data-test="reset-password-button"
                        >
                            {processing && <Spinner className="mr-2" />}
                            Simpan Password Baru
                        </Button>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
