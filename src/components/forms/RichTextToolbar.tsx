
"use client";

import React, { useState, RefObject, useCallback } from 'react';
import {
    Bold, Italic, Link as LinkIcon, List, ListOrdered, Quote, Code, SmilePlus, Image as ImageIcon, Strikethrough,
    Highlighter, 
    AlignCenter, AlignLeft, AlignRight, AlignJustify, 
    Superscript, Subscript,
    Sparkles, 
    Droplets, // Using Droplets for Shadow
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
    parentElement?: SimpleHtmlElement; // Keep track of parent for context
}


function parseHtmlToSimpleStructure(htmlString: string): (SimpleHtmlElement | string)[] {
    if (typeof window === 'undefined' || !window.DOMParser) {
        // Fallback for non-browser environments or if DOMParser is unavailable
        // This simplistic fallback just returns the string, maybe with some basic cleaning
        return [htmlString.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()];
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    function parseNode(node: Node, parentElement?: SimpleHtmlElement): (SimpleHtmlElement | string) | null {
        if (node.nodeType === Node.TEXT_NODE) {
            // Preserve whitespace for text nodes, cleanup later if needed
            return node.textContent || ""; 
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            const simpleElement: SimpleHtmlElement = {
                tagName: element.tagName.toUpperCase(),
                attributes: {},
                children: [],
                style: element.style,
                parentElement
            };

            for (let i = 0; i < element.attributes.length; i++) {
                const attr = element.attributes[i];
                simpleElement.attributes[attr.name] = attr.value;
            }
            
            simpleElement.children = Array.from(element.childNodes)
                .map(childNode => parseNode(childNode, simpleElement))
                .filter(n => n !== null) as (SimpleHtmlElement | string)[];
            
            return simpleElement;
        }
        return null;
    }
    // Start parsing from doc.body to handle full HTML snippets
    return Array.from(doc.body.childNodes).map(node => parseNode(node)).filter(n => n !== null) as (SimpleHtmlElement | string)[];
}


function simpleStructureToMarkdown(nodes: (SimpleHtmlElement | string)[]): string {
    let markdown = "";

    function processNode(node: SimpleHtmlElement | string, listLevel: number = 0, inTable: boolean = false): string {
        if (typeof node === 'string') {
            // For plain strings, escape Markdown special characters if they are not part of intentional Markdown.
            // Basic cleaning: replace non-breaking spaces.
            return node.replace(/\u00A0/g, ' ');
        }

        const element = node as SimpleHtmlElement;
        let childrenMarkdown = element.children.map(child => processNode(child, element.tagName === 'UL' || element.tagName === 'OL' ? listLevel + 1 : listLevel, inTable || element.tagName === 'TABLE')).join('');
        
        // Preserve whitespace within <pre>
        if (element.tagName !== 'PRE') {
             if (!['A', 'CODE', 'SPAN', 'FONT', 'SUP', 'SUB', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'STRIKE', 'MARK'].includes(element.tagName)) {
               childrenMarkdown = childrenMarkdown.trim();
            }
        }


        switch (element.tagName) {
            case 'H1': return `# ${childrenMarkdown}\n\n`;
            case 'H2': return `## ${childrenMarkdown}\n\n`;
            case 'H3': return `### ${childrenMarkdown}\n\n`;
            case 'H4': return `#### ${childrenMarkdown}\n\n`;
            case 'H5': return `##### ${childrenMarkdown}\n\n`;
            case 'H6': return `###### ${childrenMarkdown}\n\n`;
            
            case 'P': 
                 // If a P tag is inside an LI, it's part of the list item, don't add extra newlines.
                const parentIsLi = element.parentElement?.tagName === 'LI';
                return parentIsLi ? childrenMarkdown : `${childrenMarkdown}\n\n`;

            case 'STRONG': case 'B': return `**${childrenMarkdown}**`;
            case 'EM': case 'I': return `*${childrenMarkdown}*`;
            case 'U': return `<u>${childrenMarkdown}</u>`; // Markdown doesn't have native underline
            case 'S': case 'STRIKE': return `~~${childrenMarkdown}~~`;
            
            case 'A':
                const href = element.attributes.href;
                return href ? `[${childrenMarkdown || href}](${href})` : childrenMarkdown;
            
            case 'UL':
                const ulPrefix = markdown.endsWith('\n\n') || markdown === '' ? '' : '\n';
                return `${ulPrefix}${element.children.map(child => `${'  '.repeat(listLevel)}* ${processNode(child, listLevel + 1, inTable).trim()}`).join('\n')}\n\n`;
            case 'OL':
                const olPrefix = markdown.endsWith('\n\n') || markdown === '' ? '' : '\n';
                let olCounter = 1;
                return `${olPrefix}${element.children.map(child => `${'  '.repeat(listLevel)}${olCounter++}. ${processNode(child, listLevel + 1, inTable).trim()}`).join('\n')}\n\n`;
            case 'LI': return `${childrenMarkdown.trim()}`; 

            case 'BLOCKQUOTE': return `> ${childrenMarkdown.replace(/\n/g, '\n> ')}\n\n`;
            
            case 'PRE':
                 const codeChild = element.children.find(c => typeof c !== 'string' && c.tagName === 'CODE') as SimpleHtmlElement | undefined;
                 const langMatch = codeChild?.attributes.class?.match(/language-(\w+)/);
                 const lang = langMatch ? langMatch[1] : '';
                 // Extract text content from all children of PRE, not just a single CODE child
                 const preContent = element.children.map(c => typeof c === 'string' ? c : (c as SimpleHtmlElement).children.join('')).join('').trim();
                 return `\`\`\`${lang}\n${preContent}\n\`\`\`\n\n`;
            case 'CODE':
                 if (element.parentElement?.tagName === 'PRE') return childrenMarkdown; // Already handled by PRE
                 return `\`${childrenMarkdown}\``;
            
            case 'IMG':
                let src = element.attributes.src;
                const alt = element.attributes.alt || '';
                // Simple check for base64, could be expanded
                if (src && !src.startsWith('http') && !src.startsWith('data:image')) {
                    src = ''; // Invalid or local file path, ignore
                }
                return src ? `![${alt}](${src})` : '';
            
            case 'BR': return '\n';
            case 'HR': return '\n---\n\n';

            case 'TABLE':
                let tableMd = '\n';
                const tHead = element.children.find(c => typeof c !== 'string' && c.tagName === 'THEAD') as SimpleHtmlElement | undefined;
                const tBodyChildren = (element.children.find(c => typeof c !== 'string' && c.tagName === 'TBODY') as SimpleHtmlElement | undefined)?.children;
                // If no TBODY, look for TRs directly under TABLE
                const tRows = (tBodyChildren || element.children.filter(c => typeof c !== 'string' && c.tagName === 'TR')) as (SimpleHtmlElement | string)[];


                if (tHead) {
                    const headerRow = tHead.children.find(c => typeof c !== 'string' && c.tagName === 'TR') as SimpleHtmlElement | undefined;
                    if (headerRow) {
                        const thCells = headerRow.children.filter(c => typeof c !== 'string' && (c.tagName === 'TH' || c.tagName === 'TD')) as SimpleHtmlElement[];
                        if (thCells.length > 0) {
                            tableMd += `| ${thCells.map(th => processNode(th, 0, true).trim().replace(/\|/g, '\\|')).join(' | ')} |\n`;
                            tableMd += `| ${thCells.map(() => '---').join(' | ')} |\n`;
                        }
                    }
                } else if (tRows.length > 0 && typeof tRows[0] !== 'string') { 
                    const firstRowCells = (tRows[0] as SimpleHtmlElement).children.filter(c => typeof c !== 'string' && (c.tagName === 'TD' || c.tagName === 'TH')) as SimpleHtmlElement[];
                     if (firstRowCells.length > 0) {
                        tableMd += `| ${firstRowCells.map(cell => processNode(cell, 0, true).trim().replace(/\|/g, '\\|')).join(' | ')} |\n`;
                        tableMd += `| ${firstRowCells.map(() => '---').join(' | ')} |\n`;
                        tRows.shift(); 
                     }
                }

                tRows.forEach(rowNode => {
                    if (typeof rowNode === 'string') return;
                    const cells = rowNode.children.filter(c => typeof c !== 'string' && (c.tagName === 'TD' || c.tagName === 'TH')) as SimpleHtmlElement[];
                    if (cells.length > 0) { // Only add row if it has cells
                         tableMd += `| ${cells.map(cell => processNode(cell, 0, true).trim().replace(/\|/g, '\\|')).join(' | ')} |\n`;
                    }
                });
                return tableMd + (tableMd.trim() === '' ? '' : '\n'); // Add trailing newline if table has content

            case 'TH': case 'TD': return childrenMarkdown.replace(/\n+/g, ' ').trim(); 
            
            case 'SUP': return `<sup>${childrenMarkdown}</sup>`;
            case 'SUB': return `<sub>${childrenMarkdown}</sub>`;
            case 'MARK': return `<mark>${childrenMarkdown}</mark>`;
            
            case 'SPAN': case 'FONT': 
                let styledContent = childrenMarkdown;
                const stylesToApply: string[] = [];
                if (element.style) {
                    if (element.style.color) stylesToApply.push(`color: ${element.style.color};`);
                    if (element.style.backgroundColor && element.style.backgroundColor !== 'transparent') stylesToApply.push(`background-color: ${element.style.backgroundColor};`);
                    if (element.style.fontSize) stylesToApply.push(`font-size: ${element.style.fontSize};`);
                    
                    let hasBold = false, hasItalic = false, hasUnderline = false, hasStrikethrough = false;

                    // Check if children already apply these styles to avoid double-wrapping
                    if (typeof element.children[0] === 'object') {
                        const firstChild = element.children[0] as SimpleHtmlElement;
                        if (['STRONG', 'B'].includes(firstChild.tagName)) hasBold = true;
                        if (['EM', 'I'].includes(firstChild.tagName)) hasItalic = true;
                        if (firstChild.tagName === 'U') hasUnderline = true;
                        if (['S', 'STRIKE'].includes(firstChild.tagName)) hasStrikethrough = true;
                    }


                    if ((element.style.textDecorationLine?.includes('underline') || element.style.textDecoration?.includes('underline')) && !hasUnderline ) {
                         styledContent = `<u>${styledContent}</u>`;
                    }
                    if (element.style.textDecorationLine?.includes('line-through') && !hasStrikethrough) {
                         styledContent = `<s>${styledContent}</s>`; // Use <s> for strikethrough consistency
                    }
                    if ((element.style.fontWeight === 'bold' || parseInt(element.style.fontWeight, 10) >= 700) && !hasBold) {
                         styledContent = `**${styledContent}**`;
                    }
                    if (element.style.fontStyle === 'italic' && !hasItalic) {
                         styledContent = `*${styledContent}*`;
                    }
                }
                 if (element.tagName === 'FONT' && element.attributes.color && !stylesToApply.some(s => s.startsWith('color:'))) {
                     stylesToApply.push(`color: ${element.attributes.color};`);
                 }

                if (stylesToApply.length > 0) {
                    return `<span style="${stylesToApply.join(' ')}">${styledContent}</span>`;
                }
                return styledContent;

            case 'DIV': 
                if (element.style?.textAlign) {
                     return `<div style="text-align: ${element.style.textAlign};">\n${childrenMarkdown}\n</div>\n\n`;
                }
                return `\n${childrenMarkdown}\n\n`;

            default: 
                const blockTags = ['ADDRESS', 'ARTICLE', 'ASIDE', 'DETAILS', 'DIALOG', 'DD', 'DL', 'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'HEADER', 'HGROUP', 'MAIN', 'NAV', 'SECTION', 'SUMMARY'];
                if (blockTags.includes(element.tagName) || element.style?.display === 'block') {
                    return `\n${childrenMarkdown}\n\n`;
                }
                return childrenMarkdown; 
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
        .replace(/^[\s\n]*/, '') // Remove leading whitespace/newlines
        .replace(/[\s\n]*$/, ''); // Remove trailing whitespace/newlines
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
            if (start > 0 && currentContent[start - 1] !== '\n') {
                 prefix = '\n' + prefix;
            }
            if (end < currentContent.length && currentContent[end] !== '\n') {
                 suffix = suffix + '\n';
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

        let prefixNewline = (start > 0 && currentContent[start-1] !== '\n') ? '\n' : '';
        if (start > 1 && currentContent[start-1] === '\n' && currentContent[start-2] === '\n') prefixNewline = ''; 

        if (selectedText) { 
            const lines = selectedText.split('\n');
            const newLines = lines.map((line, index) => marker === '1.' ? `${index + 1}. ${line}` : `${marker} ${line}`);
            let textToInsert = newLines.join('\n');
            if (prefixNewline && !selectedText.startsWith('\n')) textToInsert = prefixNewline + textToInsert;


            const newText = `${currentContent.substring(0, start)}${textToInsert}${currentContent.substring(end)}`;
            onContentChange(newText);
            requestAnimationFrame(() => {
                textarea.focus();
                textarea.setSelectionRange(start + (prefixNewline ? 1:0), start + textToInsert.length);
            });
        } else { 
            const currentLineStart = currentContent.lastIndexOf('\n', start - 1) + 1;
            const textBeforeCursorOnLine = currentContent.substring(currentLineStart, start);
            const textAfterCursorOnLine = currentContent.substring(start, currentContent.indexOf('\n', start) === -1 ? currentContent.length : currentContent.indexOf('\n', start));
            
            const itemPrefix = marker === '1.' ? '1. ' : `${marker} `;
            const textToInsert = `${itemPrefix}${textBeforeCursorOnLine}`; 
            
            const newText = currentContent.substring(0, currentLineStart) + 
                            prefixNewline +
                            textToInsert + 
                            textAfterCursorOnLine;

            onContentChange(newText);
            requestAnimationFrame(() => {
                textarea.focus();
                textarea.setSelectionRange(currentLineStart + prefixNewline.length + itemPrefix.length, currentLineStart + prefixNewline.length + itemPrefix.length);
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
        if (userInput !== null && userInput.trim() !== '') { 
            const { before, defaultText, after, isBlock = false, replaceSelection = false } = formatFn(userInput, selectedText);
            insertText(before, defaultText, after, isBlock, replaceSelection);
        }
    }, [insertText, currentContent, textareaRef]);

    const handleAlignment = useCallback((alignType: 'left' | 'center' | 'right' | 'justify') => {
        insertText(`<div style="text-align:${alignType};">\n`, 'aligned text', '\n</div>', true, true);
    }, [insertText]);
    
    const handleColor = () => {
        const color = prompt('Enter color (e.g., red, #FF0000):');
        if (color) {
            insertText(`<span style="color:${color};">`, 'colored text', '</span>', false, false);
        }
    };

    const handleFontSize = () => {
        const size = prompt('Enter font size (e.g., 12px, 1.5em, large):');
        if (size) {
            insertText(`<span style="font-size:${size};">`, 'sized text', `</span>`, false, false);
        }
    };
    
    const handleTable = () => {
        const tableMarkdown = "\n| Header 1 | Header 2 |\n|---|---|\n| Cell 1.1 | Cell 1.2 |\n| Cell 2.1 | Cell 2.2 |\n";
        insertText(tableMarkdown, '', '', true, true);
    };


    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border border-input rounded-t-md bg-background sticky top-0 z-10">
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Bold (Ctrl+B)" onClick={() => insertText('**', 'bold text', '**')}> <Bold className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Italic (Ctrl+I)" onClick={() => insertText('*', 'italic text', '*')}> <Italic className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Underline (Ctrl+U)" onClick={() => insertText('<u>', 'underlined text', '</u>')}> <Underline className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Strikethrough" onClick={() => insertText('~~', 'strikethrough text', '~~')}> <Strikethrough className="h-4 w-4" /> </Button>
            
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Link (Ctrl+K)" onClick={() => handlePromptAndInsert('Enter URL:', (url, selected) => ({ before: '[', defaultText: selected || 'Link Text', after: `](${url})`, replaceSelection: !!selected }))}> <LinkIcon className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Image" onClick={() => handlePromptAndInsert('Enter Image URL:', (url, selected) => ({ before: '\n![', defaultText: selected || 'Image Alt Text', after: `](${url})\n`, isBlock: true, replaceSelection: true }))}> <ImageIcon className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="YouTube Video" onClick={() => handlePromptAndInsert('Enter YouTube Video URL:', (url) => ({ before: '\n', defaultText: url, after: '\n', isBlock: true, replaceSelection: true }))}> <Youtube className="h-4 w-4" /> </Button>

            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Blockquote" onClick={() => insertText('> ', 'quoted text', '', true, true)}> <Quote className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Inline Code" onClick={() => insertText('`', 'code', '`')}> <Code className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Code Block (Preformatted)" onClick={() => insertText('```\n', 'code block', '\n```', true, true)}> <SquareCode className="h-4 w-4" /> </Button>
            
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

