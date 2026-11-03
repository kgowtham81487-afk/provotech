'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Send,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Bot,
  User as UserIcon,
  Search,
  MessageSquare,
  ChevronDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface ConversationSummary {
  id: string;
  title: string;
  module: string;
  messageCount: number;
  lastMessage: string | null;
  updatedAt: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider?: string | null;
  model?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  latencyMs?: number | null;
  createdAt: string;
}

// Lightweight Markdown & Code Block Formatter
function MarkdownRenderer({ content }: { content: string }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split by code blocks ```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 leading-relaxed text-sm text-slate-200">
      {parts.map((part, idx) => {
        if (part.startsWith('```')) {
          const firstLineEnd = part.indexOf('\n');
          const lang = part.slice(3, firstLineEnd).trim() || 'code';
          const code = part.slice(firstLineEnd + 1, part.length - 3).trim();

          return (
            <div key={idx} className="my-3 rounded-xl border border-slate-800 bg-[#0A0F1D] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 text-xs text-slate-400">
                <span className="font-mono text-[11px] font-semibold uppercase text-indigo-400">{lang}</span>
                <button
                  onClick={() => copyCode(code, idx)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto font-mono text-xs text-indigo-200 bg-[#0A0F1D] selection:bg-indigo-900">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Format normal markdown text (paragraphs, headers, lists, bold)
        const lines = part.split('\n');
        return (
          <div key={idx} className="space-y-2">
            {lines.map((line, lIdx) => {
              if (line.startsWith('### ')) {
                return (
                  <h3 key={lIdx} className="text-base font-bold text-white mt-3 mb-1">
                    {line.replace('### ', '')}
                  </h3>
                );
              }
              if (line.startsWith('## ')) {
                return (
                  <h2 key={lIdx} className="text-lg font-extrabold text-white mt-4 mb-2">
                    {line.replace('## ', '')}
                  </h2>
                );
              }
              if (line.startsWith('# ')) {
                return (
                  <h1 key={lIdx} className="text-xl font-black text-white mt-4 mb-2">
                    {line.replace('# ', '')}
                  </h1>
                );
              }
              if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
                return (
                  <li key={lIdx} className="ml-4 list-disc text-slate-300">
                    <span dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^[•\-*]\s*/, '')) }} />
                  </li>
                );
              }
              if (/^\d+\.\s/.test(line)) {
                return (
                  <li key={lIdx} className="ml-4 list-decimal text-slate-300">
                    <span dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^\d+\.\s*/, '')) }} />
                  </li>
                );
              }
              if (line.trim() === '---') {
                return <hr key={lIdx} className="my-3 border-slate-800" />;
              }
              if (!line.trim()) return null;

              return (
                <p key={lIdx} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[12px]">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-indigo-400 underline hover:text-indigo-300">$1</a>');
}

function AiAssistantContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [currentConversation, setCurrentConversation] = useState<{ id: string; title: string; module: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedModule, setSelectedModule] = useState<'GENERAL' | 'SKILLS' | 'OPPORTUNITIES' | 'EVOLVE'>('GENERAL');

  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Read URL query params
  useEffect(() => {
    const queryModule = searchParams.get('module')?.toUpperCase();
    if (queryModule && ['GENERAL', 'SKILLS', 'OPPORTUNITIES', 'EVOLVE'].includes(queryModule)) {
      setSelectedModule(queryModule as any);
    }
  }, [searchParams]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Load user conversations
  const loadConversations = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/ai/conversations');
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setConversations(data);
      if (data.length > 0 && !activeConversationId) {
        selectConversation(data[0].id);
      }
    } catch {
      // offline / error fallback
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const selectConversation = async (conversationId: string) => {
    try {
      setActiveConversationId(conversationId);
      setLoadingMessages(true);
      const res = await api.get(`/ai/conversations/${conversationId}`);
      if (res.data) {
        setCurrentConversation({
          id: res.data.id,
          title: res.data.title,
          module: res.data.module || 'GENERAL',
        });
        setSelectedModule(res.data.module || 'GENERAL');
        setMessages(res.data.messages || []);
      }
    } catch {
      // Conversation not found or error
    } finally {
      setLoadingMessages(false);
      setSidebarOpen(false);
    }
  };

  const handleStartNewChat = () => {
    setActiveConversationId(null);
    setCurrentConversation(null);
    setMessages([]);
    setInputPrompt('');
    inputRef.current?.focus();
    setSidebarOpen(false);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || sending) return;

    setInputPrompt('');
    setSending(true);

    // Optimistic user bubble
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await api.post('/ai/chat', {
        conversationId: activeConversationId || undefined,
        message: text,
        module: selectedModule,
      });

      if (res.data) {
        const { conversationId, title, assistantMessage } = res.data;

        // Update active conversation
        setActiveConversationId(conversationId);
        setCurrentConversation({
          id: conversationId,
          title,
          module: selectedModule,
        });

        // Replace user temp message and append assistant message
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMsg.id),
          res.data.userMessage || tempUserMsg,
          assistantMessage,
        ]);

        // Refresh sidebar list
        loadConversations();
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to receive AI response. Please try again.';
      const failureMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Generation Error**: ${errorMsg}\n\nPlease verify that AI provider credentials (Gemini, DeepSeek, or Groq) are active, or click Retry below.`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, failureMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleRename = async (convId: string) => {
    if (!editedTitle.trim()) {
      setEditingTitleId(null);
      return;
    }
    try {
      await api.patch(`/ai/conversations/${convId}`, { title: editedTitle });
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, title: editedTitle } : c)),
      );
      if (currentConversation?.id === convId) {
        setCurrentConversation((prev: any) => ({ ...prev, title: editedTitle }));
      }
    } catch {
      // ignore
    } finally {
      setEditingTitleId(null);
    }
  };

  const handleDelete = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await api.delete(`/ai/conversations/${convId}`);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        handleStartNewChat();
      }
    } catch {
      // ignore
    }
  };

  const copyMessage = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchFilter.toLowerCase()),
  );

  const STARTER_PROMPTS = [
    {
      title: 'Recommend Skills for My Field',
      desc: 'Analyze my current profile and suggest next high-value skills to master.',
      module: 'SKILLS',
      prompt: 'What skills should I learn next to advance as a high-throughput engineer in my focus field?',
    },
    {
      title: 'Match Available Opportunities',
      desc: 'Check published Provolution client projects against my verified skills.',
      module: 'OPPORTUNITIES',
      prompt: 'Which open opportunities on the EES platform match my current skill set and qualifications?',
    },
    {
      title: 'Architect a Portfolio Project',
      desc: 'Generate a production capstone architecture to showcase on GitHub.',
      module: 'EVOLVE',
      prompt: 'Can you propose a commercial-grade capstone project architecture with testing and CI/CD?',
    },
    {
      title: 'Concept Breakdown & Roadmaps',
      desc: 'Explain complex systems concepts with concrete code examples.',
      module: 'GENERAL',
      prompt: 'Explain database transaction isolation levels and concurrency control with clear examples.',
    },
  ];

  return (
    <div className="flex h-[calc(100vh-80px)] w-full overflow-hidden bg-[#020617] text-slate-100">
      {/* Sidebar: Conversation History */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } fixed md:static inset-y-0 left-0 z-40 w-72 md:w-80 bg-[#0A0F1D] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out shrink-0`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800/80 space-y-3">
          <button
            onClick={handleStartNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search conversation history..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingHistory ? (
            <div className="p-4 text-center text-xs text-slate-500">Loading conversation history...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">No conversations recorded yet. Start a new chat!</div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = activeConversationId === conv.id;
              const isEditing = editingTitleId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer text-xs transition ${
                    isActive
                      ? 'bg-indigo-600/15 border border-indigo-500/30 text-white'
                      : 'hover:bg-slate-900/80 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onBlur={() => handleRename(conv.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename(conv.id)}
                        autoFocus
                        className="bg-slate-900 text-white px-2 py-0.5 rounded border border-indigo-500 text-xs w-full"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="truncate">
                        <div className="font-medium truncate">{conv.title}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="uppercase text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                            {conv.module}
                          </span>
                          <span>{new Date(conv.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  {!isEditing && (
                    <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTitleId(conv.id);
                          setEditedTitle(conv.title);
                        }}
                        className="p-1 hover:text-white text-slate-500"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(conv.id, e)}
                        className="p-1 hover:text-rose-400 text-slate-500"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI Fallback Cluster Ready</span>
          </div>
          <span className="text-[10px] text-slate-500">v2.0</span>
        </div>
      </aside>

      {/* Main Chat Viewport */}
      <main className="flex-1 flex flex-col h-full bg-[#020617] overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between bg-[#0A0F1D]/80 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm truncate max-w-[200px] md:max-w-md">
                {currentConversation?.title || 'EES AI Companion'}
              </span>
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-semibold uppercase">
                <Layers className="w-2.5 h-2.5" />
                <span>{selectedModule} CONTEXT</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {/* Module Context Selector */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs">
              <span className="text-slate-500 text-[10px] uppercase font-semibold hidden sm:inline">Context:</span>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value as any)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="GENERAL" className="bg-slate-900">General Assistant</option>
                <option value="SKILLS" className="bg-slate-900">Skills & Curriculum</option>
                <option value="OPPORTUNITIES" className="bg-slate-900">Scale Opportunities</option>
                <option value="EVOLVE" className="bg-slate-900">Evolve Trackers</option>
              </select>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Gemini → DeepSeek → Groq</span>
            </div>
          </div>
        </header>

        {/* Messages Stream Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {loadingMessages ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading messages...</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            /* Empty State: Starter cards */
            <div className="max-w-3xl mx-auto py-8 sm:py-12 space-y-8">
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-cyan-500/20 to-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-2xl mb-2">
                  ✨
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">EES Conversational AI Assistant</h1>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Ask any question about software architecture, career skill roadmaps, or verified Provolution Technologies opportunities.
                </p>
              </div>

              {/* Starter Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STARTER_PROMPTS.map((card, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedModule(card.module as any);
                      handleSendMessage(card.prompt);
                    }}
                    className="p-4 rounded-2xl bg-[#0A0F1D] border border-slate-800/80 hover:border-indigo-500/40 text-left transition hover:shadow-lg hover:shadow-indigo-600/5 group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition">
                        {card.title}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition" />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{card.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id || index}
                  className={`flex gap-3 md:gap-4 max-w-4xl mx-auto ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center text-white shrink-0 shadow-md">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`space-y-1.5 max-w-[85%] sm:max-w-[75%]`}>
                    <div
                      className={`p-4 rounded-2xl ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                          : 'bg-[#0A0F1D] border border-slate-800/80 rounded-bl-none shadow-lg shadow-black/20'
                      }`}
                    >
                      {isUser ? (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <MarkdownRenderer content={msg.content} />
                      )}
                    </div>

                    {/* Attribution & Actions for Assistant */}
                    {!isUser && (
                      <div className="flex items-center justify-between px-1 text-[10px] text-slate-500">
                        <div className="flex items-center gap-2">
                          {msg.provider && (
                            <span className="flex items-center gap-1 font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                              <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                              {msg.provider} {msg.model ? `(${msg.model})` : ''}
                            </span>
                          )}
                          {msg.latencyMs && <span>{msg.latencyMs}ms</span>}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyMessage(msg.content, msg.id)}
                            className="hover:text-slate-300 transition flex items-center gap-1"
                            title="Copy response"
                          >
                            {copyFeedback === msg.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          {index === messages.length - 1 && (
                            <button
                              onClick={() => {
                                const lastUser = [...messages].reverse().find((m) => m.role === 'user');
                                if (lastUser) handleSendMessage(lastUser.content);
                              }}
                              className="hover:text-slate-300 transition flex items-center gap-1"
                              title="Regenerate"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Thinking / Spinner Indicator */}
          {sending && (
            <div className="flex gap-3 max-w-4xl mx-auto justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center text-white shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-[#0A0F1D] border border-slate-800 rounded-bl-none flex items-center gap-2 text-xs text-slate-400">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-[11px]">Evaluating context across Gemini, DeepSeek & Groq...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area */}
        <div className="p-4 border-t border-slate-800/80 bg-[#0A0F1D]/60 backdrop-blur shrink-0">
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl focus-within:border-indigo-500 transition"
            >
              <textarea
                ref={inputRef}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder={`Ask anything with ${selectedModule.toLowerCase()} context (e.g. recommend skills, match opportunities)...`}
                className="w-full resize-none bg-transparent py-3.5 pl-4 pr-12 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none"
              />

              <button
                type="submit"
                disabled={sending || !inputPrompt.trim()}
                className="absolute right-2.5 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition shadow-md shadow-indigo-600/30"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-2 text-center text-[10px] text-slate-500">
              EES AI Assistant applies the EVOLVE → ENGAGE → SCALE framework with real database curriculum and opportunities.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AiAssistantPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-spin" />
            <span className="text-sm font-medium">Loading EES Conversational Assistant...</span>
          </div>
        </div>
      }
    >
      <AiAssistantContent />
    </React.Suspense>
  );
}
