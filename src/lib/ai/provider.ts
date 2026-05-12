import Groq from 'groq-sdk';

export type TextProvider = (prompt: string) => Promise<string>;

function groqProvider(apiKey: string): TextProvider {
    const client = new Groq({ apiKey });
    return async (prompt: string) => {
        const response = await client.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
        });
        return response.choices[0].message.content ?? '';
    };
}

export function getAiProvider(): TextProvider | null {
    if (process.env.GROQ_API_KEY) return groqProvider(process.env.GROQ_API_KEY);
    return null;
}
