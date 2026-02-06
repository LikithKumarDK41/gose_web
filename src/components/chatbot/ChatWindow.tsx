import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, X, RefreshCw } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatOptions } from "./ChatOptions";
import api from "@/lib/api";
import { useLocale } from "@/providers/LocaleProvider";



export interface Option {
  label: string;
  value: string;
  link?: string;
  helptext?: string;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  options?: Option[];
}

interface ChatWindowProps {
  onClose: () => void;
}

const INITIAL_OPTIONS = [
  { label: "Search Routes", value: "search_routes" },
  { label: "Transit Options", value: "transit_options" },
  { label: "Transit Stations", value: "transit_stations" },
  { label: "Using Paid Trains", value: "paid_trains" },
];

const SEARCH_OPTIONS = [
  { label: "Search Routes", value: "search_routes" },
  { label: "Start Again", value: "start_again" },
];

export function ChatWindow({ onClose }: ChatWindowProps) {
  const { t } = useLocale();

  // Define options dynamically based on current locale
  const getInitialOptions = () => [
    { label: t("chatbot.options.search_routes"), value: "search_routes" },
    { label: t("chatbot.options.transit_options"), value: "transit_options" },
    { label: t("chatbot.options.transit_stations"), value: "transit_stations" },
    { label: t("chatbot.options.paid_trains"), value: "paid_trains" },
  ];

  const [messages, setMessages] = useState<Message[]>([]);

  // Initialize or reset messages when locale changes (optional, but good for keeping UI consistent)
  useEffect(() => {
    // Only reset if empty or if we want to force language update (might clear history though...)
    // Better approach: Just set initial message if empty.
    if (messages.length === 0) {
        setMessages([
            { 
              role: "assistant", 
              content: t("chatbot.welcome"),
              options: getInitialOptions()
            },
        ]);
    }
  }, [t]); // Depend on 't' to re-run if language changes?
  // Actually, if language changes mid-chat, we might want to preserve history but future messages will be localized.
  // However, the "initial" message should probably update? 
  // Let's just initialize.

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  /* =========================================================
     API Service (Guidebot)
  ========================================================= */
  // We still track history to know what "Back" should do (i.e. show previous options at the bottom)
  const [optionHistory, setOptionHistory] = useState<{ options: Option[]; text?: string }[]>([]);

  const sendMessage = async (userText: string, addToHistory: boolean = true, isTyped: boolean = false) => {
    if (!userText.trim() || isLoading) return;

    if (addToHistory) {
      const userMessage: Message = { role: "user", content: userText };
      setMessages((prev) => [...prev, userMessage]);
    }
    
    // Save previous options to history (from the last assistant message)
    if (addToHistory) {
        const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant" && m.options && m.options.length > 0);
        if (lastAssistantMsg && lastAssistantMsg.options) {
             setOptionHistory((prev) => [...prev, { 
                options: lastAssistantMsg.options!,
                text: lastAssistantMsg.content
            }]);
        }
    }

    setInput("");
    setIsLoading(true);

    // --- CLIENT SIDE INTERCEPTIONS ---
    const lowerText = userText.toLowerCase().trim();
    if (["bye", "byee", "goodbye", "see you", "cya", "exit", "quit"].some(w => lowerText.includes(w))) {
         setTimeout(() => {
             setMessages(prev => [...prev, { 
                 role: "assistant", 
                 content: "Byee! Feel free to chat if you need anything else.",
                 options: [{ label: t("chatbot.options.start_again"), value: "start_again" }]
             }]);
             setIsLoading(false);
         }, 800);
         return;
    }

    try {
      let data;

      if (isTyped) {
          // Use Local AI for typed messages (Limited Scope)
          const response = await api.post("/chat", {
            messages: [{ role: "user", content: userText }],
          });
          data = response.data;
      } else {
          // Use External Guidebot API for button options
          const response = await api.get(`/v1/guidebot?keyword=${encodeURIComponent(userText)}`);
          data = response.data;
      }

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid response format");
      }

      const fulfillmentMessages = data[0]?.queryResult?.fulfillmentMessages || [];
      
      // 3. Process messages
      let responseText = "";
      let newOptions: Option[] = [];
      
      // Collect all text and options first
      for (const msg of fulfillmentMessages) {
        if (msg.message === "text" && msg.text?.text) {
          responseText += (responseText ? "\n\n" : "") + msg.text.text[0];
        }
        
        if (msg.message === "payload" && msg.payload?.buttons) {
             const buttons = msg.payload.buttons.map((btn: any) => ({
                label: btn.name,
                value: btn.value,
                link: btn.link,
                helptext: btn.helptext
              }));
              newOptions = [...newOptions, ...buttons];
        }
      }

      // Filter options
      newOptions = newOptions.filter(opt => 
          opt.label.toLowerCase() !== "start again" && 
          opt.value !== "start_again" &&
          opt.value !== "start" // Filter API's "Back" button (value "start") to manage it manually if needed, or keep it? 
          // API returns { name: "Back", value: "start" }. My code adds "START AGAIN" manually.
          // Filtering "start" avoids duplicates if I add "START AGAIN".
          // BUT for "Transit Stations", I want "BACK" instead of "START AGAIN".
          // The API provides "Back" (start).
          // If I keep API's "Back" (value: start), and don't add "START AGAIN"...
          // "start" value maps to nothing in my handleOptionSelect? 
          // handleOptionSelect handles "start_again".
          // I should probably map "start" to "start_again" in handleOptionSelect if I keep it.
          // OR filter it out and manage buttons manually as I planned.
          // Safest: Filter it out, and use my manual logic.
      );

      const finalOptions = [...newOptions];
      
      // Determine if we should show BACK (Exception logic)
      // Determine if we should show BACK (Exception logic)
      // Only show manual buttons if NOT typed
      if (!isTyped) {
          const shouldShowBack = 
            (optionHistory.length > 0) &&
            userText !== "Transit Options" &&
            userText !== "Buying tickets" &&
            userText !== "BUYING TICKETS" &&
            userText !== "Using Paid Trains";
    
          if (shouldShowBack) {
              finalOptions.push({ label: t("chatbot.options.back"), value: "back_option" });
          }
    
          // User Request: "Transit Stations" -> BACK instead of START AGAIN
          const isTransitStations = userText.toLowerCase() === "transit stations" || userText === "乗換駅";
          
          if (!isTransitStations) {
              finalOptions.push({ label: t("chatbot.options.start_again"), value: "start_again" });
          } else {
              // Force BACK if not already added (e.g. if history was empty)
              const backExists = finalOptions.some(o => o.value === "back_option");
              if (!backExists) {
                   finalOptions.push({ label: t("chatbot.options.back"), value: "back_option" });
              }
          }
      }

      // Add the Assistant Message with options
      if (responseText || finalOptions.length > 0) {
          
          // Check for negative response to append default options
          const negativeKeywords = ["sorry", "i cannot", "don't understand", "could not understand", "unable to answer", "apologies", "すみません", "分かりません"];
          const isNegative = negativeKeywords.some(kw => responseText.toLowerCase().includes(kw));
          
          // If negative response or NO options returned (and text exists), ensure default options are shown
          if (isNegative || (finalOptions.length === 0 && responseText)) {
              const defaultOptions = getInitialOptions();
              // Filter out duplicates if any (unlikely but safe)
              const uniqueDefaults = defaultOptions.filter(defOpt => !finalOptions.some(curr => curr.value === defOpt.value));
              finalOptions.push(...uniqueDefaults);
          }

          setMessages(prev => [...prev, { 
              role: "assistant", 
              content: responseText, 
              options: finalOptions 
          }]);
          
          // Save valid assistant response to history
          if (finalOptions.length > 0) {
               setOptionHistory((prev) => [...prev, { 
                  options: finalOptions,
                  text: responseText
              }]);
          }
      }

    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { 
            role: "assistant", 
            content: t("chatbot.error_api"),
            options: [{ label: t("chatbot.options.start_again"), value: "start_again" }]
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================================================
     Helpers
  ========================================================= */ 
  const simulateTyping = async (text: string, options: Option[] = [], onComplete?: () => void) => {
    setIsLoading(true);
    // Add empty message first
    setMessages((prev) => [...prev, { role: "assistant", content: "", options: [] }]);
    
    let currentText = "";
    const chunkSize = 2;
    
    // Animate text
    for (let i = 0; i < text.length; i += chunkSize) {
        currentText += text.slice(i, i + chunkSize);
        await new Promise(r => setTimeout(r, 10)); // Faster typing
        
        setMessages((prev) => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg.role === "assistant") {
                lastMsg.content = currentText;
            }
            return newMessages;
        });
    }

    // Reveal options at the end
    setMessages((prev) => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg.role === "assistant") {
            lastMsg.options = options;
        }
        return newMessages;
    });
    
    setIsLoading(false);
    if (onComplete) onComplete();
  };


  const handleOptionSelect = (value: string, label: string) => {
    
    // --- 1. GLOBAL ACTIONS (Start Again / Back) ---
    if (value === "start_again") {
        setMessages((prev) => [
          ...prev,
          { role: "user", content: t("chatbot.options.start_again") },
        ]);
        setOptionHistory([]); 
        
        simulateTyping(
           t("chatbot.welcome"),
           getInitialOptions()
        );
        return;
    }
    
    if (value === "back_option") {
        const newHistory = [...optionHistory];
        
        // Remove current state
        const currentState = newHistory.pop();
        
        // Get previous state
        const previousState = newHistory.pop();
        
        if (previousState) {
            // Add "Back" user message
            setMessages(m => [...m, { role: "user", content: t("chatbot.options.back") }]);
            
            // Add previous options as Bot message
            const content = previousState.text || t("chatbot.help_text.previous_options");
            setMessages(m => [...m, { 
                role: "assistant", 
                content: content,
                options: previousState.options
            }]);
            
            // Restore previous state as current
            newHistory.push(previousState);
            setOptionHistory(newHistory);
        } else {
             // Fallback to start
             setMessages(m => [...m, { role: "user", content: t("chatbot.options.back") }]);
             
             // Reset to welcome
             setMessages(m => [...m, { 
                role: "assistant", 
                content: t("chatbot.welcome"), 
                options: getInitialOptions() 
            }]);
            
            // History remains empty (init state)
            setOptionHistory([]);
        }
        return;
    }

    // --- 1.0 SPECIAL CASE: SEARCH ROUTES (Client Side) ---
    if (value === "search_routes") {
         setMessages(prev => [...prev, { role: "user", content: t("chatbot.options.search_routes") }]);
         
         const link = "https://world.jorudan.co.jp/mln/en/";
         const helpText = t("chatbot.help_text.search_routes");
         
         const confirmOptions: Option[] = [
             { label: t("chatbot.options.search_routes"), value: "CONFIRM_search_routes", link: link },
             { label: t("chatbot.options.start_again"), value: "start_again" }
         ];

         // Add BACK if history exists (optional but good for consistency)
         if (optionHistory.length > 0) {
            confirmOptions.splice(1, 0, { label: t("chatbot.options.back"), value: "back_option" });
         }

         setTimeout(() => {
             setMessages(prev => [...prev, { 
                role: "assistant", 
                content: helpText,
                options: confirmOptions
            }]);
             setOptionHistory(prev => [...prev, {
                text: helpText,
                options: confirmOptions
            }]);
         }, 500);
         return;
    }

    // --- 1.1 SPECIAL CASE: USING PAID TRAINS (Client Side) ---
    if (value === "paid_trains") {
         setMessages(prev => [...prev, { role: "user", content: t("chatbot.options.paid_trains") }]);
         
         const link = "https://www.kintetsu.co.jp/foreign/english/about/limited_express/index.html";
         const helpText = t("chatbot.help_text.paid_trains");
         
         const confirmOptions: Option[] = [
             { label: t("chatbot.options.paid_trains"), value: "CONFIRM_paid_trains", link: link },
             { label: t("chatbot.options.back"), value: "back_option" },
             { label: t("chatbot.options.start_again"), value: "start_again" }
         ];

         setTimeout(() => {
             setMessages(prev => [...prev, { 
                role: "assistant", 
                content: helpText,
                options: confirmOptions
            }]);
            setOptionHistory(prev => [...prev, {
                text: helpText,
                options: confirmOptions
            }]);
         }, 500);
         return;
    }

    // --- 1.2 EXTERNAL LINKS (Client-Side 2nd Click Logic) ---
    // Search REVERSE to find the most recent message containing this option value
    let selectedOption: Option | undefined;
    
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.role === "assistant" && msg.options) {
            const found = msg.options.find(opt => opt.value === value);
            if (found) {
                selectedOption = found;
                break;
            }
        }
    }
    
    // Fallback if not found (e.g. if it was CONFIRM_ prefixed)
    if (!selectedOption && value.startsWith("CONFIRM_")) {
        const originalValue = value.replace("CONFIRM_", "");
        
        // Search again for the original value
        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            if (msg.role === "assistant" && msg.options) {
                const found = msg.options.find(opt => opt.value === originalValue);
                if (found) {
                    selectedOption = found;
                    break;
                }
            }
        }
    }


    if (selectedOption?.link) {
         // CASE A: Already verified (2nd Click) - Value has CONFIRM_ prefix from previous step
         // But wait, the button in previous step was generated with value `CONFIRM_${value}`.
         // So `value` passed here IS `CONFIRM_...`.
         if (value.startsWith("CONFIRM_")) {
             window.open(selectedOption.link, "_blank");
             return;
        }

        // CASE B: First Click -> Show Confirmation
        setMessages(prev => [...prev, { role: "user", content: label }]);

        const helpText = selectedOption.helptext || t("chatbot.help_text.click_to_visit", { label });
        const confirmOption: Option = {
            ...selectedOption,
            value: `CONFIRM_${value}`, 
            label: label 
        };
        const confirmOptions = [confirmOption];

        if (optionHistory.length > 0) {
            confirmOptions.push({ label: t("chatbot.options.back"), value: "back_option" });
        }
        confirmOptions.push({ label: t("chatbot.options.start_again"), value: "start_again" });
        
        setTimeout(() => {
             setMessages(prev => [...prev, { 
                role: "assistant", 
                content: helpText,
                options: confirmOptions
            }]);
            
            // Add to history so BACK works from here
            setOptionHistory(prev => [...prev, {
                text: helpText,
                options: confirmOptions
            }]);
            
        }, 500); 

        return;
    }

    // --- 2. DEFAULT ACTION (Call API) ---
    sendMessage(label);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if input matches an existing option (Case-insensitive)
    const lowerInput = input.trim().toLowerCase();
    
    // dynamic options from current locale
    const currentOptions = getInitialOptions();
    
    // Also include "back" if relevant, though less likely to be typed blindly
    const commonOptions = [
        ...currentOptions,
        { label: t("chatbot.options.start_again"), value: "start_again" },
        { label: t("chatbot.options.back"), value: "back_option" },
        // Add English fallback just in case
        { label: "Search Routes", value: "search_routes" },
        { label: "Transit Options", value: "transit_options" },
        { label: "Transit Stations", value: "transit_stations" },
        { label: "Using Paid Trains", value: "paid_trains" },
        { label: "Start Again", value: "start_again" },
        { label: "Back", value: "back_option" }
    ];

    const matchedOption = commonOptions.find(opt => opt.label.toLowerCase() === lowerInput);

    if (matchedOption) {
        // Clear input manually since handleOptionSelect doesn't clear it (it expects button click)
        setInput("");
        handleOptionSelect(matchedOption.value, matchedOption.label);
        return;
    }

    sendMessage(input, true, true);
  };

  return (
    <div className="w-full h-full bg-card text-card-foreground border-x border-y sm:border border-border sm:rounded-xl shadow-2xl flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-card text-card-foreground border-b border-border shadow-sm shrink-0">
        <h3 className="font-semibold text-lg tracking-wide">{t("chatbot.title")}</h3>
        <div className="flex gap-2">

            <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
            <X className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-muted/30 scrollbar-track-transparent"
        ref={scrollRef}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <ChatMessage role={msg.role} content={msg.content} options={msg.options} onOptionSelect={handleOptionSelect} />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && messages[messages.length - 1].role !== "assistant" && (
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="flex justify-start mb-4"
           >
               <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden border border-border mr-2">
                 <img src="/logos/gose_logo.png" alt="Bot" className="w-full h-full object-cover" />
              </div>
              <div className="bg-muted text-muted-foreground px-4 py-3 rounded-2xl rounded-bl-none text-sm animate-pulse shadow-sm">
                {t("chatbot.thinking")}
              </div>
           </motion.div>
        )}
      </div>



      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 pt-2 bg-muted/20 backdrop-blur-sm flex items-center gap-2"
      >
        <button
          type="button"
          onClick={() => {
              setMessages([{ role: "assistant", content: t("chatbot.welcome"), options: getInitialOptions() }]);
              setOptionHistory([]);
              setInput("");
          }}
          className="p-3 bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-full transition-all shadow-sm transform hover:scale-105"
          title={t("chatbot.reset_chat")}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("chatbot.input_placeholder")}
          className="flex-1 px-4 py-3 border border-input rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm bg-background text-foreground placeholder-muted-foreground shadow-sm"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-3 bg-primary text-primary-foreground rounded-full hover:opacity-90 disabled:opacity-50 transition-all shadow-md transform hover:scale-105"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
