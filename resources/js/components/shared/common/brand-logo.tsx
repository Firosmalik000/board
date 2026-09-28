import { cn } from '@/lib/utils';
import React from 'react';

export type BrandLogoVariant =
    | 'auto'
    | 'horizontal'
    | 'navy'
    | 'white'
    | 'stacked'
    | 'icon';

export interface BrandLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    variant?: BrandLogoVariant;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
    className?: string;
    alt?: string;
}

export function BrandLogo({
    variant = 'auto',
    size = 'md',
    className,
    alt = 'Firlabs Board',
    ...props
}: BrandLogoProps) {
    const sizeClasses = {
        sm: variant === 'icon' ? 'h-6 w-6' : variant === 'stacked' ? 'h-10 w-auto' : 'h-5 w-auto',
        md: variant === 'icon' ? 'h-8 w-8' : variant === 'stacked' ? 'h-14 w-auto' : 'h-7 w-auto',
        lg: variant === 'icon' ? 'h-12 w-12' : variant === 'stacked' ? 'h-20 w-auto' : 'h-10 w-auto',
        xl: variant === 'icon' ? 'h-16 w-16' : variant === 'stacked' ? 'h-28 w-auto' : 'h-14 w-auto',
        custom: '',
    };

    const appliedSize = size !== 'custom' ? sizeClasses[size] : '';

    if (variant === 'auto') {
        return (
            <div className={cn('inline-flex items-center', className)}>
                <img
                    src="/brand/logo-horizontal-color.png"
                    alt={alt}
                    className={cn('object-contain dark:hidden select-none', appliedSize)}
                    {...props}
                />
                <img
                    src="/brand/logo-horizontal-white.png"
                    alt={alt}
                    className={cn('object-contain hidden dark:block select-none', appliedSize)}
                    {...props}
                />
            </div>
        );
    }

    const srcMap: Record<Exclude<BrandLogoVariant, 'auto'>, string> = {
        horizontal: '/brand/logo-horizontal-color.png',
        navy: '/brand/logo-horizontal-navy.png',
        white: '/brand/logo-horizontal-white.png',
        stacked: '/brand/logo-stacked-color.png',
        icon: '/brand/logo-icon-color.png',
    };

    return (
        <img
            src={srcMap[variant]}
            alt={alt}
            className={cn('object-contain select-none', appliedSize, className)}
            {...props}
        />
    );
}

export default BrandLogo;
