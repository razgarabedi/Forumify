
"use client";

import React, { useState, RefObject, useCallback } from 'react';
import {
    Bold, Italic, Link as LinkIcon, List, ListOrdered, Quote, Code, SmilePlus, Image as ImageIcon, Strikethrough,
    Highlighter, 
    AlignCenter, AlignLeft, AlignRight, AlignJustify, 
    Superscript, Subscript,
    Sparkles, 
    Droplets, 
    EyeOff, 
    Youtube,
    Palette, 
    CaseSensitive, 
    Table, 
    Underline,
    SquareCode // Used for <pre>
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useTheme } from 'next-themes';

interface RichTextToolbarProps {
    textareaRef: RefObject<HTMLTextAreaElement>;
    onContentChange: (newContent: string) => void;
    currentContent: string;
}

// Simplified HTML Element type for parser
interface SimpleHtmlElement {
    tagName: string;
    attributes: { [key: string]: string };
    children: (SimpleHtmlElement | string)[];
    style?: CSSStyleDeclaration; 
}


function parseHtmlToSimpleStructure(htmlString: string): (SimpleHtmlElement | string)[] {
    if (typeof window === 'undefined' || !window.DOMParser) {
        return [htmlString];
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    function parseNode(node: Node): (SimpleHtmlElement | string) | null {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent || "";
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            const children = Array.from(element.childNodes).map(parseNode).filter(n => n !== null) as (SimpleHtmlElement | string)[];
            
            const attributes: { [key: string]: string } = {};
            for (let i = 0; i < element.attributes.length; i++) {
                const attr = element.attributes[i];
                attributes[attr.name] = attr.value;
            }
            return { tagName: element.tagName.toUpperCase(), attributes, children, style: element.style };
        }
        return null;
    }
    return Array.from(doc.body.childNodes).map(parseNode).filter(n => n !== null) as (SimpleHtmlElement | string)[];
}


