/**
 * ============================================================
 *  EIAI Chat Widget — Embeddable Floating Chat
 *  Edvance Innovators AI (edvanceinnovators.org)
 * ============================================================
 *
 *  USAGE:
 *    <script src="https://hub.edvanceinnovators.org/widget.js" async></script>
 *
 *  OPTIONAL CONFIG (set BEFORE loading the script):
 *    <script>
 *      window.EIAI_CONFIG = {
 *        apiBase:  'https://api.edvanceinnovators.org',
 *        logoUrl:  'https://hub.edvanceinnovators.org/logo.png',
 *        primary:  '#38BDF8',
 *        secondary:'#0EA5E9',
 *        position: 'bottom-right',   // 'bottom-right' | 'bottom-left'
 *        greeting: "Hi! I'm EIAI. Ask me anything...",
 *        zIndex:   2147483000,
 *      };
 *    </script>
 *    <script src="https://hub.edvanceinnovators.org/widget.js" async></script>
 */

(function () {
    'use strict';

    // ============================================================
    // PREVENT DOUBLE-LOADING
    // ============================================================
    if (window.__EIAI_WIDGET_LOADED__) return;
    window.__EIAI_WIDGET_LOADED__ = true;

    // ============================================================
    // CONFIG
    // ============================================================
    const cfg = window.EIAI_CONFIG || {};
    const API_BASE = cfg.apiBase || 'https://chat.edvanceinnovators.org';
    const LOGO_URL   = cfg.logoUrl   || 'http://localhost:3000/assets/images/logo.png';
    const PRIMARY    = cfg.primary   || '#38BDF8';
    const SECONDARY  = cfg.secondary || '#0EA5E9';
    const POSITION   = cfg.position === 'bottom-left' ? 'bottom-left' : 'bottom-right';
    const GREETING   = cfg.greeting  || "Hi! I'm EIAI — your AI assistant. Ask me about funding, experts, project packages, or growing your business in developing countries.";
    const Z_INDEX    = cfg.zIndex    || 2147483000;
    const MAX_HISTORY = 20;

    const isLeft = POSITION === 'bottom-left';

    // ============================================================
    // STYLES (injected once)
    // ============================================================
    const styles = `
        /* --- ROOT RESET --- */
        #eiai-widget-root,
        #eiai-widget-root * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        /* --- FLOATING BUBBLE --- */
        #eiai-bubble {
            position: fixed;
            bottom: 24px;
            ${isLeft ? 'left: 24px;' : 'right: 24px;'}
            width: 76px;
            height: 76px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${PRIMARY}, ${SECONDARY});
            box-shadow: 0 8px 32px rgba(56, 189, 248, 0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: ${Z_INDEX};
            border: 3px solid rgba(255, 255, 255, 0.18);
            transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        #eiai-bubble:hover {
            transform: scale(1.08);
            box-shadow: 0 12px 44px rgba(56, 189, 248, 0.65);
        }
        #eiai-bubble img {
            width: 52px;
            height: 52px;
            object-fit: contain;
            pointer-events: none;
        }
        #eiai-bubble .eiai-badge {
            position: absolute;
            top: -4px;
            ${isLeft ? 'left: -4px;' : 'right: -4px;'}
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #EF4444;
            color: white;
            font-size: 11px;
            font-weight: 700;
            display: none;
            align-items: center;
            justify-content: center;
            border: 2px solid #0A1628;
        }

        /* --- CHAT WINDOW --- */
        #eiai-window {
            position: fixed;
            bottom: 112px;
            ${isLeft ? 'left: 24px;' : 'right: 24px;'}
            width: 400px;
            max-width: calc(100vw - 32px);
            height: 600px;
            max-height: calc(100vh - 140px);
            background: #0A1628;
            border: 1px solid rgba(56, 189, 248, 0.18);
            border-radius: 20px;
            box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);
            display: none;
            flex-direction: column;
            overflow: hidden;
            z-index: ${Z_INDEX - 1};
            color: #F1F5F9;
            animation: eiaiSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        #eiai-window.open {
            display: flex;
        }
        @keyframes eiaiSlideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* --- HEADER --- */
        #eiai-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 18px;
            background: linear-gradient(135deg, rgba(56, 189, 248, 0.20), rgba(96, 165, 250, 0.10));
            border-bottom: 1px solid rgba(56, 189, 248, 0.15);
            flex-shrink: 0;
        }
        #eiai-header img.eiai-header-logo {
            width: 56px;
            height: 56px;
            object-fit: contain;
            border-radius: 12px;
            background: rgba(10, 22, 40, 0.5);
            padding: 4px;
            flex-shrink: 0;
        }
        #eiai-header .eiai-header-info {
            flex: 1;
            min-width: 0;
        }
        #eiai-header .eiai-title {
            font-weight: 700;
            font-size: 15px;
            color: #F1F5F9;
            line-height: 1.2;
        }
        #eiai-header .eiai-status {
            font-size: 11.5px;
            color: #7DD3FC;
            display: flex;
            align-items: center;
            gap: 5px;
            margin-top: 2px;
        }
        #eiai-header .eiai-status .eiai-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #38BDF8;
            animation: eiaiPulse 2s infinite;
        }
        @keyframes eiaiPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }
        #eiai-close {
            background: none;
            border: none;
            color: #94A3B8;
            font-size: 22px;
            line-height: 1;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 6px;
            transition: background 0.2s, color 0.2s;
            margin-left: auto;
            font-family: inherit;
        }
        #eiai-close:hover {
            background: rgba(255, 255, 255, 0.08);
            color: white;
        }

        /* --- BODY --- */
        #eiai-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 14px;
            min-height: 0;
            overflow: hidden;
        }

        /* --- MESSAGES --- */
        #eiai-messages {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            padding-right: 10px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 10px;
            scrollbar-width: thin;
            scrollbar-color: rgba(56, 189, 248, 0.65) rgba(56, 189, 248, 0.10);
        }
        #eiai-messages::-webkit-scrollbar {
            width: 10px;
            background: rgba(56, 189, 248, 0.06);
        }
        #eiai-messages::-webkit-scrollbar-track {
            background: rgba(56, 189, 248, 0.10);
            border-radius: 10px;
            margin: 2px 0;
        }
        #eiai-messages::-webkit-scrollbar-thumb {
            background: rgba(56, 189, 248, 0.65);
            border-radius: 10px;
            border: 2px solid #0A1628;
            min-height: 50px;
        }
        #eiai-messages::-webkit-scrollbar-thumb:hover {
            background: rgba(56, 189, 248, 0.95);
        }

        /* --- MESSAGE BUBBLES --- */
        .eiai-msg {
            max-width: 88%;
            padding: 10px 14px;
            border-radius: 12px;
            font-size: 14px;
            line-height: 1.55;
            animation: eiaiFade 0.3s ease;
            word-wrap: break-word;
        }
        @keyframes eiaiFade {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .eiai-msg.user {
            align-self: flex-end;
            background: linear-gradient(135deg, ${SECONDARY}, #60A5FA);
            color: white;
            border-bottom-right-radius: 4px;
        }
        .eiai-msg.bot {
            align-self: flex-start;
            background: #142B45;
            border: 1px solid rgba(56, 189, 248, 0.12);
            border-bottom-left-radius: 4px;
            color: #F1F5F9;
        }
        .eiai-msg.bot .eiai-lbl {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 9.5px;
            font-weight: 600;
            color: #7DD3FC;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 6px;
        }
        .eiai-msg.bot .eiai-lbl img {
            width: 20px;
            height: 20px;
            object-fit: contain;
            border-radius: 50%;
            background: rgba(56, 189, 248, 0.15);
            padding: 2px;
        }

        /* --- TYPING INDICATOR --- */
        #eiai-typing {
            display: none;
            align-items: center;
            gap: 8px;
            padding: 10px 14px;
            background: #142B45;
            border: 1px solid rgba(56, 189, 248, 0.12);
            border-radius: 12px;
            align-self: flex-start;
            margin-bottom: 8px;
            border-bottom-left-radius: 4px;
        }
        #eiai-typing.active {
            display: flex;
        }
        #eiai-typing img {
            width: 24px;
            height: 24px;
            object-fit: contain;
            border-radius: 50%;
            background: rgba(56, 189, 248, 0.15);
            padding: 3px;
        }
        #eiai-typing .eiai-dots {
            display: flex;
            gap: 4px;
        }
        #eiai-typing .eiai-dots span {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #38BDF8;
            animation: eiaiType 1.4s infinite;
        }
        #eiai-typing .eiai-dots span:nth-child(2) { animation-delay: 0.2s; }
        #eiai-typing .eiai-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes eiaiType {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-6px); opacity: 1; }
        }

        /* --- INPUT AREA --- */
        #eiai-input-area {
            display: flex;
            gap: 8px;
            background: #142B45;
            border: 1px solid rgba(56, 189, 248, 0.15);
            border-radius: 12px;
            padding: 4px;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        #eiai-input-area:focus-within {
            border-color: ${PRIMARY};
            box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.12);
        }
        #eiai-input {
            flex: 1;
            background: transparent;
            border: none;
            padding: 10px 14px;
            color: white;
            font-size: 14px;
            outline: none;
            font-family: inherit;
            min-width: 0;
        }
        #eiai-input::placeholder {
            color: #94A3B8;
        }
        #eiai-send {
            background: linear-gradient(135deg, ${SECONDARY}, #60A5FA);
            border: none;
            color: white;
            padding: 10px 18px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            font-family: inherit;
            transition: transform 0.2s, box-shadow 0.2s;
            white-space: nowrap;
        }
        #eiai-send:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 20px rgba(56, 189, 248, 0.4);
        }
        #eiai-send:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        /* --- MOBILE --- */
        @media (max-width: 480px) {
            #eiai-window {
                width: calc(100vw - 24px);
                height: calc(100vh - 120px);
                max-height: none;
                bottom: 100px;
                ${isLeft ? 'left: 12px;' : 'right: 12px;'}
            }
            #eiai-bubble {
                width: 64px;
                height: 64px;
                bottom: 16px;
                ${isLeft ? 'left: 12px;' : 'right: 12px;'}
            }
            #eiai-bubble img {
                width: 42px;
                height: 42px;
            }
        }
    `;

    // ============================================================
    // HTML TEMPLATE
    // ============================================================
    const html = `
        <div id="eiai-bubble" role="button" tabindex="0" aria-label="Open EIAI chat">
            <img src="${LOGO_URL}" alt="EIAI" />
            <span class="eiai-badge" id="eiai-badge">1</span>
        </div>

        <div id="eiai-window" role="dialog" aria-modal="false" aria-label="EIAI chat window">
            <div id="eiai-header">
                <img src="${LOGO_URL}" alt="EIAI" class="eiai-header-logo" />
                <div class="eiai-header-info">
                    <div class="eiai-title">EIAI Assistant</div>
                    <div class="eiai-status">
                        <span class="eiai-dot"></span> Online · Powered by Gemini
                    </div>
                </div>
                <button id="eiai-close" aria-label="Close chat">&times;</button>
            </div>

            <div id="eiai-body">
                <div id="eiai-messages"></div>
                <div id="eiai-typing">
                    <img src="${LOGO_URL}" alt="" />
                    <div class="eiai-dots"><span></span><span></span><span></span></div>
                </div>
                <div id="eiai-input-area">
                    <input id="eiai-input" type="text" placeholder="Ask me anything..." autocomplete="off" />
                    <button id="eiai-send">Send</button>
                </div>
            </div>
        </div>
    `;

    // ============================================================
    // INJECT INTO PAGE
    // ============================================================
    function inject() {
        // 1. Styles
        const styleTag = document.createElement('style');
        styleTag.id = 'eiai-widget-styles';
        styleTag.textContent = styles;
        document.head.appendChild(styleTag);

        // 2. HTML
        const root = document.createElement('div');
        root.id = 'eiai-widget-root';
        root.innerHTML = html;
        document.body.appendChild(root);

        // 3. Wire up
        wireUp();

        // 4. Greeting
        setTimeout(() => addMessage(GREETING, 'bot'), 300);

        // 5. Show badge after 5s if not opened
        setTimeout(() => {
            const badge = document.getElementById('eiai-badge');
            const win = document.getElementById('eiai-window');
            if (badge && win && !win.classList.contains('open')) {
                badge.style.display = 'flex';
            }
        }, 5000);
    }

    // ============================================================
    // STATE
    // ============================================================
    let history = [];
    let busy = false;
    let isOpen = false;

    // ============================================================
    // HELPERS
    // ============================================================
    function stripMarkdown(text) {
        if (!text) return '';
        return text
            .replace(/\*\*(.+?)\*\*/g, '$1')
            .replace(/__(.+?)__/g, '$1')
            .replace(/\*(.+?)\*/g, '$1')
            .replace(/_(.+?)_/g, '$1')
            .replace(/^#{1,6}\s+/gm, '')
            .replace(/^\s*[\*\-\+]\s+/gm, '• ')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ''))
            .replace(/^>\s+/gm, '')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    function addMessage(text, sender) {
        const container = document.getElementById('eiai-messages');
        if (!container) return;

        const msg = document.createElement('div');
        msg.className = `eiai-msg ${sender}`;

        if (sender === 'bot') {
            const clean = stripMarkdown(text);
            msg.innerHTML = `
                <div class="eiai-lbl">
                    <img src="${LOGO_URL}" alt="" /> EIAI Assistant
                </div>
                <span>${clean.replace(/\n/g, '<br>')}</span>
            `;
        } else {
            msg.textContent = text;
        }

        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
    }

    function showTyping() {
        const t = document.getElementById('eiai-typing');
        if (t) t.classList.add('active');
    }

    function hideTyping() {
        const t = document.getElementById('eiai-typing');
        if (t) t.classList.remove('active');
    }

    async function callAPI(message) {
        const response = await fetch(`${API_BASE}/api/chat/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                conversation_history: history.slice(-MAX_HISTORY),
            }),
        });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return await response.json();
    }

    // ============================================================
    // SEND MESSAGE
    // ============================================================
    async function send() {
        const input = document.getElementById('eiai-input');
        const sendBtn = document.getElementById('eiai-send');
        if (!input || !sendBtn) return;

        const message = input.value.trim();
        if (!message || busy) return;

        busy = true;
        addMessage(message, 'user');
        input.value = '';
        input.focus();

        showTyping();
        sendBtn.disabled = true;

        try {
            const data = await callAPI(message);
            history.push(
                { role: 'user', content: message },
                { role: 'assistant', content: data.reply }
            );
            hideTyping();
            addMessage(data.reply, 'bot');
        } catch (err) {
            hideTyping();
            addMessage('Connection error. Please try again.', 'bot');
            console.error('[EIAI Widget] API error:', err);
        } finally {
            sendBtn.disabled = false;
            busy = false;
        }
    }

    // ============================================================
    // TOGGLE WINDOW
    // ============================================================
    function toggleWindow() {
        const win = document.getElementById('eiai-window');
        const badge = document.getElementById('eiai-badge');
        if (!win) return;

        isOpen = !isOpen;
        win.classList.toggle('open', isOpen);
        if (badge) badge.style.display = 'none';

        if (isOpen) {
            const input = document.getElementById('eiai-input');
            setTimeout(() => input && input.focus(), 300);
        }
    }

    // ============================================================
    // WIRE UP EVENTS
    // ============================================================
    function wireUp() {
        const bubble = document.getElementById('eiai-bubble');
        const closeBtn = document.getElementById('eiai-close');
        const sendBtn = document.getElementById('eiai-send');
        const input = document.getElementById('eiai-input');

        if (bubble) {
            bubble.addEventListener('click', toggleWindow);
            bubble.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleWindow();
                }
            });
        }

        if (closeBtn) closeBtn.addEventListener('click', toggleWindow);

        if (sendBtn) sendBtn.addEventListener('click', send);

        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                }
            });
        }
    }

    // ============================================================
    // BOOT — inject when DOM is ready
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }

    // ============================================================
    // EXPOSE GLOBAL API (optional)
    // ============================================================
    window.EIAI = {
        open:   () => { if (!isOpen) toggleWindow(); },
        close:  () => { if (isOpen) toggleWindow(); },
        toggle: toggleWindow,
        sendMessage: (text) => {
            const input = document.getElementById('eiai-input');
            if (input) { input.value = text; send(); }
        },
    };

    console.log('%c🚀 EIAI Widget loaded', 'font-size:15px; font-weight:700; color:#38BDF8;');
})();
