import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Head, useForm, router } from '@inertiajs/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User as UserIcon, Mail, Key, Upload, X, Shield, Palette, Activity as ActivityIcon, TrendingUp, AlertTriangle } from 'lucide-react'
import ActivityHistory from '@/components/profile/activity-history'
import { toast } from 'sonner'
import { useRef, useState } from 'react'
import AppearanceToggleTab from '@/components/shared/common/appearance-tabs'
import { Badge } from '@/components/ui/badge'
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth'
import TwoFactorSetupModal from '@/components/shared/auth/two-factor-setup-modal'
import TwoFactorRecoveryCodes from '@/components/shared/auth/two-factor-recovery-codes'
import { Form } from '@inertiajs/react'
import { disable as disableTwoFactor, enable as enableTwoFactor } from '@/routes/two-factor'
import { ShieldBan, ShieldCheck } from 'lucide-react'
import DeleteUser from '@/components/shared/auth/delete-user'
import { Separator } from '@/components/ui/separator'

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Profile & Settings',
    href: '/user/profile',
  },
]

interface User {
  id: number
  name: string
  email: string
  avatar?: string
  created_at: string
}

interface Statistics {
  totalBoards: number
  totalCards: number
  completedTasks: number
}

interface ProfileProps {
  user: User
  statistics: Statistics
  requiresConfirmation?: boolean
  twoFactorEnabled?: boolean
}

