document.addEventListener('DOMContentLoaded', () => {

    // ── Elements ──────────────────────────────────────────────
    const chatArea       = document.getElementById('chat-area');
    const input          = document.getElementById('chat-input');
    const sendBtn        = document.getElementById('send-btn');
    const clearBtn       = document.getElementById('clear-history');
    const viewHistoryBtn = document.getElementById('view-history');
    const sessionCounter = document.getElementById('sessionChats');
    const totalCounter   = document.getElementById('chatCount');

    let sessionCount = 0;
    let isWaiting    = false;  // prevent double sends

    // ── Helpers ───────────────────────────────────────────────

    function getTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function scrollToBottom() {
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    // Add user bubble (right side)
    function addUserBubble(text) {
        const div = document.createElement('div');
        div.className = 'chat-bubble-user';
        div.innerHTML = `
            <div class="bubble-header">
                <i class="fas fa-user"></i> You
            </div>
            <div>${escapeHtml(text)}</div>
            <div class="msg-time">${getTime()}</div>
        `;
        chatArea.appendChild(div);
        scrollToBottom();
    }

    // Add AI bubble (left side)
    function addAiBubble(text) {
        const div = document.createElement('div');
        div.className = 'chat-bubble-ai';
        // Allow line breaks in AI response
        const formatted = escapeHtml(text).replace(/\n/g, '<br>');
        div.innerHTML = `
            <div class="bubble-header">
                <i class="fas fa-robot"></i> AI Assistant
            </div>
            <div>${formatted}</div>
            <div class="msg-time">${getTime()}</div>
        `;
        chatArea.appendChild(div);
        scrollToBottom();
        return div;
    }

    // Add error bubble
    function addErrorBubble(text) {
        const div = document.createElement('div');
        div.className = 'chat-bubble-error';
        div.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${escapeHtml(text)}`;
        chatArea.appendChild(div);
        scrollToBottom();
    }

    // Show typing indicator
    function showTyping() {
        const div = document.createElement('div');
        div.className = 'typing-indicator';
        div.id = 'typing-indicator';
        div.innerHTML = `
            <i class="fas fa-robot" style="color:rgba(255,255,255,0.4); font-size:0.85rem;"></i>
            <span>AI is typing</span>
            <div class="typing-dots">
                <div></div><div></div><div></div>
            </div>
        `;
        chatArea.appendChild(div);
        scrollToBottom();
    }

    // Remove typing indicator
    function removeTyping() {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    // Get CSRF token from cookie (Flask-WTF)
    function getCsrfToken() {
        const name = 'csrf_token=';
        const cookies = document.cookie.split(';');
        for (let c of cookies) {
            c = c.trim();
            if (c.startsWith(name)) return c.substring(name.length);
        }
        return '';
    }

    // ── Send Message ──────────────────────────────────────────

    async function sendMessage() {
        const message = input.value.trim();
        if (!message || isWaiting) return;

        // Lock UI
        isWaiting = true;
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending';
        input.value = '';

        // Show user bubble
        addUserBubble(message);

        // Show typing indicator
        showTyping();

        try {
            const res = await fetch('/chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({ message })
            });

            removeTyping();

            if (!res.ok) {
                throw new Error(`Server error: ${res.status}`);
            }

            const data = await res.json();

            if (data.response) {
                addAiBubble(data.response);

                // Update counters
                sessionCount++;
                sessionCounter.textContent = sessionCount;
                const current = parseInt(totalCounter.textContent) || 0;
                totalCounter.textContent = current + 1;

            } else {
                addErrorBubble('AI service temporarily unavailable. Please try again later.');
            }

        } catch (err) {
            removeTyping();
            console.error('Chat error:', err);
            addErrorBubble('AI service temporarily unavailable. Please try again later.');
        } finally {
            // Unlock UI
            isWaiting = false;
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
            input.focus();
        }
    }

    // ── Event Listeners ───────────────────────────────────────

    // Send button click
    sendBtn.addEventListener('click', sendMessage);

    // Enter key to send (Shift+Enter = new line NOT needed since input is single line)
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Clear history
    clearBtn.addEventListener('click', async () => {
        if (!confirm('Clear all chat history? This cannot be undone.')) return;
        try {
            await fetch('/chat/clear_history', {
                method: 'POST',
                headers: { 'X-CSRFToken': getCsrfToken() }
            });
            // Keep only welcome message
            chatArea.innerHTML = `
                <div class="chat-bubble-ai">
                    <div class="bubble-header">
                        <i class="fas fa-robot"></i> AI Assistant
                    </div>
                    Chat history cleared. How can I help you?
                    <div class="msg-time">Just now</div>
                </div>
            `;
            sessionCount = 0;
            sessionCounter.textContent = 0;
        } catch (err) {
            addErrorBubble('Could not clear history. Please try again.');
        }
    });

    // Load history from DB
    viewHistoryBtn.addEventListener('click', async () => {
        try {
            viewHistoryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading';
            viewHistoryBtn.disabled = true;

            const res  = await fetch('/chat/history');
            const data = await res.json();

            if (!data.length) {
                addAiBubble('No previous chat history found.');
                return;
            }

            // Clear area and re-render history
            chatArea.innerHTML = '';
            data.forEach(entry => {
                // User bubble
                const userDiv = document.createElement('div');
                userDiv.className = 'chat-bubble-user';
                userDiv.innerHTML = `
                    <div class="bubble-header"><i class="fas fa-user"></i> You</div>
                    <div>${escapeHtml(entry.message)}</div>
                    <div class="msg-time">${entry.time}</div>
                `;
                chatArea.appendChild(userDiv);

                // AI bubble
                const aiDiv = document.createElement('div');
                aiDiv.className = 'chat-bubble-ai';
                aiDiv.innerHTML = `
                    <div class="bubble-header"><i class="fas fa-robot"></i> AI Assistant</div>
                    <div>${escapeHtml(entry.response).replace(/\n/g,'<br>')}</div>
                    <div class="msg-time">${entry.time}</div>
                `;
                chatArea.appendChild(aiDiv);
            });

            scrollToBottom();

        } catch (err) {
            addErrorBubble('Could not load history. Please try again.');
        } finally {
            viewHistoryBtn.innerHTML = '<i class="fas fa-history"></i> Load History';
            viewHistoryBtn.disabled = false;
        }
    });

    // Toggle mode button (your existing feature — kept as-is)
    const toggleBtn = document.getElementById('toggle-mode');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
        });
    }

    // Auto-focus input on load
    input.focus();
    scrollToBottom();
});