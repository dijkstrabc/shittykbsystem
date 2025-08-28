
export const API_URL = 'http://10.10.50.202:11327/v1/chat/completions';
const MODEL_NAME = 'local-llm'; // A generic name since one wasn't provided

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
 * A helper function to call the OpenAI-compatible chat completions API.
 * @param messages The array of messages to send to the model.
 * @returns The parsed JSON content from the model's response.
 * @throws An error if the API call fails or the response is invalid.
 */
async function callChatCompletions(messages: { role: string; content: string }[]): Promise<any> {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: messages,
                response_format: { type: 'json_object' },
            }),
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

        return JSON.parse(content);
    } catch (error) {
        // Re-throw the error to be handled by the calling component
        throw handleApiError(error);
    }
}

/**
 * Tests the connection to the AI API endpoint and provides detailed feedback.
 * @returns A success message.
 * @throws An error with detailed diagnostic information if the connection fails.
 */
export const testApiConnection = async (): Promise<string> => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [{ role: 'user', content: 'Say "hello"' }],
                max_tokens: 2,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API 请求失败，状态码: ${response.status}。响应: ${errorBody}`);
        }

        const data = await response.json();
        if (data.choices?.[0]?.message?.content) {
            return "API 连接成功，并收到有效响应。";
        } else {
            throw new Error('API 响应格式无效。');
        }
    } catch (error) {
        console.error("Error testing API connection:", error);
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
             throw new Error('网络请求失败 (Failed to fetch)。这是一个常见的浏览器端网络问题，请参考下方的解决方案进行排查。');
        }
        throw error;
    }
};


export const generateSimilarQuestions = async (standardQuestion: string): Promise<string[]> => {
    const messages = [
        { 
            role: 'system', 
            content: 'You are a helpful assistant that generates JSON data.' 
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
            content: 'You are a helpful assistant that analyzes documents and extracts key information as JSON-formatted question-answer pairs.'
        },
        {
            role: 'user',
            content: `分析以下文档，并将其中的关键信息提取为问答对。问题应该是用户可能会问的问题，答案应该简洁并直接来源于文档。请严格以JSON格式返回，格式为：{"qa_pairs": [{"question": "问题1", "answer": "答案1"}, {"question": "问题2", "answer": "答案2"}]}. 文档内容：\n\n${docContent}`
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