function simpleStructureToMarkdown(nodes: (SimpleHtmlElement | string)[]): string {
    let markdown = "";

    function processNode(node: SimpleHtmlElement | string): string {
        if (typeof node === 'string') {
            return node.replace(/\u00A0/g, ' ').replace(/  +/g, ' ');
        }

        const element = node as SimpleHtmlElement;
        let childrenMarkdown = element.children.map(child => processNode(child)).join('');
        
        const blockTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV', 'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'TABLE', 'HR'];
        if (!blockTags.includes(element.tagName)) {
           if (element.tagName !== 'A' && element.tagName !== 'CODE' && element.tagName !== 'SPAN') {
              childrenMarkdown = childrenMarkdown.trim();
           }
        }

        switch (element.tagName) {
            case 'H1': return `# ${childrenMarkdown.trim()}\n\n`;
            case 'H2': return `## ${childrenMarkdown.trim()}\n\n`;
            case 'H3': return `### ${childrenMarkdown.trim()}\n\n`;
            case 'H4': return `#### ${childrenMarkdown.trim()}\n\n`;
            case 'H5': return `##### ${childrenMarkdown.trim()}\n\n`;
            case 'H6': return `###### ${childrenMarkdown.trim()}\n\n`;
            case 'P': return `${childrenMarkdown.trim()}\n\n`;
            case 'STRONG': case 'B': return `**${childrenMarkdown}**`;
            case 'EM': case 'I': return `*${childrenMarkdown}*`;
            case 'U': return `<u>${childrenMarkdown}</u>`;
            case 'S': case 'STRIKE': return `~~${childrenMarkdown}~~`;
            case 'A':
                const href = element.attributes.href;
                return href ? `[${childrenMarkdown.trim() || href}](${href})` : childrenMarkdown;
            case 'UL':
                return Array.from(element.children)
                    .map(child => (child as SimpleHtmlElement).tagName === 'LI' ? `* ${processNode(child as SimpleHtmlElement).trim()}` : processNode(child))
                    .join('\n') + '\n\n';
            case 'OL':
                let olCounter = 1;
                return Array.from(element.children)
                    .map(child => (child as SimpleHtmlElement).tagName === 'LI' ? `${olCounter++}. ${processNode(child as SimpleHtmlElement).trim()}` : processNode(child))
                    .join('\n') + '\n\n';
            case 'LI': return childrenMarkdown;
            case 'BLOCKQUOTE': return `> ${childrenMarkdown.trim().replace(/\n/g, '\n> ')}\n\n`;
            case 'PRE':
                const preCodeContent = element.children.length === 1 && (element.children[0] as SimpleHtmlElement).tagName === 'CODE'
                    ? (element.children[0] as SimpleHtmlElement).children.join('').trim()
                    : childrenMarkdown.trim();
                return `\`\`\`\n${preCodeContent}\n\`\`\`\n\n`;
            case 'CODE':
                 if (element.parentElement?.tagName === 'PRE') return childrenMarkdown; // Already handled by PRE
                 return `\`${childrenMarkdown}\``;
            case 'IMG':
                const src = element.attributes.src;
                const alt = element.attributes.alt || '';
                return src ? `![${alt}](${src})` : '';
            case 'BR': return '\n';
            case 'HR': return '\n---\n\n';
            case 'TABLE':
                let tableMd = '\n';
                const rows = element.children.filter(c => typeof c !== 'string' && (c.tagName === 'TR' || ((c.tagName === 'THEAD' || c.tagName === 'TBODY') && c.children.some(cr => typeof cr !== 'string' && cr.tagName === 'TR')))) as SimpleHtmlElement[];
                let headerProcessed = false;
                rows.forEach((row, rowIndex) => {
                    const cellsContainer = row.tagName === 'TR' ? row : (row.children.find(c => typeof c !== 'string' && c.tagName === 'TR') as SimpleHtmlElement | undefined);
                    if (!cellsContainer) return;

                    const cells = cellsContainer.children.filter(c => typeof c !== 'string' && (c.tagName === 'TD' || c.tagName === 'TH')) as SimpleHtmlElement[];
                    const cellContent = cells.map(cell => processNode(cell).trim().replace(/\|/g, '\\|')).join(' | ');
                    tableMd += `| ${cellContent} |\n`;
                    
                    if ((rowIndex === 0 || (row.parentElement as SimpleHtmlElement)?.tagName === 'THEAD') && !headerProcessed && cells.length > 0) {
                        tableMd += `| ${cells.map(() => '---').join(' | ')} |\n`;
                        headerProcessed = true;
                    }
                });
                return tableMd + '\n';
            case 'TH': case 'TD': return childrenMarkdown.trim();
            case 'SUP': return `<sup>${childrenMarkdown}</sup>`;
            case 'SUB': return `<sub>${childrenMarkdown}</sub>`;
            case 'SPAN': case 'FONT':
                let styledContent = childrenMarkdown;
                if (element.style) {
                    if (element.style.fontWeight === 'bold' || parseInt(element.style.fontWeight, 10) >= 700) styledContent = `**${styledContent}**`;
                    if (element.style.fontStyle === 'italic') styledContent = `*${styledContent}*`;
                    if (element.style.textDecorationLine?.includes('underline') || element.style.textDecoration?.includes('underline')) styledContent = `<u>${styledContent}</u>`;
                    if (element.style.textDecorationLine?.includes('line-through')) styledContent = `~~${styledContent}~~`;
                    if (element.style.color) styledContent = `<span style="color: ${element.style.color};">${styledContent}</span>`; // Or use <font color="">
                    if (element.style.backgroundColor && element.style.backgroundColor !== 'transparent') styledContent = `<mark>${styledContent}</mark>`; // Using <mark> for highlight
                    if (element.style.fontSize) {
                        const size = element.style.fontSize;
                        // Basic mapping for font size, or pass directly
                        styledContent = `<span style="font-size: ${size};">${styledContent}</span>`;
                    }
                }
                 if (element.tagName === 'FONT' && element.attributes.color && !styledContent.includes('style="color:')) {
                     styledContent = `<span style="color: ${element.attributes.color};">${styledContent}</span>`;
                 }
                return styledContent;

            case 'DIV':
                if (element.style?.textAlign) {
                     return `<div style="text-align: ${element.style.textAlign};">${childrenMarkdown.trim()}</div>\n\n`;
                }
                return `${childrenMarkdown.trim()}\n\n`; 

            default:
                const seemsBlock = element.style?.display === 'block' || blockTags.includes(element.tagName);
                return childrenMarkdown + (seemsBlock ? '\n\n' : '');
        }
    }

    for (const item of nodes) {
        markdown += processNode(item);
    }
    return markdown;
}

function cleanupMarkdown(md: string): string {
    return md
        .replace(/(\n\s*){3,}/g, '\n\n') 
        .replace(/\*\*\s*\*\*/g, '') 
        .replace(/\*\s*\*/g, '')     
        .replace(/~~\s*~~/g, '')   
        .replace(/``/g, '')        
        .trim();
}


