import type { LlmConfig } from '../types';

const DEFAULT_LLM_CONFIG: LlmConfig = {
  apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  apiKey: '',
  modelName: 'glm-4.5-x',
  contextLength: 32768,
  streamMode: true,
  thinking: false,
};


/**
 * Gets the full LLM configuration from local storage, merging with defaults.
 * @returns The LLM configuration object.
 */
export const getLlmConfig = (): LlmConfig => {
    try {
        const stored = localStorage.getItem('llm_config');
        if (stored) {
            return { ...DEFAULT_LLM_CONFIG, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.error("Failed to parse LLM config from localStorage", e);
    }
    return DEFAULT_LLM_CONFIG;
};

/**
 * Saves the LLM configuration to local storage.
 * @param config The partial or full configuration object to save.
 */
export const setLlmConfig = (config: Partial<LlmConfig>) => {
    const currentConfig = getLlmConfig();
    const newConfig = { ...currentConfig, ...config };
    localStorage.setItem('llm_config', JSON.stringify(newConfig));
};

/**
 * Validates that header values do not contain invalid characters.
 * @param config The LLM configuration containing values used in headers.
 * @throws An error if validation fails.
 */
function validateHeaders(config: LlmConfig) {
    // This regex checks for any characters outside the Latin-1 Supplement block (U+0000 to U+00FF),
    // which is what `fetch` headers are restricted to.
    const nonLatin1Regex = /[^\u0000-\u00ff]/;
    if (nonLatin1Regex.test(config.apiKey)) {
        throw new Error('API Key 包含无效字符 (例如中文或全角符号)。请检查并修正您的 API Key。');
    }
}


/**
 * Creates a standardized error for API failures, providing user-friendly advice.
 * @param error The original error caught.
 * @returns A new Error object with a user-friendly message.
 */
function handleApiError(error: unknown): Error {
    console.error("LLM API Error:", error);
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
         return new Error('网络请求失败。请前往“设置”页面使用连接测试工具，以获取关于如何解决跨域(CORS)、网络或混合内容问题的详细指引。');
    }
    if (error instanceof Error) {
        return error;
    }
    return new Error('发生了未知错误。');
}


/**
 * A helper function to call the OpenAI-compatible chat completions API for JSON-based responses.
 * @param messages The array of messages to send to the model.
 * @returns The parsed JSON content from the model's response.
 * @throws An error if the API call fails or the response is invalid.
 */
async function callChatCompletions(messages: { role: string; content: string }[]): Promise<any> {
    const config = getLlmConfig();
    try {
        validateHeaders(config); // Validate before making the request
        const body: Record<string, any> = {
            model: config.modelName,
            messages: messages,
        };

        if (config.thinking) {
            body.thinking = { type: 'enabled' };
        }

        const response = await fetch(config.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) {
            throw new Error('Invalid response structure from API');
        }
        
        // The response might be a JSON string that needs parsing.
        try {
            // Attempt to clean up the response before parsing.
             const cleanedContent = content
                .trim()
                .replace(/^```json\s*/, '')
                .replace(/```$/, '');
             return JSON.parse(cleanedContent);
        } catch (e) {
             console.error("Failed to parse content as JSON:", content);
             throw new Error("API returned content that is not valid JSON.");
        }

    } catch (error) {
        throw handleApiError(error);
    }
}

/**
 * Tests the connection to the AI API endpoint and provides detailed feedback.
 * @returns A success message.
 * @throws An error with detailed diagnostic information if the connection fails.
 */
export const testApiConnection = async (): Promise<string> => {
    const config = getLlmConfig();
    let responseData: any = null;
    try {
        validateHeaders(config); // Validate before making the request
        const body: Record<string, any> = {
            model: config.modelName,
            messages: [{ role: 'user', content: 'Say "hello"' }],
            max_tokens: 10, // Increased to prevent empty responses
        };

        if (config.thinking) {
            body.thinking = { type: 'enabled' };
        }

        const response = await fetch(config.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API 请求失败，状态码: ${response.status}。请检查您的API Endpoint、API Key和模型名称是否正确。响应: ${errorBody}`);
        }
        
        const responseText = await response.text();
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
             throw new Error(`无法解析API响应为JSON。请检查API Endpoint是否正确。收到的文本: "${responseText.slice(0, 100)}..."`);
        }
        
        // More robust check: As long as the API returns a 'choices' array, consider it a success.
        if (responseData.choices && Array.isArray(responseData.choices)) {
            return "API 连接成功，并收到有效响应。";
        } else {
            throw new Error(`API 响应格式无效。收到的响应: ${JSON.stringify(responseData)}`);
        }
    } catch (error) {
        console.error("Error testing API connection:", error);
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
             throw new Error('网络请求失败 (Failed to fetch)。这是一个常见的浏览器端网络问题，请参考下方的解决方案进行排查。');
        }
        throw error;
    }
};

/**
 * Performs a chat completion, supporting both streaming and non-streaming modes.
 * @param messages The chat history.
 * @param onDelta A callback function to handle streaming text chunks.
 * @returns For non-streaming, the full response text. For streaming, void.
 */
export const chat = async (
    messages: { role: 'user' | 'assistant'; content: string }[],
    onDelta: (chunk: string) => void
): Promise<string | void> => {
    const config = getLlmConfig();
    try {
        validateHeaders(config); // Validate before making the request
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
        };
        
        const body: Record<string, any> = {
            model: config.modelName,
            messages: messages,
            stream: config.streamMode,
            max_tokens: config.contextLength
        };

        if (config.thinking) {
            body.thinking = { type: 'enabled' };
        }

        const response = await fetch(config.apiUrl, { method: 'POST', headers, body: JSON.stringify(body) });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
        }

        if (config.streamMode) {
            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep the last, potentially incomplete line

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6).trim();
                        if (data === '[DONE]') {
                            return; // Stream finished
                        }
                        try {
                            const chunk = JSON.parse(data);
                            const content = chunk.choices?.[0]?.delta?.content;
                            if (content) {
                                onDelta(content);
                            }
                        } catch (e) {
                            console.error("Error parsing stream chunk", e, data);
                        }
                    }
                }
            }
        } else {
            const data = await response.json();
            return data.choices?.[0]?.message?.content || '';
        }

    } catch (error) {
        throw handleApiError(error);
    }
};


export const generateSimilarQuestions = async (standardQuestion: string): Promise<string[]> => {
    const messages = [
        { 
            role: 'system', 
            content: 'You are a helpful assistant that generates JSON data. Your response must be only the JSON object, with no additional text or explanations.'
        },
        {
            role: 'user',
            content: `根据标准问题“${standardQuestion}”，生成5个用户可能会问的相似问题。请严格以JSON格式返回，格式为：{"similar_questions": ["问题1", "问题2", "问题3", "问题4", "问题5"]}`
        }
    ];

    try {
        const result = await callChatCompletions(messages);
        if (result && Array.isArray(result.similar_questions)) {
            return result.similar_questions;
        }
        console.warn("API returned unexpected format for similar questions:", result);
        return [];
    } catch (error) {
        console.error("Error generating similar questions:", error);
        throw error; // Propagate error to UI
    }
};

export const generateQAPairsFromDoc = async (docContent: string): Promise<{ question: string, answer: string }[]> => {
     const messages = [
        {
            role: 'system',
            content: 'You are a helpful assistant that analyzes documents and extracts key information as JSON-formatted question-answer pairs. Your response must be only the JSON object, with no additional text or explanations.'
        },
        {
            role: 'user',
            content: `从以下文档中，提取出5个最关键的问答对。问题应该是用户实际可能会问的问题，答案应简洁并直接来源于文档。你必须严格以JSON格式返回，并且只返回JSON对象，不包含任何解释性文字或markdown标记。JSON格式为：{"qa_pairs": [{"question": "问题1", "answer": "答案1"}, {"question": "问题2", "answer": "答案2"}, {"question": "问题3", "answer": "答案3"}, {"question": "问题4", "answer": "答案4"}, {"question": "问题5", "answer": "答案5"}]}. 文档内容如下：\n\n${docContent}`
        }
    ];

    try {
        const result = await callChatCompletions(messages);
        if (result && Array.isArray(result.qa_pairs)) {
            return result.qa_pairs;
        }
        console.warn("API returned unexpected format for QA pairs:", result);
        return [];
    } catch (error) {
        console.error("Error generating Q&A pairs from document:", error);
        throw error; // Propagate error to UI
    }
};