import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

interface Props {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    rows?: number;
}

function toolbarBtn(active: boolean) {
    return `px-2 py-1 rounded text-xs font-medium transition-colors ${
        active
            ? 'bg-gray-200 text-gray-900'
            : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
    }`;
}

export default function RichTextEditor({ value, onChange, placeholder, rows = 4 }: Props) {
    const minHeight = `${rows * 1.5}rem`;

    const editor = useEditor({
        immediatelyRender: true,
        extensions: [StarterKit],
        content: value || '',
        editorProps: {
            attributes: {
                class: `rte-content px-3 py-2.5 text-sm text-gray-900 focus:outline-none`,
                style: `min-height: ${minHeight}`,
                ...(placeholder ? { 'data-placeholder': placeholder } : {}),
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange(html === '<p></p>' ? '' : html);
        },
    });

    useEffect(() => {
        if (!editor) return;
        const next = value || '';
        const normalizedCurrent = editor.getHTML() === '<p></p>' ? '' : editor.getHTML();
        if (next !== normalizedCurrent) {
            editor.commands.setContent(next || '');
        }
    }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-brand-500">
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
                <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
                    className={toolbarBtn(editor.isActive('bold'))}
                >
                    <strong>B</strong>
                </button>
                <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
                    className={toolbarBtn(editor.isActive('italic'))}
                >
                    <em>I</em>
                </button>
                <div className="w-px h-3.5 bg-gray-200 mx-1 shrink-0" />
                <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
                    className={toolbarBtn(editor.isActive('bulletList'))}
                >
                    • List
                </button>
                <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
                    className={toolbarBtn(editor.isActive('orderedList'))}
                >
                    1. List
                </button>
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}
