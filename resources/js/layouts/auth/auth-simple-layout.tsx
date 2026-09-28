import { BrandLogo } from '@/components/shared/common';
import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center bg-slate-50/70 p-4 selection:bg-[#0052cc] selection:text-white sm:p-6 md:p-10 dark:bg-slate-950">
            {/* Subtle background pattern */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-40 dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)]" />

            <div className="relative z-10 w-full max-w-[420px] space-y-6">
                {/* Clean elevated authentication card (Atlassian SaaS style) */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-7 shadow-xl shadow-slate-200/40 backdrop-blur-xs sm:p-9 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none">
                    <div className="flex flex-col gap-6">
                        {/* Brand Header */}
                        <div className="flex flex-col items-center gap-3 text-center">
                            <Link
                                href={home()}
                                className="group flex items-center justify-center transition-transform hover:scale-105"
                            >
                                <BrandLogo
                                    variant="stacked"
                                    className="h-16 w-auto object-contain sm:h-20"
                                />
                            </Link>

                            <div className="mt-1 space-y-1">
                                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">
                                    {title}
                                </h1>
                                <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                                    {description}
                                </p>
                            </div>
                        </div>

                        {/* Form content */}
                        {children}
                    </div>
                </div>

                {/* Professional SaaS Security Footer */}
                <div className="flex flex-col items-center justify-center gap-2 text-center text-xs text-slate-500 dark:text-slate-500">
                    <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                        <span>Enterprise Grade Workspace Security</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
                        <span>Privacy Policy</span>
                        <span>•</span>
                        <span>Terms of Service</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-400">
                            <BrandLogo variant="icon" className="size-3.5" />
                            Firlabs Board
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
