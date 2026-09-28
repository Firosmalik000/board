import ActivityHistory from '@/components/profile/activity-history';
import DeleteUser from '@/components/shared/auth/delete-user';
import TwoFactorRecoveryCodes from '@/components/shared/auth/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/shared/auth/two-factor-setup-modal';
import AppearanceToggleTab from '@/components/shared/common/appearance-tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import AppLayout from '@/layouts/app-layout';
import {
    disable as disableTwoFactor,
    enable as enableTwoFactor,
} from '@/routes/two-factor';
import { type BreadcrumbItem } from '@/types';
import { Form, Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Key,
    Mail,
    Palette,
    Shield,
    ShieldBan,
    ShieldCheck,
    TrendingUp,
    Upload,
    User as UserIcon,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile & Settings',
        href: '/user/profile',
    },
];

interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    created_at: string;
}

interface Statistics {
    totalBoards: number;
    totalCards: number;
    completedTasks: number;
}

interface ProfileProps {
    user: User;
    statistics: Statistics;
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
}

export default function Profile({
    user,
    statistics,
    requiresConfirmation = false,
    twoFactorEnabled = false,
}: ProfileProps) {
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState('overview');

    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
    });

    const {
        data: passwordData,
        setData: setPasswordData,
        put: updatePassword,
        processing: processingPassword,
        errors: passwordErrors,
        reset,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors: twoFactorErrors,
    } = useTwoFactorAuth();

    const [showSetupModal, setShowSetupModal] = useState<boolean>(false);

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        put('/user/profile', {
            onSuccess: () => {
                toast.success('Profile updated successfully');
            },
            onError: () => {
                toast.error('Failed to update profile');
            },
        });
    };

    const handleUpdatePassword = (e: React.FormEvent) => {
        e.preventDefault();
        updatePassword('/user/profile/password', {
            onSuccess: () => {
                toast.success('Password updated successfully');
                reset();
            },
            onError: () => {
                toast.error('Failed to update password');
            },
        });
    };

    const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image size must be less than 2MB');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        router.post('/user/profile/avatar', formData, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Avatar updated successfully');
                if (avatarInputRef.current) {
                    avatarInputRef.current.value = '';
                }
            },
            onError: () => {
                toast.error('Failed to upload avatar');
            },
        });
    };

    const handleRemoveAvatar = () => {
        if (!confirm('Are you sure you want to remove your avatar?')) return;

        router.delete('/user/profile/avatar', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Avatar removed successfully');
            },
            onError: () => {
                toast.error('Failed to remove avatar');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile & Settings" />

            <div className="mx-auto flex h-full max-w-7xl flex-1 flex-col gap-8 p-6">
                {/* Beautiful Header with Gradient */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-1">
                    <div className="rounded-xl bg-background p-8">
                        <div className="flex flex-col items-center gap-6 md:flex-row">
                            <div className="group relative">
                                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-25 blur transition duration-300 group-hover:opacity-75"></div>
                                <Avatar className="relative h-28 w-28 border-4 border-background shadow-xl">
                                    {user.avatar && (
                                        <AvatarImage
                                            src={`/storage/${user.avatar}`}
                                            alt={user.name}
                                        />
                                    )}
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-3xl font-bold text-white">
                                        {user.name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')
                                            .toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-10 w-10 rounded-full p-0 text-white hover:bg-white/20 hover:text-white"
                                        onClick={() =>
                                            avatarInputRef.current?.click()
                                        }
                                        title="Upload avatar"
                                    >
                                        <Upload className="h-5 w-5" />
                                    </Button>
                                    {user.avatar && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-10 w-10 rounded-full p-0 text-white hover:bg-white/20 hover:text-white"
                                            onClick={handleRemoveAvatar}
                                            title="Remove avatar"
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    )}
                                </div>
                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                />
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <h1 className="mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent">
                                    {user.name}
                                </h1>
                                <p className="mb-2 flex items-center justify-center gap-2 text-muted-foreground md:justify-start">
                                    <Mail className="h-4 w-4" />
                                    {user.email}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Member since{' '}
                                    {new Date(
                                        user.created_at,
                                    ).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </p>
                            </div>

                            {/* Quick Stats */}
                            <div className="flex gap-6 text-center">
                                <div>
                                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
                                        {statistics.totalBoards}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Boards
                                    </div>
                                </div>
                                <div>
                                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent">
                                        {statistics.totalCards}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Cards
                                    </div>
                                </div>
                                <div>
                                    <div className="bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-3xl font-bold text-transparent">
                                        {statistics.completedTasks}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Completed
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                >
                    <TabsList className="grid h-auto w-full grid-cols-4 bg-muted/50 p-1 lg:inline-grid lg:w-auto">
                        <TabsTrigger
                            value="overview"
                            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                        >
                            <UserIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Profile</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="security"
                            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
                        >
                            <Shield className="h-4 w-4" />
                            <span className="hidden sm:inline">Security</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="appearance"
                            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-red-500 data-[state=active]:text-white"
                        >
                            <Palette className="h-4 w-4" />
                            <span className="hidden sm:inline">Appearance</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="activity"
                            className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white"
                        >
                            <TrendingUp className="h-4 w-4" />
                            <span className="hidden sm:inline">Activity</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="overview" className="mt-6 space-y-6">
                        <Card className="border-2 transition-colors hover:border-blue-500/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-2xl">
                                    <div className="rounded-lg bg-blue-500/10 p-2">
                                        <UserIcon className="h-5 w-5 text-blue-500" />
                                    </div>
                                    Profile Information
                                </CardTitle>
                                <CardDescription>
                                    Update your account's profile information
                                    and email address
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form
                                    onSubmit={handleUpdateProfile}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="name"
                                            className="text-base"
                                        >
                                            Full Name
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData('name', e.target.value)
                                            }
                                            error={errors.name}
                                            className="h-11"
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="email"
                                            className="text-base"
                                        >
                                            Email Address
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) =>
                                                setData('email', e.target.value)
                                            }
                                            error={errors.email}
                                            className="h-11"
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-destructive">
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                                    >
                                        {processing
                                            ? 'Updating...'
                                            : 'Save Changes'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Account Statistics */}
                        <Card className="border-2 transition-colors hover:border-purple-500/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-2xl">
                                    <div className="rounded-lg bg-purple-500/10 p-2">
                                        <TrendingUp className="h-5 w-5 text-purple-500" />
                                    </div>
                                    Account Statistics
                                </CardTitle>
                                <CardDescription>
                                    Overview of your activity and achievements
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6 sm:grid-cols-3">
                                    <div className="relative overflow-hidden rounded-xl border-2 border-blue-500/20 bg-gradient-to-br from-blue-50 to-blue-100 p-6 transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 dark:from-blue-950 dark:to-blue-900">
                                        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-24 w-24 rounded-full bg-blue-500/10"></div>
                                        <p className="mb-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                                            Total Boards
                                        </p>
                                        <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                                            {statistics.totalBoards}
                                        </p>
                                    </div>
                                    <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/20 bg-gradient-to-br from-purple-50 to-purple-100 p-6 transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 dark:from-purple-950 dark:to-purple-900">
                                        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-24 w-24 rounded-full bg-purple-500/10"></div>
                                        <p className="mb-2 text-sm font-medium text-purple-700 dark:text-purple-300">
                                            Total Cards
                                        </p>
                                        <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                                            {statistics.totalCards}
                                        </p>
                                    </div>
                                    <div className="relative overflow-hidden rounded-xl border-2 border-green-500/20 bg-gradient-to-br from-green-50 to-green-100 p-6 transition-all hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/20 dark:from-green-950 dark:to-green-900">
                                        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-24 w-24 rounded-full bg-green-500/10"></div>
                                        <p className="mb-2 text-sm font-medium text-green-700 dark:text-green-300">
                                            Completed
                                        </p>
                                        <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                                            {statistics.completedTasks}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security" className="mt-6 space-y-6">
                        <Card className="border-2 transition-colors hover:border-purple-500/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-2xl">
                                    <div className="rounded-lg bg-purple-500/10 p-2">
                                        <Key className="h-5 w-5 text-purple-500" />
                                    </div>
                                    Change Password
                                </CardTitle>
                                <CardDescription>
                                    Ensure your account is using a long, random
                                    password to stay secure
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form
                                    onSubmit={handleUpdatePassword}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="current_password"
                                            className="text-base"
                                        >
                                            Current Password
                                        </Label>
                                        <Input
                                            id="current_password"
                                            type="password"
                                            value={
                                                passwordData.current_password
                                            }
                                            onChange={(e) =>
                                                setPasswordData(
                                                    'current_password',
                                                    e.target.value,
                                                )
                                            }
                                            error={
                                                passwordErrors.current_password
                                            }
                                            className="h-11"
                                        />
                                        {passwordErrors.current_password && (
                                            <p className="text-sm text-destructive">
                                                {
                                                    passwordErrors.current_password
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="password"
                                            className="text-base"
                                        >
                                            New Password
                                        </Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={passwordData.password}
                                            onChange={(e) =>
                                                setPasswordData(
                                                    'password',
                                                    e.target.value,
                                                )
                                            }
                                            error={passwordErrors.password}
                                            className="h-11"
                                        />
                                        {passwordErrors.password && (
                                            <p className="text-sm text-destructive">
                                                {passwordErrors.password}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="password_confirmation"
                                            className="text-base"
                                        >
                                            Confirm New Password
                                        </Label>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            value={
                                                passwordData.password_confirmation
                                            }
                                            onChange={(e) =>
                                                setPasswordData(
                                                    'password_confirmation',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-11"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={processingPassword}
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                    >
                                        {processingPassword
                                            ? 'Updating...'
                                            : 'Update Password'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Two-Factor Authentication */}
                        <Card className="border-2 transition-colors hover:border-pink-500/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-2xl">
                                    <div className="rounded-lg bg-pink-500/10 p-2">
                                        <Shield className="h-5 w-5 text-pink-500" />
                                    </div>
                                    Two-Factor Authentication
                                </CardTitle>
                                <CardDescription>
                                    Add an extra layer of security to your
                                    account
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {twoFactorEnabled ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
                                            <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            <div className="flex-1">
                                                <p className="font-medium text-green-900 dark:text-green-100">
                                                    Two-Factor Authentication is
                                                    Enabled
                                                </p>
                                                <p className="text-sm text-green-700 dark:text-green-300">
                                                    Your account is protected
                                                    with 2FA
                                                </p>
                                            </div>
                                            <Badge
                                                variant="default"
                                                className="bg-green-600"
                                            >
                                                Active
                                            </Badge>
                                        </div>

                                        <TwoFactorRecoveryCodes
                                            recoveryCodesList={
                                                recoveryCodesList
                                            }
                                            fetchRecoveryCodes={
                                                fetchRecoveryCodes
                                            }
                                            errors={twoFactorErrors}
                                        />

                                        <Form {...disableTwoFactor.form()}>
                                            {({ processing }) => (
                                                <Button
                                                    variant="destructive"
                                                    type="submit"
                                                    disabled={processing}
                                                >
                                                    <ShieldBan className="mr-2 h-4 w-4" />
                                                    Disable Two-Factor
                                                    Authentication
                                                </Button>
                                            )}
                                        </Form>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
                                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                            <div className="flex-1">
                                                <p className="font-medium text-amber-900 dark:text-amber-100">
                                                    Two-Factor Authentication is
                                                    Disabled
                                                </p>
                                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                                    Enable 2FA to better protect
                                                    your account
                                                </p>
                                            </div>
                                            <Badge variant="destructive">
                                                Inactive
                                            </Badge>
                                        </div>

                                        {hasSetupData ? (
                                            <Button
                                                onClick={() =>
                                                    setShowSetupModal(true)
                                                }
                                                className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
                                            >
                                                <ShieldCheck className="mr-2 h-4 w-4" />
                                                Continue Setup
                                            </Button>
                                        ) : (
                                            <Form
                                                {...enableTwoFactor.form()}
                                                onSuccess={() =>
                                                    setShowSetupModal(true)
                                                }
                                            >
                                                {({ processing }) => (
                                                    <Button
                                                        type="submit"
                                                        disabled={processing}
                                                        className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
                                                    >
                                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                                        Enable Two-Factor
                                                        Authentication
                                                    </Button>
                                                )}
                                            </Form>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Separator className="my-8" />

                        {/* Delete Account */}
                        <DeleteUser />
                    </TabsContent>

                    {/* Appearance Tab */}
                    <TabsContent value="appearance" className="mt-6 space-y-6">
                        <Card className="border-2 transition-colors hover:border-pink-500/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-2xl">
                                    <div className="rounded-lg bg-pink-500/10 p-2">
                                        <Palette className="h-5 w-5 text-pink-500" />
                                    </div>
                                    Appearance Settings
                                </CardTitle>
                                <CardDescription>
                                    Customize how the application looks and
                                    feels
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="mb-2 text-lg font-semibold">
                                            Theme Preference
                                        </h3>
                                        <p className="mb-4 text-sm text-muted-foreground">
                                            Select your preferred theme for the
                                            application
                                        </p>
                                        <AppearanceToggleTab />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Activity Tab */}
                    <TabsContent value="activity" className="mt-6 space-y-6">
                        <ActivityHistory />
                    </TabsContent>
                </Tabs>
            </div>

            <TwoFactorSetupModal
                isOpen={showSetupModal}
                onClose={() => setShowSetupModal(false)}
                requiresConfirmation={requiresConfirmation}
                twoFactorEnabled={twoFactorEnabled}
                qrCodeSvg={qrCodeSvg}
                manualSetupKey={manualSetupKey}
                clearSetupData={clearSetupData}
                fetchSetupData={fetchSetupData}
                errors={twoFactorErrors}
            />
        </AppLayout>
    );
}
