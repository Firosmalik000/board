import { Head, useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Mail, User as UserIcon, Lock } from 'lucide-react'
import { toast } from 'sonner'

interface InvitationAcceptProps {
  invitation: {
    token: string
    email: string
    board: {
      id: number
      title: string
      description?: string
    }
    inviter: {
      name: string
    }
    expires_at: string
  }
  userExists: boolean
}

export default function AcceptInvitation({ invitation, userExists }: InvitationAcceptProps) {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    password: '',
    password_confirmation: '',
  })

  const handleAcceptExisting = () => {
    post(`/invitations/${invitation.token}/accept`, {
      onSuccess: () => {
        toast.success('Successfully joined the board!')
      },
      onError: () => {
        toast.error('Failed to accept invitation')
      },
    })
  }

  const handleAcceptAndRegister = (e: React.FormEvent) => {
    e.preventDefault()

    post(`/invitations/${invitation.token}/register`, {
      onSuccess: () => {
        toast.success('Account created! Welcome to the board!')
      },
      onError: (errors) => {
        toast.error(errors.name || errors.password || 'Failed to create account')
      },
    })
  }

  return (
    <>
      <Head title="Accept Invitation" />

      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">You're Invited!</CardTitle>
            <CardDescription className="text-base">
              <span className="font-semibold">{invitation.inviter.name}</span> has invited you to join
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Board Info */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <h3 className="text-lg font-semibold">{invitation.board.title}</h3>
              {invitation.board.description && (
                <p className="mt-1 text-sm text-muted-foreground">{invitation.board.description}</p>
              )}
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Invited email: {invitation.email}</span>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Expires on: {invitation.expires_at}
              </div>
            </div>

            {/* Accept Options */}
            {userExists ? (
              // Existing user - just accept
              <div className="space-y-4">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">You already have an account</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Please log in to accept this invitation
                      </p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleAcceptExisting} className="w-full" size="lg" disabled={processing}>
                  {processing ? 'Accepting...' : 'Log In & Accept Invitation'}
                </Button>
              </div>
            ) : (
              // New user - register and accept
              <div className="space-y-4">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-start gap-3">
                    <UserIcon className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Create your account</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Fill in the details below to join the board
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleAcceptAndRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      error={errors.name}
                      icon={<UserIcon className="h-4 w-4" />}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={data.password}
                      onChange={(e) => setData('password', e.target.value)}
                      error={errors.password}
                      icon={<Lock className="h-4 w-4" />}
                    />
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Confirm Password</Label>
                    <Input
                      id="password_confirmation"
                      type="password"
                      placeholder="••••••••"
                      value={data.password_confirmation}
                      onChange={(e) => setData('password_confirmation', e.target.value)}
                      icon={<Lock className="h-4 w-4" />}
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={processing}>
                    {processing ? 'Creating Account...' : 'Create Account & Accept Invitation'}
                  </Button>
                </form>
              </div>
            )}

            <p className="text-center text-xs text-muted-foreground">
              By accepting this invitation, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
