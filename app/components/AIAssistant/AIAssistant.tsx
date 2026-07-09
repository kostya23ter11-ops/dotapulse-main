'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from '@/app/context/LocaleContext';
import styles from './AIAssistant.module.css';
import type { ChatMessage } from '@/lib/types';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useLocale();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await response.json();
      if (data.message) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
      } else {
        throw new Error(data.error || 'Something went wrong');
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('ai.error') },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.toggleButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="AI Assistant"
      >
        <div className={styles.buttonContent}>
          <i className='bx bxs-bot'></i>
          <span>AI Assistant</span>
        </div>
      </button>

      {isOpen && (
        <div className={styles.chatWindow} role="dialog" aria-label="AI Assistant chat">
          <div className={styles.header}>
            <h3>Dota Pulse AI</h3>
            <button className={styles.closeButton} onClick={() => setIsOpen(false)} aria-label="Close">×</button>
          </div>

          <div className={styles.messages}>
            {messages.length === 0 && (
              <div className={styles.assistant}>
                {t('ai.greeting')}
                <div className={styles.suggestions}>
                  <button onClick={() => { setInput('Кто сильнее всего в текущей мете?'); }} className={styles.suggestionBtn}>{t('ai.topHeroes')}</button>
                  <button onClick={() => { setInput('Как поднять MMR?'); }} className={styles.suggestionBtn}>{t('ai.mmrTips')}</button>
                  <button onClick={() => { setInput('Кого брать против Pudge?'); }} className={styles.suggestionBtn}>{t('ai.counterPudge')}</button>
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className={`${styles.message} ${styles.assistant} ${styles.typing}`}>
                <span className={styles.typingDots}>
                  <span></span><span></span><span></span>
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className={styles.inputArea}>
            <input
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('ai.placeholder')}
              disabled={isLoading}
            />
            <button type="submit" className={styles.sendButton} disabled={isLoading || !input.trim()}>
              {t('ai.send')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
