"use client";

import React, { useState, RefObject, useCallback } from 'react';
import {
    Bold, Italic, Link as LinkIcon, List, ListOrdered, Quote, Code, SmilePlus, Image as ImageIcon, Strikethrough,
    Highlighter, // For [highlight]
    AlignCenter, AlignLeft, AlignRight, AlignJustify, // For [align]
    MoveRight, // For [float=right], generic icon
    MoveLeft, // For [float=left], generic icon
    SquareCode, // For [pre]
    Superscript, Subscript,
    Sparkles, // For [glow]
    Droplets, // For [shadow] generic concept
    EyeOff, // For [spoiler]
    Youtube,
    RemoveFormatting,
    Palette, // For [color]
    CaseSensitive, // For [size]
    Table, // For [table]
    Underline, // For [u]
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
    style?: CSSStyleDeclaration; // Add style property
}


function parseHtmlToSimpleStructure(htmlString: string): (SimpleHtmlElement | string)[] {
    if (typeof window === 'undefined' || !window.DOMParser) {
        // Fallback for environments without DOMParser (e.g., some test environments)
        // This basic fallback will just return the string, losing HTML structure.
        // For actual client-side operation, DOMParser is expected.
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
            // Include style for parsing
            return { tagName: element.tagName.toUpperCase(), attributes, children, style: element.style };
        }
        return null;
    }
    return Array.from(doc.body.childNodes).map(parseNode).filter(n => n !== null) as (SimpleHtmlElement | string)[];
}


