import React, { useEffect, useRef } from 'react';

const FormattedResponse = ({ text }) => {
  const containerRef = useRef(null);
  const mathJaxLoadedRef = useRef(false);

  useEffect(() => {
    if (!text) return;

    const typesetMath = () => {
      if (window.MathJax?.typesetPromise && containerRef.current) {
        window.MathJax.typesetClear?.([containerRef.current]);
        window.MathJax.typesetPromise([containerRef.current]).catch((err) =>
          console.error('MathJax typeset error:', err)
        );
      }
    };

    if (!mathJaxLoadedRef.current && !window.MathJax) {
      window.MathJax = {
        tex: {
          inlineMath: [['\\(', '\\)'], ['$', '$']],
          displayMath: [['\\[', '\\]'], ['$$', '$$']],
          processEscapes: true,
          processEnvironments: true,
          packages: { '[+]': ['ams', 'newcommand'] },
        },
        options: {
          skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
          ignoreHtmlClass: 'tex2jax_ignore',
          processHtmlClass: 'tex2jax_process',
        },
        startup: {
          typeset: false,
          ready: () => {
            window.MathJax.startup.defaultReady();
            typesetMath();
          },
        },
      };

      const script = document.createElement('script');
      script.src =
        'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.min.js';
      script.async = true;
      script.onload = () => {
        mathJaxLoadedRef.current = true;
        typesetMath();
      };
      document.head.appendChild(script);
    } else {
      typesetMath();
    }
  }, [text]);

  if (!text) return null;

  const parseInlineFormatting = (input) => {
    const parts = [];
    let remaining = input;
    let key = 0;

    while (remaining.length > 0) {
      // Inline math: \( ... \)
      const latexParen = remaining.match(/^\\\((.+?)\\\)/);
      if (latexParen) {
        parts.push(
          <span key={`math-paren-${key++}`} className="math-inline">
            {'\\(' + latexParen[1] + '\\)'}
          </span>
        );
        remaining = remaining.slice(latexParen[0].length);
        continue;
      }

      // Inline math: $ ... $
      const latexDollar = remaining.match(/^\$([^$]+)\$/);
      if (latexDollar) {
        parts.push(
          <span key={`math-dollar-${key++}`} className="math-inline">
            {'$' + latexDollar[1] + '$'}
          </span>
        );
        remaining = remaining.slice(latexDollar[0].length);
        continue;
      }

      // Bold **text**
      const bold = remaining.match(/^\*\*([^*]+?)\*\*/);
      if (bold) {
        parts.push(
          <strong key={`bold-${key++}`} className="font-bold text-white">
            {parseInlineFormatting(bold[1])}
          </strong>
        );
        remaining = remaining.slice(bold[0].length);
        continue;
      }

      // Italic *text*
      const italic = remaining.match(/^\*([^*]+?)\*(?!\*)/);
      if (italic) {
        parts.push(
          <em key={`italic-${key++}`} className="italic text-gray-300">
            {parseInlineFormatting(italic[1])}
          </em>
        );
        remaining = remaining.slice(italic[0].length);
        continue;
      }

      // Code `text`
      const code = remaining.match(/^`([^`]+?)`/);
      if (code) {
        parts.push(
          <code
            key={`code-${key++}`}
            className="bg-gray-800 text-blue-300 px-1.5 py-0.5 rounded text-sm font-mono"
          >
            {code[1]}
          </code>
        );
        remaining = remaining.slice(code[0].length);
        continue;
      }

      // Link [text](url)
      const link = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (link) {
        parts.push(
          <a
            key={`link-${key++}`}
            href={link[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            {link[1]}
          </a>
        );
        remaining = remaining.slice(link[0].length);
        continue;
      }

      // Plain text
      const nextSpecial = remaining.search(/[\*`\[\\$]/);
      if (nextSpecial === -1) {
        parts.push(<span key={`text-${key++}`}>{remaining}</span>);
        break;
      }
      if (nextSpecial > 0) {
        parts.push(<span key={`text-${key++}`}>{remaining.slice(0, nextSpecial)}</span>);
        remaining = remaining.slice(nextSpecial);
      } else {
        parts.push(<span key={`text-${key++}`}>{remaining[0]}</span>);
        remaining = remaining.slice(1);
      }
    }

    return parts;
  };

  const formatText = (inputText) => {
    const lines = inputText.split('\n');
    const elements = [];
    let key = 0;
    let inDisplayMath = false;
    let mathBuffer = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Display math block
      if (trimmed.startsWith('\\[')) {
        inDisplayMath = true;
        mathBuffer = [line];
        continue;
      }
      if (inDisplayMath) {
        mathBuffer.push(line);
        if (trimmed.endsWith('\\]')) {
          elements.push(
            <div key={`display-${key++}`} className="math-display text-center my-4">
              {mathBuffer.join('\n')}
            </div>
          );
          inDisplayMath = false;
          mathBuffer = [];
        }
        continue;
      }

      if (trimmed === '---' || trimmed === '***') {
        elements.push(
          <hr key={`hr-${key++}`} className="my-4 border-t border-gray-600" />
        );
        continue;
      }

      if (trimmed === '') {
        elements.push(<div key={`space-${key++}`} className="h-2" />);
        continue;
      }

      const heading = line.match(/^\*\*(.+?)\*\*:?$/);
      if (heading) {
        elements.push(
          <h3 key={`heading-${key++}`} className="text-lg font-bold text-white mt-4 mb-2">
            {parseInlineFormatting(heading[1])}
          </h3>
        );
        continue;
      }

      const numbered = line.match(/^(\d+)[\.)]\s+(.+)$/);
      if (numbered) {
        elements.push(
          <div key={`num-${key++}`} className="flex gap-2 ml-4 mb-2">
            <span className="text-blue-400 font-semibold">{numbered[1]}.</span>
            <div>{parseInlineFormatting(numbered[2])}</div>
          </div>
        );
        continue;
      }

      const bullet = line.match(/^[\*\-•]\s+(.+)$/);
      if (bullet) {
        elements.push(
          <div key={`bullet-${key++}`} className="flex gap-2 ml-4 mb-2">
            <span className="text-blue-400">•</span>
            <div>{parseInlineFormatting(bullet[1])}</div>
          </div>
        );
        continue;
      }

      elements.push(
        <p key={`para-${key++}`} className="mb-2 leading-relaxed">
          {parseInlineFormatting(line)}
        </p>
      );
    }

    return elements;
  };

  return (
    <div ref={containerRef} className="formatted-response text-gray-200">
      {formatText(text)}
    </div>
  );
};

export default FormattedResponse;
