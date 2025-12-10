export const getPlainText = (content: any): string => {
  if (!content) return '';
  
  let text = '';
  
  if (typeof content === 'string') {
    // Check if it's JSON
    if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
        try {
            const parsed = JSON.parse(content);
            // Handle Tiptap JSON structure
            if (parsed.type === 'doc' && Array.isArray(parsed.content)) {
                 text = extractTextFromTiptapJSON(parsed);
            } else if (parsed.text) {
                text = parsed.text;
            } else {
                // Fallback: it might be just a JSON object we don't know, try stringifying or ignoring
                // But wait, if it's HTML stringified? 
                // " <p>... " is not valid JSON usually unless quoted.
                // If it is NOT JSON, we treat as HTML string.
            }
        } catch (e) {
            // Not JSON, treat as HTML string
            text = extractTextFromHTML(content);
        }
    } else {
        // Plain string (HTML)
        text = extractTextFromHTML(content);
    }
  } else if (typeof content === 'object') {
      // Direct object (Tiptap JSON)
       if (content.type === 'doc') {
           text = extractTextFromTiptapJSON(content);
       }
  }

  return text;
};

export const getRenderableHTML = (content: any): string => {
    if (!content) return '';
    if (typeof content === 'string') {
        // Try to parse if it looks like JSON
        if (content.trim().startsWith('{') && content.includes('"type":"doc"')) {
             try {
                 const parsed = JSON.parse(content);
                 // We don't have a server-side/client-side Tiptap renderer easily accessible here 
                 // without "generateHTML" from @tiptap/html.
                 // However, we can try to return the raw content if the component expects it, 
                 // OR we rely on Tiptap <EditorContent> to render it if passed as 'content'.
                 // But ReadBlogPage uses dangerouslySetInnerHTML.
                 // So we MUST return HTML.
                 // If we have Tiptap JSON string, we can't easily convert to HTML without the schema and library functions.
                 // For now, let's assume if it is JSON, we might fail to render it properly in dangerouslySetInnerHTML 
                 // UNLESS we use a library.
                 // BUT, the existing bug says "some are still shown in json format".
                 // If I can't convert JSON->HTML easily without `generateHTML`, 
                 // I should ensure NEW posts are saved as HTML (which they are).
                 // For OLD posts (JSON), I might display a "Format not supported" or try basic extraction.
                 // OR, since `WriteBlogPage` uses `editor.getHTML()`, maybe the issue is that SOME posts were saved as JSON.
                 // If I use `extractTextFromTiptapJSON` I get plain text, which is better than raw JSON.
                 // So for JSON content, I will return wrapped plain text as HTML.
                 return `<p>${extractTextFromTiptapJSON(parsed)}</p>`;
             } catch (e) {
                 return content;
             }
        }
        return content;
    }
    return '';
};

const extractTextFromHTML = (html: string): string => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

const extractTextFromTiptapJSON = (json: any): string => {
    if (!json.content) return '';
    return json.content.map((node: any) => {
        if (node.type === 'text') return node.text;
        if (node.content) return extractTextFromTiptapJSON(node);
        return ' ';
    }).join('');
}
