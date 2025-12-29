// ===== API Service Layer for Melo App =====

class ApiService {
    constructor() {
        this.isOnline = navigator.onLine;
        this.cache = new Map();
        
        // Setup online/offline detection
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }
    
    // ===== Gemini API Methods =====
    async generateAuriResponse(prompt) {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.API_KEY}`;
        const systemPrompt = `You are Auri, an emotionally intelligent AI guide for Gen Z in India. Your tone is supportive, validating, and uses Gen Z language (emojis, acronyms where appropriate). Do not diagnose. Always encourage reflection, offer coping strategies, or suggest using a Micro-Therapy Tool. Keep responses concise. Be culturally sensitive to Indian context.`;
        
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 500,
            }
        };

        try {
            if (!this.isOnline) {
                throw new Error(CONFIG.ERRORS.OFFLINE);
            }
            
            const response = await this.fetchWithRetry(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }, 2); // Retry 2 times

            const candidate = response.candidates?.[0];
            let responseText = "Sorry, I'm having trouble connecting. Maybe try a quick breathing exercise? 🧘‍♀️";
            
            if (candidate && candidate.content?.parts?.[0]?.text) {
                responseText = candidate.content.parts[0].text;
            }
            
            return responseText;
            
        } catch (error) {
            console.error("Gemini API Error:", error);
            return "Ugh, a connection error! 😭 Let's try again in a bit. In the meantime, maybe journal that thought? 📝";
        }
    }
    
    // ===== Fetch with Retry =====
    async fetchWithRetry(url, options, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, options);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.warn(`Attempt ${i + 1} failed. Retrying...`, error);
                if (i === retries - 1) throw error;
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            }
        }
    }
    
    // ===== Network Status =====
    handleOnline() {
        this.isOnline = true;
        console.log('App is back online');
        
        // Dispatch event for UI updates
        document.dispatchEvent(new CustomEvent('network-online'));
    }
    
    handleOffline() {
        this.isOnline = false;
        console.log('App is offline');
        
        // Dispatch event for UI updates
        document.dispatchEvent(new CustomEvent('network-offline'));
    }
}

// Create singleton instance
const api = new ApiService();