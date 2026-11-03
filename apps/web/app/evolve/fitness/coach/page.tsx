'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Bot, User, RotateCcw } from 'lucide-react';
import { FitnessNav } from '../fitness-nav';
import { api } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider?: string | null;
  model?: string | null;
  createdAt: string;
}

const PRESET_PROMPTS = [
  'Analyze my current workout volume and recommend progressive overload for next week.',
  'Given my remaining macros for today, suggest a high-protein South Indian dinner.',
  'How should I structure my Push/Pull/Legs routine to break through my bench press plateau?',
  'Calculate my estimated 1RM for Squat and suggest working set percentages.',
  'Review my hydration and calorie targets for fat loss while preserving muscle.',
];

export default function FitnessCoachPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initConversation = async () => {
    try {
      // Find or create a fitness conversation
      const listRes = await api.get<any[]>('/ai/conversations?module=FITNESS');
      if (listRes.data && listRes.data.length > 0) {
        const conv = listRes.data[0];
        setConversationId(conv.id);
        const detailRes = await api.get<any>(`/ai/conversations/${conv.id}`);
        if (detailRes.data?.messages) {
          setMessages(detailRes.data.messages);
        }
      } else {
        const newRes = await api.post<any>('/ai/conversations', {
          title: 'Fitness & Nutrition Coaching',
          module: 'FITNESS',
        });
        if (newRes.data?.id) {
          setConversationId(newRes.data.id);
          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content:
                "👋 Hello! I'm your dedicated EES Fitness & Nutrition Coach. I have direct access to your logged workouts, PRs, nutrition diary, and body measurements. How can I help you evolve today?",
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to init fitness coach conversation', err);
    }
  };

  useEffect(() => {
    initConversation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || !conversationId || loading) return;

    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!messageText) setInput('');
    setLoading(true);

    try {
      const res = await api.post<any>(`/ai/conversations/${conversationId}/messages`, {
        content: textToSend,
      });

      if (res.data?.assistantMessage) {
        setMessages((prev) => [...prev, res.data.assistantMessage]);
      }
    } catch (err) {
      console.error('Failed to send message to coach', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content:
            '⚠️ I encountered an issue connecting to the AI provider. Please ensure an active model is configured in Admin AI settings.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full flex-1 flex flex-col">
        <FitnessNav />

        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
              <Sparkles className="h-6 w-6 text-emerald-400" />
              EES AI Fitness & Nutrition Coach
            </h1>
            <p className="text-sm text-slate-400">
              Personalized training & diet guidance grounded in your real workout logs, PRs, and food diary.
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm('Start a fresh fitness coaching conversation?')) {
                api
                  .post<any>('/ai/conversations', {
                    title: `Fitness Coaching ${new Date().toLocaleDateString()}`,
                    module: 'FITNESS',
                  })
                  .then((res) => {
                    setConversationId(res.data.id);
                    setMessages([
                      {
                        id: 'welcome',
                        role: 'assistant',
                        content:
                          "👋 Started a fresh session! What are we focusing on today: strength programming, progressive overload, or meal planning?",
                        createdAt: new Date().toISOString(),
                      },
                    ]);
                  });
              }
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New Session
          </button>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 sm:gap-4 ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.role !== 'user' && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Bot className="h-5 w-5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'border border-slate-800 bg-slate-950/80 text-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {m.provider && (
                    <div className="mt-3 flex items-center gap-2 border-t border-slate-800/60 pt-2 text-[10px] text-slate-400">
                      <span className="font-semibold uppercase tracking-wider text-emerald-400">
                        {m.provider}
                      </span>
                      {m.model && <span>• {m.model}</span>}
                    </div>
                  )}
                </div>
                {m.role === 'user' && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-center text-slate-400 text-xs italic">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 animate-pulse">
                  <Bot className="h-4 w-4" />
                </div>
                <span>Coach is analyzing your fitness logs & formulating recommendations...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Presets */}
          <div className="border-t border-slate-800 bg-slate-950/40 px-4 py-2.5 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {PRESET_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  disabled={loading}
                  onClick={() => handleSend(prompt)}
                  className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 hover:border-emerald-500/50 hover:text-emerald-300 transition"
                >
                  ⚡ {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="border-t border-slate-800 bg-slate-900 p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                placeholder="Ask your coach anything about your workouts, PRs, nutrition, or plans..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition flex items-center justify-center"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

