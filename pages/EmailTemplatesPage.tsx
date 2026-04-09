import React, { useState, useEffect, useRef } from 'react';
import { Mail, Edit, ImageOff, Upload } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { api } from '../services/api';
import { Button, Card, Input } from '../components/UIComponents';

interface EmailTemplate {
  _id: string;
  key: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  is_active: boolean;
  placeholders: string[];
  header_logo: string | null;
}

// ─── TipTap toolbar button ────────────────────────────────────────────────────

const ToolbarBtn: React.FC<{
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ active, onClick, title, children }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`px-2 py-1 text-xs rounded transition-colors ${
      active ? 'bg-primary text-white' : 'hover:bg-platinum text-primary'
    }`}
  >
    {children}
  </button>
);

// ─── Rich editor (TipTap) ─────────────────────────────────────────────────────

const RichEditor: React.FC<{
  content: string;
  onChange: (html: string) => void;
  placeholders: string[];
}> = ({ content, onChange, placeholders }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      prevContent.current = html;
      onChange(html);
    },
  });

  const prevContent = useRef(content);
  useEffect(() => {
    if (editor && content !== prevContent.current) {
      editor.commands.setContent(content);
      prevContent.current = content;
    }
  }, [content, editor]);

  if (!editor) return null;

  const insertPlaceholder = (p: string) => editor.commands.insertContent(`{{${p}}}`);

  return (
    <div className="flex flex-col gap-2">
      {/* Placeholder chips */}
      {placeholders.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-steel uppercase tracking-widest mb-1.5">
            Insert Placeholder
          </p>
          <div className="flex flex-wrap gap-1.5">
            {placeholders.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => insertPlaceholder(p)}
                className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors"
              >
                {`{{${p}}}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border border-border rounded-t-sm px-2 py-1.5 bg-platinum/40">
        <ToolbarBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
          <s>S</s>
        </ToolbarBtn>
        <span className="w-px h-4 bg-border mx-1" />
        <ToolbarBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading">
          H2
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Subheading">
          H3
        </ToolbarBtn>
        <span className="w-px h-4 bg-border mx-1" />
        <ToolbarBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
          • List
        </ToolbarBtn>
        <ToolbarBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
          1. List
        </ToolbarBtn>
        <span className="w-px h-4 bg-border mx-1" />
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">↩</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">↪</ToolbarBtn>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="border border-t-0 border-border rounded-b-sm min-h-[220px] px-4 py-3 text-sm bg-white prose prose-sm max-w-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[200px]"
      />
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const EmailTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTemplates = async () => {
    try {
      const res = await api.emailTemplates.getAll();
      setTemplates(res.data.templates || []);
    } catch (err: any) {
      alert(err.message || 'Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const openEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setSubject(template.subject);
    setBodyHtml(template.body_html);
    setLogoFile(null);
    setLogoPreview(template.header_logo || null);
    setRemoveLogo(false);
  };

  const closeEdit = () => {
    setEditingTemplate(null);
    setLogoFile(null);
    setLogoPreview(null);
    setRemoveLogo(false);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setRemoveLogo(false);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setRemoveLogo(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!editingTemplate) return;
    if (!subject.trim()) { alert('Subject is required'); return; }
    if (!bodyHtml.trim()) { alert('Email body is required'); return; }

    setIsSubmitting(true);
    try {
      await api.emailTemplates.update({
        key: editingTemplate.key,
        subject,
        body_html: bodyHtml,
        body_text: '',
        is_active: true,
        header_logo: logoFile,
        remove_header_logo: removeLogo,
      });
      await fetchTemplates();
      closeEdit();
    } catch (err: any) {
      alert(err.message || 'Failed to update template');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-steel text-sm uppercase tracking-widest">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-tight">Email Templates</h2>
          <p className="text-steel text-xs uppercase tracking-widest mt-1">
            Manage system email notifications
          </p>
        </div>
        <div className="flex items-center gap-2 text-steel text-xs uppercase tracking-widest">
          <Mail size={14} />
          <span>{templates.length} templates</span>
        </div>
      </div>

      {/* Templates table */}
      <Card noPadding>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-platinum/50">
              {['Template Name', 'Key', 'Subject', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 font-bold text-steel uppercase text-[10px] tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {templates.map((template) => (
              <tr key={template._id} className="hover:bg-platinum/20 transition-colors">
                <td className="px-4 py-3">
                  <span className="text-sm font-semibold">{template.name}</span>
                </td>
                <td className="px-4 py-3">
                  <code className="text-[11px] bg-platinum px-2 py-0.5 rounded font-mono text-steel">
                    {template.key}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600 truncate max-w-[240px] block">
                    {template.subject}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline" onClick={() => openEdit(template)}>
                    <Edit size={12} className="mr-1.5" />
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-[2px]">
          <div className="bg-white border border-border rounded-sm shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh]">

            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-platinum/30 shrink-0">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest">Edit Email Template</h2>
                <p className="text-[10px] text-steel uppercase tracking-widest mt-0.5">
                  {editingTemplate.name}
                </p>
              </div>
              <button onClick={closeEdit} className="text-steel hover:text-primary text-xl leading-none">
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* Subject */}
              <Input
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject line..."
              />

              {/* WYSIWYG */}
              <div>
                <label className="text-[11px] font-bold text-steel uppercase tracking-widest block mb-2">
                  Email Body
                </label>
                <RichEditor
                  content={bodyHtml}
                  onChange={setBodyHtml}
                  placeholders={editingTemplate.placeholders.filter((p) => p !== 'logo')}
                />
              </div>

              {/* Header Logo */}
              <div>
                <label className="text-[11px] font-bold text-steel uppercase tracking-widest block mb-2">
                  Header Logo
                  <span className="ml-2 font-normal normal-case tracking-normal text-gray-400">
                    (shown at the top of the email)
                  </span>
                </label>
                {logoPreview && !removeLogo ? (
                  <div className="mb-3 flex items-center gap-3">
                    <img
                      src={logoPreview}
                      alt="Header logo"
                      className="h-14 object-contain border border-border rounded-sm bg-platinum/30 px-3 py-2"
                    />
                    <Button size="sm" variant="ghost" type="button" onClick={handleRemoveLogo}>
                      <ImageOff size={12} className="mr-1.5" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-steel mb-2">
                    No logo set — the {'{{logo}}'} placeholder will render empty
                  </p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <Button size="sm" variant="outline" type="button" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={12} className="mr-1.5" />
                  Upload Logo
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-platinum/10 shrink-0">
              <Button variant="outline" onClick={closeEdit} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} loading={isSubmitting}>
                Save Template
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplatesPage;
