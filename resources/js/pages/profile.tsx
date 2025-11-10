import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Head, useForm, router } from '@inertiajs/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User as UserIcon, Mail, Key, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { useRef } from 'react'

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Profile',
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
}

export default function Profile({ user, statistics }: ProfileProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const { data, setData, put, processing, errors } = useForm({
    name: user.name,
    email: user.email,
  })

  const { data: passwordData, setData: setPasswordData, put: updatePassword, processing: processingPassword, errors: passwordErrors, reset } = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  })

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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (2MB)
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
      <Head title="Profile" />

      <div className="flex h-full flex-1 flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Avatar className="h-20 w-20">
              {user.avatar && (
                <AvatarImage src={`/storage/${user.avatar}`} alt={user.name} />
              )}
              <AvatarFallback className="text-2xl">
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
                className="h-8 w-8 p-0 text-white hover:text-white hover:bg-white/20"
                onClick={() => avatarInputRef.current?.click()}
                title="Upload avatar"
              >
                <Upload className="h-4 w-4" />
              </Button>
              {user.avatar && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-white hover:text-white hover:bg-white/20"
                  onClick={handleRemoveAvatar}
                  title="Remove avatar"
                >
                  <X className="h-4 w-4" />
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
          <div>
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">{user.email}</p>
            <p className="text-sm text-muted-foreground">
              Member since {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your account's profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    error={errors.name}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <Button type="submit" disabled={processing}>
                  {processing ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Update Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Update Password
              </CardTitle>
              <CardDescription>
                Ensure your account is using a long, random password to stay secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input
                    id="current_password"
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData('current_password', e.target.value)}
                    error={passwordErrors.current_password}
                  />
                  {passwordErrors.current_password && (
                    <p className="text-sm text-destructive">{passwordErrors.current_password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={passwordData.password}
                    onChange={(e) => setPasswordData('password', e.target.value)}
                    error={passwordErrors.password}
                  />
                  {passwordErrors.password && (
                    <p className="text-sm text-destructive">{passwordErrors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password_confirmation">Confirm Password</Label>
                  <Input
                    id="password_confirmation"
                    type="password"
                    value={passwordData.password_confirmation}
                    onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                  />
                </div>

                <Button type="submit" disabled={processingPassword}>
                  {processingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Stats */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Account Statistics</CardTitle>
              <CardDescription>Overview of your account activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Total Boards</p>
                  <p className="text-2xl font-bold">{statistics.totalBoards}</p>
                </div>
                <div className="space-y-2 rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Total Cards</p>
                  <p className="text-2xl font-bold">{statistics.totalCards}</p>
                </div>
                <div className="space-y-2 rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Completed Tasks</p>
                  <p className="text-2xl font-bold">{statistics.completedTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