function simpleStructureToMarkdown(nodes: (SimpleHtmlElement | string)[]): string {
    let markdown = "";

    function processNode(node: SimpleHtmlElement | string, listMeta?: { type: 'UL' | 'OL', depth: number, counter?: number }): string {
        if (typeof node === 'string') {
            return node.replace(/\u00A0/g, ' ').replace(/  +/g, ' '); // Normalize spaces
        }

        const element = node as SimpleHtmlElement;
        let childrenMarkdown = element.children.map(child => processNode(child, listMeta)).join('');

        // Inline elements might need trimming if they are the only child of a block.
        // Block elements handle their own spacing.
        const blockTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV', 'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'TABLE', 'HR'];
        if (!blockTags.includes(element.tagName)) {
           // Smart trim for inline elements or elements that behave like inline in certain contexts
           // This is tricky; for now, let's trim childrenMarkdown for most inline tags
           if (element.tagName !== 'A' && element.tagName !== 'CODE' && element.tagName !== 'SPAN') { // Links and code often need precise spacing
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
            
            case 'U': // Underline
                if (element.style?.textDecorationLine === 'underline' || element.style?.textDecoration?.includes('underline')) {
                    return `[u]${childrenMarkdown}[/u]`;
                }
                return `[u]${childrenMarkdown}[/u]`; // Fallback if style not present but tag is U

            case 'S': case 'STRIKE': return `~~${childrenMarkdown}~~`;
            
            case 'A':
                const href = element.attributes.href;
                return href ? `[${childrenMarkdown.trim() || href}](${href})` : childrenMarkdown;

            case 'UL':
                return Array.from(element.children)
                    .map(child => (child as SimpleHtmlElement).tagName === 'LI' ? `* ${processNode(child as SimpleHtmlElement, { type: 'UL', depth: (listMeta?.depth || 0) + 1 }).trim()}` : processNode(child))
                    .join('\n') + '\n\n';
            case 'OL':
                let olCounter = 1;
                return Array.from(element.children)
                    .map(child => (child as SimpleHtmlElement).tagName === 'LI' ? `${olCounter++}. ${processNode(child as SimpleHtmlElement, { type: 'OL', depth: (listMeta?.depth || 0) + 1, counter: olCounter -1 }).trim()}` : processNode(child))
                    .join('\n') + '\n\n';
            case 'LI':
                 return childrenMarkdown; // Content of LI, prefix handled by UL/OL

            case 'BLOCKQUOTE': return `> ${childrenMarkdown.trim().replace(/\n/g, '\n> ')}\n\n`;
            
            case 'PRE':
                const preCodeContent = element.children.length === 1 && (element.children[0] as SimpleHtmlElement).tagName === 'CODE'
                    ? (element.children[0] as SimpleHtmlElement).children.join('').trim() // Assuming code content is text
                    : childrenMarkdown.trim();
                return `\`\`\`\n${preCodeContent}\n\`\`\`\n\n`;
            case 'CODE': // Inline code
                if (element.children.some(child => typeof child !== 'string' || (child as SimpleHtmlElement).tagName === 'PRE')) return childrenMarkdown; // Complex content or inside PRE
                return `\`${childrenMarkdown}\``;

            case 'IMG':
                const src = element.attributes.src;
                const alt = element.attributes.alt || '';
                return src ? `![${alt}](${src})` : '';
            
            case 'BR': return '\n';
            case 'HR': return '\n---\n\n';

            case 'TABLE':
                let tableMd = '\n';
                const rows = element.children.filter(c => typeof c !== 'string' && c.tagName === 'TR' || (c.tagName === 'THEAD' || c.tagName === 'TBODY') && c.children.some(cr => typeof cr !== 'string' && cr.tagName === 'TR')) as SimpleHtmlElement[];
                
                let headerProcessed = false;
                rows.forEach((row, rowIndex) => {
                    const cells = (row.tagName === 'TR' ? row.children : (row.children[0] as SimpleHtmlElement)?.children || []) as (SimpleHtmlElement | string)[];
                    const cellContent = cells.map(cell => processNode(cell).trim()).join(' | ');
                    tableMd += `| ${cellContent} |\n`;
                    if ((rowIndex === 0 || (row.parentElement as SimpleHtmlElement)?.tagName === 'THEAD') && !headerProcessed && cells.length > 0) {
                        tableMd += `| ${cells.map(() => '---').join(' | ')} |\n`;
                        headerProcessed = true;
                    }
                });
                return tableMd + '\n';
            
            case 'SUP': return `[sup]${childrenMarkdown}[/sup]`;
            case 'SUB': return `[sub]${childrenMarkdown}[/sub]`;
            
            case 'SPAN': case 'FONT': // FONT is common from Word
                let styles = '';
                if (element.style) {
                    if (element.style.fontWeight === 'bold' || parseInt(element.style.fontWeight, 10) >= 700) styles += `**${childrenMarkdown}**`;
                    else if (element.style.fontStyle === 'italic') styles += `*${childrenMarkdown}*`;
                    else if (element.style.textDecorationLine?.includes('underline') || element.style.textDecoration?.includes('underline')) styles += `[u]${childrenMarkdown}[/u]`;
                    else if (element.style.textDecorationLine?.includes('line-through')) styles += `~~${childrenMarkdown}~~`;
                    else if (element.style.color) styles += `[color=${element.style.color}]${childrenMarkdown}[/color]`;
                    else if (element.style.backgroundColor && element.style.backgroundColor !== 'transparent') styles += `[highlight=${element.style.backgroundColor}]${childrenMarkdown}[/highlight]`;
                    else if (element.style.fontSize) { // This is tricky, try to map to simple BBCode sizes
                        const size = element.style.fontSize;
                        let bbSize = size; // Default to direct value
                        if (size.endsWith('pt')) {
                            const pt = parseInt(size);
                            if (pt <= 8) bbSize = '1'; else if (pt <= 10) bbSize = '2'; else if (pt <= 12) bbSize = '3';
                            else if (pt <= 14) bbSize = '4'; else if (pt <= 18) bbSize = '5'; else if (pt <= 24) bbSize = '6'; else bbSize = '7';
                        }
                        styles += `[size=${bbSize}]${childrenMarkdown}[/size]`;
                    }
                     else if (element.classList && element.classList.contains('text-glow-paste')) styles += `[glow]${childrenMarkdown}[/glow]`; // Assuming pasted glow has a class
                     else if (element.classList && element.classList.contains('text-shadow-paste')) styles += `[shadow]${childrenMarkdown}[/shadow]`;
                    else styles = childrenMarkdown;
                } else {
                    styles = childrenMarkdown;
                }
                 // Check for FONT tag specific attributes if style parsing isn't enough
                if (element.tagName === 'FONT') {
                    if (element.attributes.color && !styles.includes('[color=')) {
                         styles = `[color=${element.attributes.color}]${styles}[/color]`;
                    }
                    // Could attempt FONT size attribute, but it's deprecated and mapping is unreliable
                }
                return styles;

            case 'DIV':
                if (element.style?.textAlign) {
                    return `[align=${element.style.textAlign}]${childrenMarkdown.trim()}[/align]\n\n`;
                }
                return `${childrenMarkdown.trim()}\n\n`; // Treat DIV as block with newlines

            default:
                // For unknown tags, try to preserve content, add newlines if it seems like a block from Word/HTML
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
        .replace(/(\n\s*){3,}/g, '\n\n') // Reduce 3+ newlines to 2
        .replace(/\*\*\s*\*\*/g, '') // Remove empty bold: ****
        .replace(/\*\s*\*/g, '')     // Remove empty italic: **
        .replace(/~~\s*~~/g, '')   // Remove empty strikethrough: ~~~~
        .replace(/``/g, '')        // Remove empty inline code
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
            const currentLineEnd = currentContent.indexOf('\n', end);
            const lineIsEmpty = currentContent.substring(currentLineStart, start).trim() === '' && currentContent.substring(end, currentLineEnd === -1 ? currentContent.length : currentLineEnd).trim() === '';

            if (start > 0 && currentContent[start - 1] !== '\n' && !lineIsEmpty) prefix = '\n' + prefix;
            if (end < currentContent.length && currentContent[end] !== '\n' && !lineIsEmpty) suffix = suffix + '\n';
            if (prefix === before && start === 0 && !currentContent.substring(0, start).endsWith('\n\n')) prefix = '\n' + prefix; // Extra newline if at very beginning
        }
        
        const newText = `${currentContent.substring(0, start)}${prefix}${textToInsert}${suffix}${currentContent.substring(end)}`;
        onContentChange(newText);

        requestAnimationFrame(() => {
            if (textarea) {
                textarea.focus();
                if (selectedText && !replaceSelection) { // If there was a selection and we wrapped it
                    textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
                } else { // If we inserted default text or replaced selection
                    textarea.setSelectionRange(start + prefix.length, start + prefix.length + textToInsert.length);
                }
            }
        });
    }, [textareaRef, currentContent, onContentChange]);


    const insertList = useCallback((marker: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        // Simplified: inserts the marker at the start of the current line or selection.
        // A more complex version would handle multi-line selections properly.
        const start = textarea.selectionStart;
        const currentLineStart = currentContent.lastIndexOf('\n', start - 1) + 1;
        
        const prefixText = marker === '1.' ? '1. ' : `${marker} `;
        const newText = `${currentContent.substring(0, currentLineStart)}${prefixText}${currentContent.substring(currentLineStart)}`;
        onContentChange(newText);

        requestAnimationFrame(() => {
            if (textarea) {
                textarea.focus();
                textarea.setSelectionRange(start + prefixText.length, start + prefixText.length);
            }
        });
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

    const handlePromptAndInsert = useCallback((promptMessage: string, formatFn: (url: string) => { before: string, defaultText: string, after: string, isBlock?: boolean }) => {
        const url = prompt(promptMessage, 'https://');
        if (url) {
            const { before, defaultText, after, isBlock = false } = formatFn(url);
            insertText(before, defaultText, after, isBlock, true);
        }
    }, [insertText]);

    const handleAlignment = useCallback((alignType: 'left' | 'center' | 'right' | 'justify') => {
        insertText(`[align=${alignType}]`, 'aligned text', '[/align]', true);
    }, [insertText]);
    
    const handleFloat = useCallback((floatType: 'left' | 'right') => {
        insertText(`[float=${floatType}]`, 'floated text', '[/float]', true);
    }, [insertText]);

    const handlePaste = useCallback((event: React.ClipboardEvent<HTMLTextAreaElement>) => {
        event.preventDefault();
        const clipboardData = event.clipboardData;
        const html = clipboardData.getData('text/html');
        const plainText = clipboardData.getData('text/plain');
        let pastedMarkdown = '';

        if (html) {
            try {
                const simpleStructure = parseHtmlToSimpleStructure(html);
                pastedMarkdown = simpleStructureToMarkdown(simpleStructure);
                pastedMarkdown = cleanupMarkdown(pastedMarkdown);
            } catch (e) {
                console.error("Error parsing pasted HTML, falling back to plain text:", e);
                pastedMarkdown = plainText; // Fallback to plain text if HTML parsing fails
            }
        } else {
            pastedMarkdown = plainText;
        }
        
        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newContent = currentContent.substring(0, start) + pastedMarkdown + currentContent.substring(end);
            onContentChange(newContent);

            requestAnimationFrame(() => {
                if (textarea) {
                    textarea.focus();
                    textarea.setSelectionRange(start + pastedMarkdown.length, start + pastedMarkdown.length);
                }
            });
        }
    }, [textareaRef, currentContent, onContentChange]);

    const handleColor = () => {
        const color = prompt('Enter color (e.g., red, #FF0000):');
        if (color) {
            insertText(`[color=${color}]`, 'colored text', '[/color]');
        }
    };

    const handleFontSize = () => {
        const size = prompt('Enter font size (1-7):');
        if (size && /^[1-7]$/.test(size)) {
            insertText(`[size=${size}]`, 'sized text', `[/size]`);
        } else if (size) {
            alert('Please enter a number between 1 and 7 for font size.');
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border border-input rounded-t-md bg-background sticky top-0 z-10">
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Bold (Ctrl+B)" onClick={() => insertText('**', 'bold text', '**')}> <Bold className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Italic (Ctrl+I)" onClick={() => insertText('*', 'italic text', '*')}> <Italic className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Underline (Ctrl+U)" onClick={() => insertText('[u]', 'underlined text', '[/u]')}> <Underline className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Strikethrough" onClick={() => insertText('~~', 'strikethrough text', '~~')}> <Strikethrough className="h-4 w-4" /> </Button>
            
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Link (Ctrl+K)" onClick={() => handlePromptAndInsert('Enter URL:', url => ({ before: '[', defaultText: 'Link Text', after: `](${url})`}))}> <LinkIcon className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Image" onClick={() => handlePromptAndInsert('Enter Image URL:', url => ({ before: '![', defaultText: 'Image Alt Text', after: `](${url})`, isBlock: true }))}> <ImageIcon className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="YouTube Video" onClick={() => handlePromptAndInsert('Enter YouTube Video URL:', url => ({ before: '[youtube]', defaultText: url, after: '[/youtube]', isBlock: true }))}> <Youtube className="h-4 w-4" /> </Button>

            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Blockquote" onClick={() => insertText('> ', 'quoted text', '', true)}> <Quote className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Code" onClick={() => insertText('`', 'code', '`')}> <Code className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Preformatted Text" onClick={() => insertText('```\n', 'preformatted text', '\n```', true)}> <SquareCode className="h-4 w-4" /> </Button>
            
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Bulleted List" onClick={() => insertList('-')}> <List className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Numbered List" onClick={() => insertList('1.')}> <ListOrdered className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Table" onClick={() => insertText('\n| Header 1 | Header 2 |\n|---|---|\n| Cell 1 | Cell 2 |\n', '', '', true)}> <Table className="h-4 w-4" /> </Button>


            <Popover>
                <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Emoji"> <SmilePlus className="h-4 w-4" /> </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-0" side="bottom" align="start">
                    <EmojiPicker onEmojiClick={insertEmoji} autoFocusSearch={false} theme={resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT} skinTonesDisabled lazyLoadEmojis searchDisabled />
                </PopoverContent>
            </Popover>

            {/* Advanced Formatting */}
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Highlight" onClick={() => insertText('[highlight]', 'highlighted text', '[/highlight]')}> <Highlighter className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Superscript" onClick={() => insertText('[sup]', 'superscript', '[/sup]')}> <Superscript className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Subscript" onClick={() => insertText('[sub]', 'subscript', '[/sub]')}> <Subscript className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Glow" onClick={() => insertText('[glow]', 'glowing text', '[/glow]')}> <Sparkles className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Shadow" onClick={() => insertText('[shadow]', 'shadowed text', '[/shadow]')}> <Droplets className="h-4 w-4" /> </Button> {/* Using Droplets as a placeholder for shadow */}
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Spoiler" onClick={() => insertText('[spoiler]', 'spoiler content', '[/spoiler]')}> <EyeOff className="h-4 w-4" /> </Button>
            
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Text Color" onClick={handleColor}> <Palette className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Font Size" onClick={handleFontSize}> <CaseSensitive className="h-4 w-4" /> </Button>


            {/* Alignment Buttons */}
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Align Left" onClick={() => handleAlignment('left')}> <AlignLeft className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Align Center" onClick={() => handleAlignment('center')}> <AlignCenter className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Align Right" onClick={() => handleAlignment('right')}> <AlignRight className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Align Justify" onClick={() => handleAlignment('justify')}> <AlignJustify className="h-4 w-4" /> </Button>

            {/* Float - conceptual, actual rendering needs CSS in Post.tsx */}
            {/* <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Float Left" onClick={() => handleFloat('left')}> <MoveLeft className="h-4 w-4" /> </Button> */}
            {/* <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Float Right" onClick={() => handleFloat('right')}> <MoveRight className="h-4 w-4" /> </Button> */}
            
            {/* <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Remove Formatting" onClick={handleRemoveFormatting}><RemoveFormatting className="h-4 w-4" /></Button> */}
             {/* onPaste should be on the Textarea component itself */}
        </div>
    );
}

// Add the onPaste prop to the Textarea component where it's used:
// <Textarea ... onPaste={handlePaste} />
// This means the parent component (PostForm or TopicForm) needs to receive `handlePaste` or `RichTextToolbar`
// needs to directly apply it if it wraps the Textarea.
// For now, the Textarea in PostForm/TopicForm should have onPaste={handlePaste} passed from this component's scope.
// Let's adjust: RichTextToolbar is a separate component. The Textarea it controls is passed via ref.
// So, the onPaste handler must be attached to the Textarea component in PostForm.tsx and TopicForm.tsx.
// This component (`RichTextToolbar`) can export the `handlePaste` logic or be refactored.

// For simplicity, I'll keep handlePaste logic here for now.
// PostForm and TopicForm will need to import and use the `handlePaste` function from here if it's exported,
// or RichTextToolbar would need to take onPaste as a prop and attach it to its controlled textarea.
// A better way: the parent form (PostForm/TopicForm) implements the onPaste on its Textarea,
// and can call a utility function for the HTML-to-Markdown conversion.

// Let's assume the Textarea component used in PostForm/TopicForm will have the onPaste={handlePaste} attached.
// And this RichTextToolbar component definition does NOT include the Textarea itself.
// The `handlePaste` function needs access to `textareaRef`, `currentContent`, and `onContentChange`.
// This can be achieved if `handlePaste` is defined within `PostForm` and `TopicForm`
// and they call the parsing utilities (parseHtmlToSimpleStructure, simpleStructureToMarkdown, cleanupMarkdown)
// which can be exported from here or a utils file.

// For this change, I will modify RichTextToolbar to pass down the handlePaste function
// to be used by the Textarea in the parent components. This is not ideal.
// A better approach is to make the paste handling logic a utility function.
// For now, I'm just defining the functions here. Their attachment will be in PostForm and TopicForm.

export { parseHtmlToSimpleStructure, simpleStructureToMarkdown, cleanupMarkdown };

// The Textarea component in PostForm.tsx and TopicForm.tsx will need this:
// import { parseHtmlToSimpleStructure, simpleStructureToMarkdown, cleanupMarkdown } from './RichTextToolbar';
// ...
// const handlePaste = useCallback((event: React.ClipboardEvent<HTMLTextAreaElement>) => {
//   // ... (implementation using the imported functions and local state/refs)
// }, [textareaRef, textContent, handleTextChange]);
// ...
// <Textarea onPaste={handlePaste} ... />

