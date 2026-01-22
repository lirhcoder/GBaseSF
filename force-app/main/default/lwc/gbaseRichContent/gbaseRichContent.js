import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript } from 'lightning/platformResourceLoader';

export default class GbaseRichContent extends LightningElement {
    @api content = ''; // Raw content (markdown or structured)
    @api contentType = 'markdown'; // 'markdown', 'structured', 'plain'

    @track images = [];
    @track tableData = [];
    @track tableColumns = [];
    @track codeContent = '';
    @track codeLanguage = '';
    @track mermaidCode = '';
    @track showImageModal = false;
    @track modalImageUrl = '';

    mermaidInitialized = false;
    renderedCallback() {
        this.renderContent();
    }

    get hasTextContent() {
        return this.content && this.contentType !== 'structured';
    }

    get hasImages() {
        return this.images && this.images.length > 0;
    }

    get hasTable() {
        return this.tableData && this.tableData.length > 0;
    }

    get hasMermaid() {
        return this.mermaidCode && this.mermaidCode.length > 0;
    }

    get hasCode() {
        return this.codeContent && this.codeContent.length > 0;
    }

    get codeClass() {
        return `language-${this.codeLanguage || 'text'}`;
    }

    renderContent() {
        if (!this.content) return;

        if (this.contentType === 'structured') {
            this.parseStructuredContent();
        } else {
            this.parseMarkdownContent();
        }
    }

    // Parse structured JSON content
    parseStructuredContent() {
        try {
            const data = typeof this.content === 'string' ? JSON.parse(this.content) : this.content;

            // Handle images
            if (data.images) {
                this.images = data.images.map((img, idx) => ({
                    id: `img-${idx}`,
                    url: img.url,
                    alt: img.alt || 'Image',
                    caption: img.caption
                }));
            }

            // Handle table
            if (data.table) {
                this.tableColumns = data.table.columns.map(col => ({
                    label: col.label,
                    fieldName: col.field,
                    type: col.type || 'text'
                }));
                this.tableData = data.table.rows.map((row, idx) => ({
                    id: `row-${idx}`,
                    ...row
                }));
            }

            // Handle mermaid
            if (data.mermaid) {
                this.mermaidCode = data.mermaid;
                this.renderMermaid();
            }

            // Handle code
            if (data.code) {
                this.codeContent = data.code.content;
                this.codeLanguage = data.code.language || 'text';
            }

            // Handle text/markdown
            if (data.text) {
                this.renderMarkdownToDOM(data.text);
            }

        } catch (e) {
            console.error('Error parsing structured content:', e);
        }
    }

    // Parse markdown content
    parseMarkdownContent() {
        let markdown = this.content;

        // Extract and process images
        const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        const extractedImages = [];
        let match;
        while ((match = imageRegex.exec(markdown)) !== null) {
            extractedImages.push({
                id: `img-${extractedImages.length}`,
                alt: match[1],
                url: match[2],
                caption: match[1]
            });
        }
        if (extractedImages.length > 0) {
            this.images = extractedImages;
            // Remove image syntax from markdown for separate display
            markdown = markdown.replace(imageRegex, '');
        }

        // Extract mermaid code blocks
        const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
        const mermaidMatch = mermaidRegex.exec(markdown);
        if (mermaidMatch) {
            this.mermaidCode = mermaidMatch[1].trim();
            markdown = markdown.replace(mermaidRegex, '');
            this.renderMermaid();
        }

        // Extract code blocks (non-mermaid)
        const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
        const codeMatch = codeRegex.exec(markdown);
        if (codeMatch) {
            this.codeLanguage = codeMatch[1] || 'text';
            this.codeContent = codeMatch[2].trim();
            markdown = markdown.replace(codeRegex, '');
        }

        // Render remaining markdown to HTML
        this.renderMarkdownToDOM(markdown);
    }

