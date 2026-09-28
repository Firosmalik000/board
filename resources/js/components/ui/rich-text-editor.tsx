import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Underline as UnderlineIcon,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'
import { useState, useMemo, useRef, useEffect } from 'react'
import { Input } from './input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
  onPasteFile?: (file: File, editor: any) => void | Promise<void>
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Write something...',
  editable = true,
  className,
  onPasteFile,
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('')
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<any>(null)

  // Memoize extensions to prevent re-creation on every render
  const extensions = useMemo(() => [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-primary underline cursor-pointer',
      },
    }),
    Image.configure({
      inline: false,
      allowBase64: true,
      HTMLAttributes: {
        class: 'rounded-lg max-w-full my-3 border border-border shadow-xs hover:shadow-md transition-shadow object-contain max-h-[480px]',
      },
    }),
    Placeholder.configure({
      placeholder,
    }),
  ], [placeholder])

  const editor = useEditor({
    extensions,
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[150px] px-3 py-2',
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
              const file = items[i].getAsFile()
              if (file && onPasteFile) {
                event.preventDefault()
                if (editorRef.current) {
                  onPasteFile(file, editorRef.current)
                }
                return true
              }
            }
          }
        }
        return false
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0]
          if (file && onPasteFile) {
            event.preventDefault()
            if (editorRef.current) {
              onPasteFile(file, editorRef.current)
            }
            return true
          }
        }
        return false
      },
    },
  })

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  if (!editor) {
    return null
  }

  const setLink = () => {
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
    setLinkUrl('')
    setIsLinkPopoverOpen(false)
  }

  const ToolbarButton = ({
    onClick,
    isActive,
    disabled,
    children,
    title
  }: {
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
    children: React.ReactNode
    title: string
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-8 w-8 p-0',
        isActive && 'bg-muted'
      )}
      title={title}
    >
      {children}
    </Button>
  )

  if (!editable) {
    return (
      <div className={cn('prose prose-sm max-w-none', className)}>
        <EditorContent editor={editor} />
      </div>
    )
  }

  return (
    <div className={cn('border rounded-md', className)}>
      {/* Toolbar */}
      <div className="border-b bg-muted/30 p-1 flex flex-wrap gap-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border self-center mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border self-center mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border self-center mx-1" />

        <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 w-8 p-0',
                editor.isActive('link') && 'bg-muted'
              )}
              title="Add Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Add Link</h4>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      setLink()
                    }
                  }}
                />
                <Button onClick={setLink} size="sm">
                  Add
                </Button>
              </div>
              {editor.isActive('link') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    editor.chain().focus().unsetLink().run()
                    setIsLinkPopoverOpen(false)
                  }}
                  className="w-full"
                >
                  Remove Link
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {onPasteFile && (
          <>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  onPasteFile(file, editor)
                }
                if (imageInputRef.current) {
                  imageInputRef.current.value = ''
                }
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => imageInputRef.current?.click()}
              title="Sisipkan Gambar (atau tekan Ctrl+V)"
            >
              <ImageIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Button>
          </>
        )}

        <div className="w-px h-6 bg-border self-center mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Clipboard Paste Hint Footer */}
      <div className="border-t bg-muted/20 px-3 py-1 flex items-center justify-between text-[11px] text-muted-foreground/70 select-none">
        <span>Tekan <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono border">Ctrl+V</kbd> untuk menempelkan gambar/file langsung dari clipboard</span>
        <span className="hidden sm:inline">Mendukung drag & drop</span>
      </div>
    </div>
  )
}
