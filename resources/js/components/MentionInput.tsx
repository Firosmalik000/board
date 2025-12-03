import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent, useMemo, memo } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Member {
  id: number
  name: string
  email: string
  avatar: string | null
  username: string
}

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  members: Member[]
  placeholder?: string
  className?: string
  multiline?: boolean
  rows?: number
}

export const MentionInput = memo(function MentionInput({
  value,
  onChange,
  members,
  placeholder = 'Type @ to mention someone...',
  className = '',
  multiline = false,
  rows = 3,
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionQuery, setMentionQuery] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null)

  // Detect @ mentions and show suggestions (with debouncing for performance)
  useEffect(() => {
    // Debounce the search for better performance
    const timer = setTimeout(() => {
      const text = value.substring(0, cursorPosition)
      const lastAtIndex = text.lastIndexOf('@')

      if (lastAtIndex !== -1) {
        const textAfterAt = text.substring(lastAtIndex + 1)
        const hasSpace = textAfterAt.includes(' ')

        if (!hasSpace && textAfterAt.length <= 50) { // Limit search length
          setMentionQuery(textAfterAt.toLowerCase())
          const searchTerm = textAfterAt.toLowerCase()

          // Optimized filter with early exit
          const filtered = members.filter((member) => {
            const nameLower = member.name.toLowerCase()
            const usernameLower = member.username.toLowerCase()
            return nameLower.includes(searchTerm) || usernameLower.includes(searchTerm)
          }).slice(0, 10) // Limit to 10 results for performance

          setFilteredMembers(filtered)
          setShowSuggestions(filtered.length > 0)
          setSelectedIndex(0)
        } else {
          setShowSuggestions(false)
        }
      } else {
        setShowSuggestions(false)
      }
    }, 150) // 150ms debounce

    return () => clearTimeout(timer)
  }, [value, cursorPosition, members])

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const newValue = e.target.value
    const newCursor = e.target.selectionStart || 0
    onChange(newValue)
    setCursorPosition(newCursor)
  }

  const insertMention = (member: Member) => {
    const text = value
    const beforeCursor = text.substring(0, cursorPosition)
    const afterCursor = text.substring(cursorPosition)
    const lastAtIndex = beforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      const beforeAt = beforeCursor.substring(0, lastAtIndex)
      const mentionText = member.name.includes(' ') ? `@"${member.name}"` : `@${member.username}`
      const newValue = beforeAt + mentionText + ' ' + afterCursor
      const newCursorPos = beforeAt.length + mentionText.length + 1

      onChange(newValue)
      setShowSuggestions(false)

      // Set cursor position after mention
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
          setCursorPosition(newCursorPos)
        }
      }, 0)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (!showSuggestions) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev < filteredMembers.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
        break
      case 'Enter':
        if (showSuggestions && filteredMembers[selectedIndex]) {
          e.preventDefault()
          insertMention(filteredMembers[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowSuggestions(false)
        break
      case 'Tab':
        if (showSuggestions && filteredMembers[selectedIndex]) {
          e.preventDefault()
          insertMention(filteredMembers[selectedIndex])
        }
        break
    }
  }

  // Memoize getInitials to avoid recalculation
  const getInitials = useMemo(() => {
    return (name: string) => {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
  }, [])

  return (
    <div className="relative w-full">
      {multiline ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        />
      )}

      {showSuggestions && filteredMembers.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredMembers.map((member, index) => (
            <MentionItem
              key={member.id}
              member={member}
              isSelected={index === selectedIndex}
              onClick={() => insertMention(member)}
              getInitials={getInitials}
            />
          ))}
        </div>
      )}
    </div>
  )
})

// Memoized mention item to prevent unnecessary re-renders
const MentionItem = memo(function MentionItem({
  member,
  isSelected,
  onClick,
  getInitials,
}: {
  member: Member
  isSelected: boolean
  onClick: () => void
  getInitials: (name: string) => string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 transition-colors ${
        isSelected ? 'bg-blue-50' : ''
      }`}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={member.avatar || undefined} alt={member.name} />
        <AvatarFallback className="text-xs">{getInitials(member.name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
        <p className="text-xs text-gray-500 truncate">@{member.username}</p>
      </div>
    </button>
  )
})
