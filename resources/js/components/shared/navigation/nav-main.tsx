import { useState } from 'react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage<SharedData>();
    const boards = page.props.boards || [];
    const [boardsOpen, setBoardsOpen] = useState(true);

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const isBoardsItem =
                        item.title.toLowerCase() === 'boards' ||
                        item.href === '/boards';

                    if (isBoardsItem) {
                        const isBoardsIndexActive = page.url === '/boards';
                        const hasBoards = boards.length > 0;

                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isBoardsIndexActive}
                                    tooltip={{ children: item.title }}
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>

                                {hasBoards && (
                                    <SidebarMenuAction
                                        aria-label="Toggle Boards Menu"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setBoardsOpen((prev) => !prev);
                                        }}
                                        className="transition-transform hover:bg-sidebar-accent"
                                    >
                                        <ChevronRight
                                            className={cn(
                                                'size-3.5 transition-transform duration-200 text-muted-foreground',
                                                boardsOpen && 'rotate-90',
                                            )}
                                        />
                                    </SidebarMenuAction>
                                )}

                                {hasBoards && boardsOpen && (
                                    <SidebarMenuSub className="my-1 max-h-60 overflow-y-auto space-y-0.5">
                                        {boards.map((board) => {
                                            const isBoardActive =
                                                page.url === `/boards/${board.id}` ||
                                                page.url.startsWith(
                                                    `/boards/${board.id}/`,
                                                );

                                            return (
                                                <SidebarMenuSubItem
                                                    key={board.id}
                                                >
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        size="sm"
                                                        isActive={isBoardActive}
                                                        className={cn(
                                                            'h-7 rounded-md transition-colors',
                                                            isBoardActive &&
                                                                'font-semibold text-primary bg-primary/10',
                                                        )}
                                                    >
                                                        <Link
                                                            href={`/boards/${board.id}`}
                                                            prefetch
                                                            className="flex items-center gap-2 group/board-link min-w-0"
                                                        >
                                                            <span
                                                                className="size-2 rounded-[2px] shrink-0 shadow-xs ring-1 ring-black/10 group-hover/board-link:scale-110 transition-transform"
                                                                style={{
                                                                    backgroundColor:
                                                                        board.background_color ||
                                                                        '#0079bf',
                                                                }}
                                                            />
                                                            <span className="truncate text-xs">
                                                                {board.title}
                                                            </span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            );
                                        })}
                                    </SidebarMenuSub>
                                )}
                            </SidebarMenuItem>
                        );
                    }

                    const isItemActive = page.url.startsWith(
                        typeof item.href === 'string'
                            ? item.href
                            : item.href.url,
                    );

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isItemActive}
                                tooltip={{ children: item.title }}
                            >
                                <Link href={item.href} prefetch>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
