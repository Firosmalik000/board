import { create } from 'zustand'

interface User {
  id: number
  name: string
  email: string
}

interface Board {
  id: number
  title: string
  description?: string
  visibility: 'private' | 'team' | 'public'
  background_color: string
  owner_id: number
  lists?: List[]
  members?: User[]
  labels?: Label[]
}

interface List {
  id: number
  board_id: number
  title: string
  category_key?: string | null
  position: number
  cards?: Card[]
}

interface Card {
  id: number
  list_id: number
  title: string
  description?: string
  position: number
  due_date?: string
  is_completed: boolean
  cover_color?: string
  labels?: Label[]
  members?: User[]
  creator?: User
}

interface Label {
  id: number
  board_id: number
  name: string
  color: string
}

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  setUser: (user: User) => void
}

interface BoardStore {
  boards: Board[]
  currentBoard: Board | null
  setBoards: (boards: Board[]) => void
  setCurrentBoard: (board: Board | null) => void
  addBoard: (board: Board) => void
  updateBoard: (boardId: number, updates: Partial<Board>) => void
  deleteBoard: (boardId: number) => void
}

interface CardStore {
  moveCard: (cardId: number, sourceListId: number, destListId: number, sourceIndex: number, destIndex: number) => void
  addCard: (listId: number, card: Card) => void
  updateCard: (cardId: number, updates: Partial<Card>) => void
  deleteCard: (cardId: number) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null,
  token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('auth_token') : false,

  login: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('auth_token', token)
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('auth_token')
    set({ user: null, token: null, isAuthenticated: false })
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },
}))

export const useBoardStore = create<BoardStore>((set) => ({
  boards: [],
  currentBoard: null,

  setBoards: (boards) => set({ boards }),

  setCurrentBoard: (board) => set({ currentBoard: board }),

  addBoard: (board) =>
    set((state) => ({
      boards: [board, ...state.boards],
    })),

  updateBoard: (boardId, updates) =>
    set((state) => ({
      boards: state.boards.map((b) => (b.id === boardId ? { ...b, ...updates } : b)),
      currentBoard:
        state.currentBoard?.id === boardId ? { ...state.currentBoard, ...updates } : state.currentBoard,
    })),

  deleteBoard: (boardId) =>
    set((state) => ({
      boards: state.boards.filter((b) => b.id !== boardId),
      currentBoard: state.currentBoard?.id === boardId ? null : state.currentBoard,
    })),
}))

export const useCardStore = create<CardStore>((set) => ({
  moveCard: (cardId, sourceListId, destListId, sourceIndex, destIndex) => {
    // This will be handled by the API and then the board will be refetched
    console.log('Moving card', { cardId, sourceListId, destListId, sourceIndex, destIndex })
  },

  addCard: (listId, card) => {
    console.log('Adding card to list', listId, card)
  },

  updateCard: (cardId, updates) => {
    console.log('Updating card', cardId, updates)
  },

  deleteCard: (cardId) => {
    console.log('Deleting card', cardId)
  },
}))

export type { User, Board, List, Card, Label }