export default function Profile({ user, statistics, requiresConfirmation = false, twoFactorEnabled = false }: ProfileProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const { data, setData, put, processing, errors } = useForm({
    name: user.name,
    email: user.email,
  })

  const { data: passwordData, setData: setPasswordData, put: updatePassword, processing: processingPassword, errors: passwordErrors, reset } = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  })

  const {
    qrCodeSvg,
    hasSetupData,
    manualSetupKey,
    clearSetupData,
    fetchSetupData,
    recoveryCodesList,
    fetchRecoveryCodes,
    errors: twoFactorErrors,
  } = useTwoFactorAuth()

  const [showSetupModal, setShowSetupModal] = useState<boolean>(false)

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault()
    put('/user/profile', {
      onSuccess: () => {
        toast.success('Profile updated successfully')
      },
      onError: () => {
        toast.error('Failed to update profile')
      },
    })
  }

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault()
    updatePassword('/user/profile/password', {
      onSuccess: () => {
        toast.success('Password updated successfully')
        reset()
      },
      onError: () => {
        toast.error('Failed to update password')
      },
    })
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB')
      return
    }

    const formData = new FormData()
    formData.append('avatar', file)

    router.post('/user/profile/avatar', formData, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Avatar updated successfully')
        if (avatarInputRef.current) {
          avatarInputRef.current.value = ''
        }
      },
      onError: () => {
        toast.error('Failed to upload avatar')
      },
    })
  }

  const handleRemoveAvatar = () => {
    if (!confirm('Are you sure you want to remove your avatar?')) return

    router.delete('/user/profile/avatar', {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Avatar removed successfully')
      },
      onError: () => {
        toast.error('Failed to remove avatar')
      },
    })
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Profile & Settings" />

      <div className="flex h-full flex-1 flex-col gap-8 p-6 max-w-7xl mx-auto">
        {/* Beautiful Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-1">
          <div className="rounded-xl bg-background p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                <Avatar className="relative h-28 w-28 border-4 border-background shadow-xl">
                  {user.avatar && (
                    <AvatarImage src={`/storage/${user.avatar}`} alt={user.name} />
                  )}
                  <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-10 w-10 p-0 text-white hover:text-white hover:bg-white/20 rounded-full"
                    onClick={() => avatarInputRef.current?.click()}
                    title="Upload avatar"
                  >
                    <Upload className="h-5 w-5" />
                  </Button>
                  {user.avatar && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-10 w-10 p-0 text-white hover:text-white hover:bg-white/20 rounded-full"
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
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {user.name}
                </h1>
                <p className="text-muted-foreground flex items-center gap-2 justify-center md:justify-start mb-2">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {statistics.totalBoards}
                  </div>
                  <div className="text-xs text-muted-foreground">Boards</div>
                </div>
                <div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {statistics.totalCards}
                  </div>
                  <div className="text-xs text-muted-foreground">Cards</div>
                </div>
                <div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                    {statistics.completedTasks}
                  </div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid h-auto p-1 bg-muted/50">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              <UserIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-red-500 data-[state=active]:text-white">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <Card className="border-2 hover:border-blue-500/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <UserIcon className="h-5 w-5 text-blue-500" />
                  </div>
                  Profile Information
                </CardTitle>
                <CardDescription>Update your account's profile information and email address</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      error={errors.name}
                      className="h-11"
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={data.email}
                      onChange={(e) => setData('email', e.target.value)}
                      error={errors.email}
                      className="h-11"
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <Button
                    type="submit"
                    disabled={processing}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    {processing ? 'Updating...' : 'Save Changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Account Statistics */}
            <Card className="border-2 hover:border-purple-500/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                  </div>
                  Account Statistics
                </CardTitle>
                <CardDescription>Overview of your activity and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="relative overflow-hidden rounded-xl border-2 border-blue-500/20 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-6 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/20">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-12 -mt-12"></div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">Total Boards</p>
                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{statistics.totalBoards}</p>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/20 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-6 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/20">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full -mr-12 -mt-12"></div>
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">Total Cards</p>
                    <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">{statistics.totalCards}</p>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border-2 border-green-500/20 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-6 hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/20">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -mr-12 -mt-12"></div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">Completed</p>
                    <p className="text-4xl font-bold text-green-600 dark:text-green-400">{statistics.completedTasks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6 mt-6">
            <Card className="border-2 hover:border-purple-500/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Key className="h-5 w-5 text-purple-500" />
                  </div>
                  Change Password
                </CardTitle>
                <CardDescription>
                  Ensure your account is using a long, random password to stay secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="current_password" className="text-base">Current Password</Label>
                    <Input
                      id="current_password"
                      type="password"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData('current_password', e.target.value)}
                      error={passwordErrors.current_password}
                      className="h-11"
                    />
                    {passwordErrors.current_password && (
                      <p className="text-sm text-destructive">{passwordErrors.current_password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-base">New Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={passwordData.password}
                      onChange={(e) => setPasswordData('password', e.target.value)}
                      error={passwordErrors.password}
                      className="h-11"
                    />
                    {passwordErrors.password && (
                      <p className="text-sm text-destructive">{passwordErrors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password_confirmation" className="text-base">Confirm New Password</Label>
                    <Input
                      id="password_confirmation"
                      type="password"
                      value={passwordData.password_confirmation}
                      onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={processingPassword}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {processingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card className="border-2 hover:border-pink-500/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <div className="p-2 rounded-lg bg-pink-500/10">
                    <Shield className="h-5 w-5 text-pink-500" />
                  </div>
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {twoFactorEnabled ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                      <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900 dark:text-green-100">Two-Factor Authentication is Enabled</p>
                        <p className="text-sm text-green-700 dark:text-green-300">Your account is protected with 2FA</p>
                      </div>
                      <Badge variant="default" className="bg-green-600">Active</Badge>
                    </div>

                    <TwoFactorRecoveryCodes
                      recoveryCodesList={recoveryCodesList}
                      fetchRecoveryCodes={fetchRecoveryCodes}
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
                          Disable Two-Factor Authentication
                        </Button>
                      )}
                    </Form>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <div className="flex-1">
                        <p className="font-medium text-amber-900 dark:text-amber-100">Two-Factor Authentication is Disabled</p>
                        <p className="text-sm text-amber-700 dark:text-amber-300">Enable 2FA to better protect your account</p>
                      </div>
                      <Badge variant="destructive">Inactive</Badge>
                    </div>

                    {hasSetupData ? (
                      <Button
                        onClick={() => setShowSetupModal(true)}
                        className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Continue Setup
                      </Button>
                    ) : (
                      <Form
                        {...enableTwoFactor.form()}
                        onSuccess={() => setShowSetupModal(true)}
                      >
                        {({ processing }) => (
                          <Button
                            type="submit"
                            disabled={processing}
                            className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
                          >
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Enable Two-Factor Authentication
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
          <TabsContent value="appearance" className="space-y-6 mt-6">
            <Card className="border-2 hover:border-pink-500/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <div className="p-2 rounded-lg bg-pink-500/10">
                    <Palette className="h-5 w-5 text-pink-500" />
                  </div>
                  Appearance Settings
                </CardTitle>
                <CardDescription>Customize how the application looks and feels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Theme Preference</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select your preferred theme for the application
                    </p>
                    <AppearanceToggleTab />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6 mt-6">
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
  )
}
