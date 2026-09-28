import { cn } from '@/lib/utils';
import React from 'react';

export default function AppLogoIcon({
    className,
    alt = 'Firlabs Board',
    ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/brand/logo-icon-color.png"
            alt={alt}
            className={cn('size-6 object-contain select-none', className)}
            {...props}
        />
    );
}