export function RichTextToolbar({ textareaRef, onContentChange, currentContent }: RichTextToolbarProps) {
    const { resolvedTheme } = useTheme();

    const insertText = useCallback((before: string, defaultText: string, after: string = '', isBlock: boolean = false, replaceSelection: boolean = false) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = currentContent.substring(start, end);
        
        let textToInsert = selectedText && !replaceSelection ? selectedText : defaultText;
        
        let prefix = before;
        let suffix = after;

        if (isBlock) {
            const currentLineStart = currentContent.lastIndexOf('\n', start - 1) + 1;
            // Check if the cursor is at the beginning of the line or if the line is empty
            const isAtStartOfLineOrEmpty = start === currentLineStart || currentContent.substring(currentLineStart, start).trim() === '';

            if (start > 0 && currentContent[start - 1] !== '\n' && !isAtStartOfLineOrEmpty) {
                 prefix = '\n' + prefix;
            } else if (start > 0 && currentContent[start -1] === '\n' && currentContent[start-2] !== '\n' && !isAtStartOfLineOrEmpty ) {
                // If already on a new line, but not a double new line, add one more for block elements
                // prefix = '\n' + prefix; 
            }


            if (end < currentContent.length && currentContent[end] !== '\n') {
                 suffix = suffix + '\n';
            } else if (end < currentContent.length && currentContent[end] === '\n' && (end + 1 >= currentContent.length || currentContent[end+1] !== '\n')) {
                // If followed by a single newline, add another for block elements
                // suffix = suffix + '\n';
            }
        }
        
        const newText = `${currentContent.substring(0, start)}${prefix}${textToInsert}${suffix}${currentContent.substring(end)}`;
        onContentChange(newText);

        requestAnimationFrame(() => {
            if (textarea) {
                textarea.focus();
                if (selectedText && !replaceSelection) { 
                    textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
                } else { 
                    textarea.setSelectionRange(start + prefix.length, start + prefix.length + textToInsert.length);
                }
            }
        });
    }, [textareaRef, currentContent, onContentChange]);


    const insertList = useCallback((marker: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = currentContent.substring(start, end);

        if (selectedText) { // Wrap selected lines
            const lines = selectedText.split('\n');
            const newLines = lines.map((line, index) => marker === '1.' ? `${index + 1}. ${line}` : `${marker} ${line}`);
            const textToInsert = newLines.join('\n');
            const newText = `${currentContent.substring(0, start)}${textToInsert}${currentContent.substring(end)}`;
            onContentChange(newText);
            requestAnimationFrame(() => {
                textarea.focus();
                textarea.setSelectionRange(start, start + textToInsert.length);
            });
        } else { // Insert new list item
            const currentLineStart = currentContent.lastIndexOf('\n', start - 1) + 1;
            const prefix = currentContent.substring(0, currentLineStart);
            const suffix = currentContent.substring(currentLineStart);
            const linePrefix = (currentLineStart === 0 || currentContent[currentLineStart-1] === '\n') ? '' : '\n';
            
            const itemPrefix = marker === '1.' ? '1. ' : `${marker} `;
            const newText = `${prefix}${linePrefix}${itemPrefix}${suffix}`;
            onContentChange(newText);
            requestAnimationFrame(() => {
                textarea.focus();
                textarea.setSelectionRange(currentLineStart + linePrefix.length + itemPrefix.length, currentLineStart + linePrefix.length + itemPrefix.length);
            });
        }
    }, [textareaRef, currentContent, onContentChange]);

    const insertEmoji = useCallback((emojiData: EmojiClickData) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const emoji = emojiData.emoji;
        const newText = `${currentContent.substring(0, start)}${emoji}${currentContent.substring(end)}`;
        onContentChange(newText);
        requestAnimationFrame(() => {
            if (textarea) {
                textarea.focus();
                textarea.setSelectionRange(start + emoji.length, start + emoji.length);
            }
        });
    }, [textareaRef, currentContent, onContentChange]);

    const handlePromptAndInsert = useCallback((promptMessage: string, formatFn: (input: string, selectedText: string) => { before: string, defaultText: string, after: string, isBlock?: boolean, replaceSelection?: boolean }) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const selectedText = currentContent.substring(textarea.selectionStart, textarea.selectionEnd);
        const defaultPromptValue = selectedText.startsWith('http') ? selectedText : 'https://';
        
        const userInput = prompt(promptMessage, defaultPromptValue);
        if (userInput) {
            const { before, defaultText, after, isBlock = false, replaceSelection = false } = formatFn(userInput, selectedText);
            insertText(before, defaultText, after, isBlock, replaceSelection);
        }
    }, [insertText, currentContent, textareaRef]);

    const handleAlignment = useCallback((alignType: 'left' | 'center' | 'right' | 'justify') => {
        insertText(`<div style="text-align:${alignType};">\n`, 'aligned text', '\n</div>', true);
    }, [insertText]);
    
    const handleColor = () => {
        const color = prompt('Enter color (e.g., red, #FF0000):');
        if (color) {
            insertText(`<span style="color:${color};">`, 'colored text', '</span>');
        }
    };

    const handleFontSize = () => {
        const size = prompt('Enter font size (e.g., 12px, 1.5em, large):');
        if (size) {
            insertText(`<span style="font-size:${size};">`, 'sized text', `</span>`);
        }
    };
    
    const handleTable = () => {
        const tableMarkdown = "\n| Header 1 | Header 2 | Header 3 |\n|---|---|---|\n| Cell 1.1 | Cell 1.2 | Cell 1.3 |\n| Cell 2.1 | Cell 2.2 | Cell 2.3 |\n";
        insertText(tableMarkdown, '', '', true, true);
    };


    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border border-input rounded-t-md bg-background sticky top-0 z-10">
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Bold (Ctrl+B)" onClick={() => insertText('**', 'bold text', '**')}> <Bold className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Italic (Ctrl+I)" onClick={() => insertText('*', 'italic text', '*')}> <Italic className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Underline (Ctrl+U)" onClick={() => insertText('<u>', 'underlined text', '</u>')}> <Underline className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Strikethrough" onClick={() => insertText('~~', 'strikethrough text', '~~')}> <Strikethrough className="h-4 w-4" /> </Button>
            
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Link (Ctrl+K)" onClick={() => handlePromptAndInsert('Enter URL:', (url, selected) => ({ before: '[', defaultText: selected || 'Link Text', after: `](${url})`, replaceSelection: !!selected }))}> <LinkIcon className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Image" onClick={() => handlePromptAndInsert('Enter Image URL:', (url, selected) => ({ before: '![', defaultText: selected || 'Image Alt Text', after: `](${url})`, isBlock: true, replaceSelection: true }))}> <ImageIcon className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="YouTube Video" onClick={() => handlePromptAndInsert('Enter YouTube Video URL:', (url) => ({ before: '', defaultText: url, after: '', isBlock: true, replaceSelection: true }))}> <Youtube className="h-4 w-4" /> </Button>

            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Blockquote" onClick={() => insertText('> ', 'quoted text', '', true)}> <Quote className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Inline Code" onClick={() => insertText('`', 'code', '`')}> <Code className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Code Block" onClick={() => insertText('```\n', 'code block', '\n```', true)}> <SquareCode className="h-4 w-4" /> </Button>
            
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Bulleted List" onClick={() => insertList('-')}> <List className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Numbered List" onClick={() => insertList('1.')}> <ListOrdered className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Table" onClick={handleTable}> <Table className="h-4 w-4" /> </Button>

            <Popover>
                <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Emoji"> <SmilePlus className="h-4 w-4" /> </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-0" side="bottom" align="start">
                    <EmojiPicker onEmojiClick={insertEmoji} autoFocusSearch={false} theme={resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT} skinTonesDisabled lazyLoadEmojis searchDisabled />
                </PopoverContent>
            </Popover>

            {/* Advanced Formatting using HTML tags */}
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Highlight" onClick={() => insertText('<mark>', 'highlighted text', '</mark>')}> <Highlighter className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Superscript" onClick={() => insertText('<sup>', 'superscript', '</sup>')}> <Superscript className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Subscript" onClick={() => insertText('<sub>', 'subscript', '</sub>')}> <Subscript className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Glow" onClick={() => insertText('<span class="text-glow">', 'glowing text', '</span>')}> <Sparkles className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Shadow" onClick={() => insertText('<span class="text-shadow">', 'shadowed text', '</span>')}> <Droplets className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Spoiler" onClick={() => insertText('<span class="spoiler"><span class="spoiler-content">', 'spoiler content', '</span></span>')}> <EyeOff className="h-4 w-4" /> </Button>
            
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Text Color" onClick={handleColor}> <Palette className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Font Size" onClick={handleFontSize}> <CaseSensitive className="h-4 w-4" /> </Button>

            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Align Left" onClick={() => handleAlignment('left')}> <AlignLeft className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Align Center" onClick={() => handleAlignment('center')}> <AlignCenter className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Align Right" onClick={() => handleAlignment('right')}> <AlignRight className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Align Justify" onClick={() => handleAlignment('justify')}> <AlignJustify className="h-4 w-4" /> </Button>

        </div>
    );
}

export { parseHtmlToSimpleStructure, simpleStructureToMarkdown, cleanupMarkdown };
