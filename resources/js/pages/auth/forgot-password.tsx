import PasswordResetLinkController from '@/actions/App/Http/Controllers/Auth/PasswordResetLinkController';
import { TextLink } from '@/components/shared/common';
import { InputError } from '@/components/shared/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { Form, Head } from '@inertiajs/react';
import { ArrowLeft, KeyRound, Loader2, Mail } from 'lucide-react';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Lupa Password?"
            description="Masukkan email Anda dan kami akan mengirimkan tautan untuk mengatur ulang password"
        >
            <Head title="Lupa Password" />

            {status && (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                        <svg className="h-3 w-3 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Email Terkirim!</p>
                        <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">{status}</p>
                    </div>
                </div>
            )}

            <Form {...PasswordResetLinkController.store.form()} className="space-y-5">
                {({ processing, errors }) => (
                    <>
                        {/* Info banner */}
                        <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3.5 dark:border-blue-900/40 dark:bg-blue-950/20">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0052cc]/10">
                                <KeyRound className="h-4 w-4 text-[#0052cc]" />
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                Tautan reset password akan dikirim ke email Anda dan berlaku selama <span className="font-semibold text-slate-800 dark:text-slate-200">60 menit</span>.
                            </p>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="email"
                                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                            >
                                Alamat Email
                            </Label>
                            <div className="relative">
                                <Mail className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    autoFocus
                                    placeholder="nama@perusahaan.com"
                                    className="h-10 rounded-lg border-slate-300 pl-9 text-sm focus-visible:ring-[#0052cc] dark:border-slate-700"
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="h-10 w-full rounded-lg bg-[#0052cc] text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0747a6] disabled:opacity-60"
                            disabled={processing}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Mengirim...
                                </>
                            ) : (
                                <>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Kirim Tautan Reset Password
                                </>
                            )}
                        </Button>

                        {/* Back to login */}
                        <div className="flex items-center justify-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800">
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span>Kembali ke</span>
                            <TextLink
                                href={login()}
                                className="font-semibold text-[#0052cc] hover:underline"
                            >
                                halaman login
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
