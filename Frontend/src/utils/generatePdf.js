/**
 * Generate a PDF from topic content using the browser's native print engine.
 * Supports ALL languages/scripts (Tamil, Hindi, Kannada, Telugu, etc.)
 * with Google Noto Sans fonts and a clean book-page layout.
 */
import { apiFetch } from '@/utils/api';

/**
 * Convert markdown to styled HTML for the PDF.
 */
function mdToHtml(text) {
    if (!text) return '';
    let html = text
        .replace(/\r\n?/g, '\n')
        // Code blocks
        .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
            `<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`)
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Headers
        .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
        .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
        .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
        .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
        // Blockquotes
        .replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
        // Bold/italic
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/(?<![*\w])\*([^*\n]+?)\*(?![*\w])/g, '<em>$1</em>')
        // HR
        .replace(/^---+$/gm, '<hr/>')
        // Unordered lists
        .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
        // Ordered lists
        .replace(/^\d+\.\s+(.+)$/gm, '<li class="ol">$1</li>')
        // Wrap consecutive <li> in <ul>
        .replace(/((?:<li[^>]*>[\s\S]*?<\/li>\s*)+)/g, '<ul>$1</ul>')
        // Paragraphs
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>');

    return `<p>${html}</p>`;
}

const MODE_META = {
    explain: { label: 'Explain', color: '#6366f1', icon: '📖' },
    demonstrate: { label: 'Demonstrate', color: '#f59e0b', icon: '🔍' },
    try: { label: 'Let Me Try', color: '#10b981', icon: '✍️' },
    apply: { label: 'Apply', color: '#ec4899', icon: '🚀' },
};

/**
 * Fetch all 4 content modes and open a styled print window.
 */