    // Simple markdown to HTML converter
    renderMarkdownToDOM(markdown) {
        if (!markdown) return;

        let html = markdown;

        // Escape HTML
        html = html.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;');

        // Headers
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

        // Bold and Italic
        html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
        html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
        html = html.replace(/_(.+?)_/g, '<em>$1</em>');

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        // Blockquotes
        html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

        // Unordered lists
        html = html.replace(/^\s*[-*+] (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

        // Ordered lists
        html = html.replace(/^\s*\d+\. (.+)$/gm, '<li>$1</li>');

        // Tables
        html = this.parseMarkdownTable(html);

        // Paragraphs
        html = html.replace(/\n\n+/g, '</p><p>');
        html = '<p>' + html + '</p>';

        // Clean up empty paragraphs
        html = html.replace(/<p>\s*<\/p>/g, '');
        html = html.replace(/<p>\s*(<h[1-3]>)/g, '$1');
        html = html.replace(/(<\/h[1-3]>)\s*<\/p>/g, '$1');
        html = html.replace(/<p>\s*(<ul>)/g, '$1');
        html = html.replace(/(<\/ul>)\s*<\/p>/g, '$1');
        html = html.replace(/<p>\s*(<blockquote>)/g, '$1');
        html = html.replace(/(<\/blockquote>)\s*<\/p>/g, '$1');
        html = html.replace(/<p>\s*(<table>)/g, '$1');
        html = html.replace(/(<\/table>)\s*<\/p>/g, '$1');

        // Line breaks
        html = html.replace(/\n/g, '<br/>');

        // Set the HTML content
        const container = this.template.querySelector('.text-content');
        if (container) {
            container.innerHTML = html;
        }
    }

    // Parse markdown tables
    parseMarkdownTable(html) {
        const tableRegex = /\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g;

        return html.replace(tableRegex, (match, headerRow, bodyRows) => {
            // Parse header
            const headers = headerRow.split('|').map(h => h.trim()).filter(h => h);
            let tableHtml = '<table><thead><tr>';
            headers.forEach(h => {
                tableHtml += `<th>${h}</th>`;
            });
            tableHtml += '</tr></thead><tbody>';

            // Parse body rows
            const rows = bodyRows.trim().split('\n');
            rows.forEach(row => {
                const cells = row.split('|').map(c => c.trim()).filter(c => c);
                tableHtml += '<tr>';
                cells.forEach(cell => {
                    tableHtml += `<td>${cell}</td>`;
                });
                tableHtml += '</tr>';
            });

            tableHtml += '</tbody></table>';
            return tableHtml;
        });
    }

    // Render Mermaid diagram
    async renderMermaid() {
        if (!this.mermaidCode) return;

        // Use Mermaid.ink service for rendering (no local library needed)
        const encoded = btoa(this.mermaidCode);
        const svgUrl = `https://mermaid.ink/svg/${encoded}`;

        const container = this.template.querySelector('.mermaid-diagram');
        if (container) {
            const img = document.createElement('img');
            img.src = svgUrl;
            img.alt = 'Mermaid Diagram';
            img.style.maxWidth = '100%';
            img.onerror = () => {
                // Fallback: show code if rendering fails
                container.innerHTML = `<pre style="background:#f4f6f9;padding:1rem;border-radius:0.5rem;overflow-x:auto;"><code>${this.escapeHtml(this.mermaidCode)}</code></pre>`;
            };
            container.innerHTML = '';
            container.appendChild(img);
        }
    }

    escapeHtml(text) {
        return text.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;')
                   .replace(/"/g, '&quot;')
                   .replace(/'/g, '&#039;');
    }

    // Image click handler
    handleImageClick(event) {
        this.modalImageUrl = event.target.dataset.url;
        this.showImageModal = true;
    }

    closeImageModal() {
        this.showImageModal = false;
        this.modalImageUrl = '';
    }

    // Copy code handler
    async handleCopyCode() {
        try {
            await navigator.clipboard.writeText(this.codeContent);
            this.dispatchEvent(new ShowToastEvent({
                title: 'Success',
                message: 'Code copied to clipboard',
                variant: 'success'
            }));
        } catch (error) {
            console.error('Copy failed:', error);
        }
    }
}