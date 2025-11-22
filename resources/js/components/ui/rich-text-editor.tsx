'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Heading } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function RichTextEditor({ value, onChange, placeholder, disabled }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: placeholder || 'Start typing...',
            }),
        ],
        content: value,
        editable: !disabled,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Update editor content when value changes externally
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    // Update editable state when disabled changes
    useEffect(() => {
        if (editor) {
            editor.setEditable(!disabled);
        }
    }, [disabled, editor]);

    if (!editor) {
        return null;
    }

    const getCurrentHeading = () => {
        if (editor.isActive('heading', { level: 1 })) return 'H1';
        if (editor.isActive('heading', { level: 2 })) return 'H2';
        if (editor.isActive('heading', { level: 3 })) return 'H3';
        if (editor.isActive('heading', { level: 4 })) return 'H4';
        if (editor.isActive('heading', { level: 5 })) return 'H5';
        if (editor.isActive('heading', { level: 6 })) return 'H6';
        return 'Normal';
    };

    return (
        <div className="border rounded-md">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={disabled}
                    className={`p-2 rounded hover:bg-muted ${editor.isActive('bold') ? 'bg-muted' : ''
                        } disabled:opacity-50`}
                    title="Bold"
                >
                    <Bold className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={disabled}
                    className={`p-2 rounded hover:bg-muted ${editor.isActive('italic') ? 'bg-muted' : ''
                        } disabled:opacity-50`}
                    title="Italic"
                >
                    <Italic className="h-4 w-4" />
                </button>
                <div className="w-px h-6 bg-border mx-1" />

                {/* Heading Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={disabled}
                            className="h-8 px-2 text-xs font-medium"
                        >
                            <Heading className="h-4 w-4 mr-1" />
                            {getCurrentHeading()}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem
                            onClick={() => editor.chain().focus().setParagraph().run()}
                            className={editor.isActive('paragraph') ? 'bg-muted' : ''}
                        >
                            Normal text
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
                        >
                            <span className="text-2xl font-bold">Heading 1</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
                        >
                            <span className="text-xl font-bold">Heading 2</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                            className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}
                        >
                            <span className="text-lg font-bold">Heading 3</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                            className={editor.isActive('heading', { level: 4 }) ? 'bg-muted' : ''}
                        >
                            <span className="text-base font-bold">Heading 4</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
                            className={editor.isActive('heading', { level: 5 }) ? 'bg-muted' : ''}
                        >
                            <span className="text-sm font-bold">Heading 5</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
                            className={editor.isActive('heading', { level: 6 }) ? 'bg-muted' : ''}
                        >
                            <span className="text-xs font-bold">Heading 6</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="w-px h-6 bg-border mx-1" />
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    disabled={disabled}
                    className={`p-2 rounded hover:bg-muted ${editor.isActive('bulletList') ? 'bg-muted' : ''
                        } disabled:opacity-50`}
                    title="Bullet List"
                >
                    <List className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    disabled={disabled}
                    className={`p-2 rounded hover:bg-muted ${editor.isActive('orderedList') ? 'bg-muted' : ''
                        } disabled:opacity-50`}
                    title="Numbered List"
                >
                    <ListOrdered className="h-4 w-4" />
                </button>
            </div>

            {/* Editor Content */}
            <EditorContent
                editor={editor}
                className="prose prose-sm max-w-none p-3 min-h-[150px] focus:outline-none [&_.ProseMirror]:outline-none"
            />
        </div>
    );
}
