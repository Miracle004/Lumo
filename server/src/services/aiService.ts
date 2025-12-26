import { GoogleGenerativeAI } from '@google/generative-ai';

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  return new GoogleGenerativeAI(apiKey);
};

export const generateBlogTitle = async (content: string): Promise<string> => {
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Sanitize/Truncate content if necessary to avoid token limits, though 1.5 flash has a large context window.
    // Taking the first 5000 chars should be enough for a title.
    const truncatedContent = content.substring(0, 5000); 

    const prompt = `Generate a single catchy, creative, and SEO-friendly blog post title for the following content. 
    The title should be engaging but not clickbait.
    Return ONLY the title text, no quotes, no explanations.
    
    Content:
    ${truncatedContent}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text.trim();
  } catch (error) {
    console.error('AI Service Error:', error);
    throw new Error('Failed to generate title');
  }
};