export async function generateTopicPdf({ topicId, topicTitle, subjectName, langName }) {
    const modes = ['explain', 'demonstrate', 'try', 'apply'];

    const results = await Promise.all(
        modes.map(m => apiFetch(`/api/content/${topicId}/${m}?lang=${langName}`).catch(() => null))
    );

    let sectionsHtml = '';
    for (let i = 0; i < modes.length; i++) {
        const raw = results[i]?.content;
        if (!raw) continue;
        const meta = MODE_META[modes[i]];
        sectionsHtml += `
            <section class="section">
                <div class="section-header" style="border-color:${meta.color}">
                    <span class="section-icon">${meta.icon}</span>
                    <span class="section-label" style="color:${meta.color}">${meta.label}</span>
                </div>
                <div class="section-body">
                    ${mdToHtml(raw)}
                </div>
            </section>
        `;
    }

    if (!sectionsHtml) {
        throw new Error('No content available to generate PDF');
    }

    const fontsUrl = 'https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Noto+Sans+Tamil:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Sans+Kannada:wght@400;600;700&family=Noto+Sans+Telugu:wght@400;600;700&display=swap';

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${topicTitle} – ${subjectName} – AuraLab</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="${fontsUrl}" rel="stylesheet">
    <style>
        *, *::before, *::after {
            margin: 0; padding: 0; box-sizing: border-box;
        }

        body {
            font-family: 'Noto Sans', 'Noto Sans Tamil', 'Noto Sans Devanagari',
                         'Noto Sans Kannada', 'Noto Sans Telugu', system-ui, sans-serif;
            color: #27272a;
            font-size: 11px;
            line-height: 1.7;
            padding: 32px 40px;
            max-width: 700px;
            margin: 0 auto;
            word-wrap: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        @media print {
            body { padding: 0; max-width: none; font-size: 10.5px; }
            @page { margin: 18mm 16mm; size: A4; }
            .section { page-break-inside: avoid; }
        }

        /* ── Header ── */
        .header {
            text-align: center;
            padding-bottom: 16px;
            margin-bottom: 20px;
            border-bottom: 1.5px solid #6366f1;
        }
        .header h1 {
            font-size: 18px;
            font-weight: 800;
            color: #18181b;
            letter-spacing: -0.03em;
            margin-bottom: 4px;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        .header-meta {
            font-size: 10px;
            color: #71717a;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            flex-wrap: wrap;
        }
        .header-meta .brand { font-weight: 700; color: #6366f1; }
        .header-meta .dot { color: #d4d4d8; }

        /* ── Sections ── */
        .section {
            margin-bottom: 22px;
        }
        .section-header {
            display: flex;
            align-items: center;
            gap: 6px;
            padding-bottom: 5px;
            border-bottom: 2px solid;
            margin-bottom: 8px;
        }
        .section-icon { font-size: 12px; }
        .section-label {
            font-size: 13px;
            font-weight: 700;
            letter-spacing: -0.01em;
        }
        .section-body {
            padding-left: 4px;
        }
        .section-body p {
            margin: 5px 0;
            text-align: justify;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        .section-body h1 { font-size: 14px; font-weight: 800; margin: 12px 0 5px; color: #18181b; }
        .section-body h2 { font-size: 13px; font-weight: 700; margin: 10px 0 4px; color: #18181b; border-bottom: 1px solid #e4e4e7; padding-bottom: 3px; }
        .section-body h3 { font-size: 12px; font-weight: 700; margin: 10px 0 4px; color: #3f3f46; }
        .section-body h4 { font-size: 11.5px; font-weight: 600; margin: 8px 0 3px; color: #52525b; }

        strong { font-weight: 700; color: #18181b; }
        em { color: #52525b; }

        code {
            background: #f4f4f5;
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 0.9em;
            font-family: 'Consolas', 'Fira Code', monospace;
            border: 1px solid #e4e4e7;
            word-break: break-all;
        }
        pre {
            background: #fafafa;
            border: 1px solid #e4e4e7;
            border-radius: 6px;
            padding: 10px 12px;
            overflow-x: auto;
            margin: 8px 0;
            max-width: 100%;
        }
        pre code {
            background: none;
            padding: 0;
            border: none;
            font-size: 10px;
            line-height: 1.5;
            word-break: normal;
            white-space: pre-wrap;
        }

        ul, ol {
            padding-left: 20px;
            margin: 5px 0;
        }
        li {
            margin-bottom: 3px;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        li.ol { list-style-type: decimal; }

        blockquote {
            border-left: 3px solid #6366f1;
            padding: 6px 12px;
            margin: 8px 0;
            background: #faf5ff;
            border-radius: 0 4px 4px 0;
            color: #52525b;
            font-style: italic;
            font-size: 10.5px;
        }

        hr {
            border: none;
            border-top: 1px solid #e4e4e7;
            margin: 12px 0;
        }

        /* ── Footer ── */
        .footer {
            margin-top: 24px;
            padding-top: 10px;
            border-top: 1px solid #e4e4e7;
            text-align: center;
            font-size: 9px;
            color: #a1a1aa;
        }
        .footer strong { color: #6366f1; font-weight: 600; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${topicTitle}</h1>
        <div class="header-meta">
            <span class="brand">AuraLab</span>
            <span class="dot">·</span>
            <span>${subjectName}</span>
            <span class="dot">·</span>
            <span>${langName}</span>
        </div>
    </div>

    ${sectionsHtml}

    <div class="footer">
        Generated by <strong>AuraLab</strong> · ${topicTitle} · ${new Date().toLocaleDateString()}
    </div>

    <script>
        function waitForFonts() {
            return new Promise(resolve => {
                if (document.fonts && document.fonts.ready) {
                    document.fonts.ready.then(() => setTimeout(resolve, 600));
                } else {
                    setTimeout(resolve, 2500);
                }
            });
        }
        waitForFonts().then(() => window.print());
    </script>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        throw new Error('Pop-up blocked. Please allow pop-ups for this site and try again.');
    }
    printWindow.document.write(html);
    printWindow.document.close();
}
