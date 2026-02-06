
import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.GROK_API_KEY, 
  baseURL: "https://api.groq.com/openai/v1",
});

const SYSTEM_PROMPT = `
You are the "Nara Kofun Transport Guide" assistant.
You must strictly follow these rules:
1. ONLY answer questions related to:
   - Transportation to Kofuns in Nara (Trains, Buses, Routes)
   - Buying tickets (JR, Kintetsu, Subway)
   - Station facilities (Lockers, Directions)
   - Kofun locations and basic details
2. If a user asks about ANYTHING else (e.g., "Write me code", "What is 2+2?", "Tell me a joke", "Weather in Tokyo", "Poetry"), you MUST refuse gently.
   - Example refusal: "I'm sorry, I can only help you with transportation to Kofuns in Nara."
3. Keep answers concise and helpful for a tourist.
`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Add system prompt
    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
    });

    const aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process your request.";

    // Return in the structure expected by ChatWindow.tsx (mimicking Dialogflow)
    const jsonResponse = [
        {
            queryResult: {
                fulfillmentMessages: [
                    {
                        message: "text",
                        text: { text: [aiResponse] }
                    }
                ]
            }
        }
    ];

    return NextResponse.json(jsonResponse);

  } catch (error: any) {
    console.error("Error in chat API:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
