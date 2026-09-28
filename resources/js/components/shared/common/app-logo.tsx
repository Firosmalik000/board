import { cn } from '@/lib/utils';
import BrandLogo from './brand-logo';

export default function AppLogo({ className }: { className?: string }) {
    return (
        <div className={cn('flex items-center gap-2 overflow-hidden select-none', className)}>
            {/* Expanded sidebar logo: full horizontal logo */}
            <div className="group-data-[collapsible=icon]:hidden flex items-center">
                <BrandLogo variant="auto" size="md" className="h-7 w-auto" />
            </div>

            {/* Collapsed icon mode: symbol mark only */}
            <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center size-8">
                <BrandLogo variant="icon" size="sm" className="size-7" />
            </div>
        </div>
    );
}
