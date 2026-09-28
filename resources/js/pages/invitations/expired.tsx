import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Head } from '@inertiajs/react';
import { AlertCircle } from 'lucide-react';

interface InvitationExpiredProps {
    board: {
        id: number;
        title: string;
    };
}

export default function InvitationExpired({ board }: InvitationExpiredProps) {
    return (
        <>
            <Head title="Invitation Expired" />

            <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <CardTitle className="text-2xl">
                            Invitation Expired
                        </CardTitle>
                        <CardDescription className="text-base">
                            This invitation to join{' '}
                            <span className="font-semibold">{board.title}</span>{' '}
                            has expired
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 text-center">
                        <p className="text-sm text-muted-foreground">
                            Please contact the board administrator to request a
                            new invitation.
                        </p>

                        <Button
                            onClick={() => (window.location.href = '/')}
                            className="w-full"
                        >
                            Go to Homepage
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
