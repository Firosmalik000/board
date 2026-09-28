import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Download, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

interface ImagePreviewModalProps {
    open: boolean;
    onClose: () => void;
    imageUrl: string | null;
    filename: string | null;
    zoom: number;
    rotation: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onRotate: () => void;
    onResetZoom: () => void;
    onZoomChange: (zoom: number) => void;
}

export function ImagePreviewModal({
    open,
    onClose,
    imageUrl,
    filename,
    zoom,
    rotation,
    onZoomIn,
    onZoomOut,
    onRotate,
    onResetZoom,
    onZoomChange,
}: ImagePreviewModalProps) {
    if (!imageUrl || !filename) return null;

    return (
        <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-6xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>{filename}</span>
                        <span className="text-sm font-normal text-muted-foreground">
                            {zoom}%
                        </span>
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Preview and manipulate image with zoom and rotation
                        controls
                    </DialogDescription>
                </DialogHeader>

                {/* Zoom Controls */}
                <div className="flex items-center justify-center gap-2 border-b pb-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onZoomOut}
                        disabled={zoom <= 25}
                    >
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <div className="flex min-w-[120px] items-center justify-center gap-2">
                        <input
                            type="range"
                            min="25"
                            max="300"
                            step="25"
                            value={zoom}
                            onChange={(e) =>
                                onZoomChange(Number(e.target.value))
                            }
                            className="w-full"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onZoomIn}
                        disabled={zoom >= 300}
                    >
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={onRotate}>
                        <RotateCw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={onResetZoom}>
                        Reset
                    </Button>
                </div>

                {/* Image Container */}
                <div className="relative flex max-h-[70vh] items-center justify-center overflow-auto rounded-lg bg-muted/50">
                    <img
                        src={imageUrl}
                        alt={filename}
                        style={{
                            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                            transition: 'transform 0.2s ease-in-out',
                            maxWidth: '100%',
                            height: 'auto',
                        }}
                        className="object-contain"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 border-t pt-4">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button asChild>
                        <a
                            href={imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </a>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
