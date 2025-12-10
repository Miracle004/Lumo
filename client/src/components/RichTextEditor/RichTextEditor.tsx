import React, { useCallback, useRef } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import axios from 'axios';
import { uploadImage } from '../../services/uploadService';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Unlink
} from 'lucide-react';
import './RichTextEditor.css';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  readOnly?: boolean;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) {
    return null;
  }

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadImage(file);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
        // Reset input value so same file can be selected again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  };

  return (
    <div className="editor-toolbar">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        style={{ display: 'none' }} 
        accept="image/*"
      />
      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
          title="Bold"
        >
          <Bold size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
          title="Italic"
        >
          <Italic size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'is-active' : ''}
          title="Underline"
        >
          <UnderlineIcon size={18} />
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
          title="Heading 1"
        >
          <Heading1 size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
          title="Heading 2"
        >
          <Heading2 size={18} />
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'is-active' : ''}
          title="Bullet List"
        >
          <List size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'is-active' : ''}
          title="Ordered List"
        >
          <ListOrdered size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'is-active' : ''}
          title="Blockquote"
        >
          <Quote size={18} />
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          type="button"
          onClick={setLink}
          className={editor.isActive('link') ? 'is-active' : ''}
          title="Add Link"
        >
          <LinkIcon size={18} />
        </button>
        {editor.isActive('link') && (
            <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove Link"
            >
            <Unlink size={18} />
            </button>
        )}
        <button
          type="button"
          onClick={addImage}
          title="Add Image"
        >
          <ImageIcon size={18} />
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          title="Undo"
        >
          <Undo size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          title="Redo"
        >
          <Redo size={18} />
        </button>
      </div>
    </div>
  );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, placeholder, editable = true }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write something amazing...',
      }),
    ],
    content: content,
    editable: editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
        attributes: {
            class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
        },
    },
  });

  return (
    <div className="rich-text-editor">
      {editable && <MenuBar editor={editor} />}
      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
};

export default RichTextEditor;
