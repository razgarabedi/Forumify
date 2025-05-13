
"use client";

import React, { useState, RefObject, useCallback } from 'react';
import {
    Bold, Italic, Link as LinkIcon, List, ListOrdered, Quote, Code, SmilePlus, Image as ImageIcon, Strikethrough,
    Highlighter, 
    AlignCenter, AlignLeft, AlignRight, AlignJustify, 
    Superscript, Subscript,
    Sparkles, // Glow
    Palette, // Color
    CaseSensitive, // Font size
    Table, 
    Underline,
    SquareCode, // Preformatted text / Code block
    Youtube,
    Droplets, // Shadow (using Droplets as a visual metaphor)
    EyeOff, // Spoiler
    MoveLeft, // For float left (visual metaphor)
    MoveRight, // For float right (visual metaphor)

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
    parentElement?: SimpleHtmlElement; 
}


function parseHtmlToSimpleStructure(htmlString: string): (SimpleHtmlElement | string)[] {
    if (typeof window === 'undefined' || !window.DOMParser) {
        return [htmlString.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()];
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // Extract style definitions from <style> tags and apply them. This is complex.
    // For simplicity, we'll primarily rely on inline styles or browser computed styles.
    // A more robust solution would require a CSS parser.

    function parseNode(node: Node, parentElement?: SimpleHtmlElement): (SimpleHtmlElement | string) | null {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent || ""; 
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            
            // Skip style and script tags entirely
            if (element.tagName === 'STYLE' || element.tagName === 'SCRIPT') {
                return null;
            }

            const simpleElement: SimpleHtmlElement = {
                tagName: element.tagName.toUpperCase(),
                attributes: {},
                children: [],
                style: typeof window !== 'undefined' ? window.getComputedStyle(element) : element.style, // Use computed style if available
                parentElement
            };

            for (let i = 0; i < element.attributes.length; i++) {
                const attr = element.attributes[i];
                if (attr.name.toLowerCase() !== 'style') { // Store original attributes except style
                    simpleElement.attributes[attr.name] = attr.value;
                }
            }
            
            simpleElement.children = Array.from(element.childNodes)
                .map(childNode => parseNode(childNode, simpleElement))
                .filter(n => n !== null && (typeof n !== 'string' || n.trim() !== '')) as (SimpleHtmlElement | string)[];
            
            // If an element has no children and no meaningful attributes (besides style), and isn't self-closing like BR, IMG, HR
            // it might be an empty decorative tag. We might want to skip it unless it has styles.
            if (simpleElement.children.length === 0 && Object.keys(simpleElement.attributes).length === 0 && !['BR', 'IMG', 'HR'].includes(simpleElement.tagName) && (!simpleElement.style || simpleElement.style.length === 0)) {
                // return null; // Potentially skip empty, unstyled tags. This might be too aggressive.
            }

            return simpleElement;
        }
        return null;
    }
    return Array.from(doc.body.childNodes).map(node => parseNode(node)).filter(n => n !== null) as (SimpleHtmlElement | string)[];
}


function simpleStructureToMarkdown(nodes: (SimpleHtmlElement | string)[]): string {
    let markdown = "";

    function processNode(node: SimpleHtmlElement | string, listLevel: number = 0, inTable: boolean = false): string {
        if (typeof node === 'string') {
            return node.replace(/\u00A0/g, ' ').replace(/[\r\n]+/g, '\n'); // Normalize newlines for strings
        }

        const element = node as SimpleHtmlElement;
        let childrenMarkdown = element.children.map(child => processNode(child, element.tagName === 'UL' || element.tagName === 'OL' ? listLevel + 1 : listLevel, inTable || element.tagName === 'TABLE')).join('');
        
        // Preserve whitespace within <pre>
        if (element.tagName !== 'PRE') {
             // More selective trimming: only trim if it's a block element that isn't expected to preserve leading/trailing space for its content
            if (!['A', 'CODE', 'SPAN', 'FONT', 'SUP', 'SUB', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'STRIKE', 'MARK', 'TD', 'TH'].includes(element.tagName)) {
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
                const parentIsLi = element.parentElement?.tagName === 'LI';
                let pContent = childrenMarkdown;
                if (element.style?.textAlign && element.style.textAlign !== 'start' && element.style.textAlign !== 'left') {
                   pContent = `<div style="text-align: ${element.style.textAlign};">${childrenMarkdown}</div>`;
                }
                return parentIsLi ? pContent : `\n${pContent}\n\n`;

            case 'STRONG': case 'B': return `**${childrenMarkdown}**`;
            case 'EM': case 'I': return `*${childrenMarkdown}*`;
            case 'U': return `<u>${childrenMarkdown}</u>`; 
            case 'S': case 'STRIKE': return `~~${childrenMarkdown}~~`;
            
            case 'A':
                const href = element.attributes.href;
                return href ? `[${childrenMarkdown || href}](${href})` : childrenMarkdown;
            
            case 'UL':
                 const ulPrefix = listLevel === 0 && !(markdown.endsWith('\n\n') || markdown === '') ? '\n' : '';
                 return `${ulPrefix}${element.children.map(child => `${'  '.repeat(listLevel)}* ${processNode(child, listLevel + 1, inTable).trimStart()}`).join('\n')}\n\n`;
            case 'OL':
                 const olPrefix = listLevel === 0 && !(markdown.endsWith('\n\n') || markdown === '') ? '\n' : '';
                 let olCounter = parseInt(element.attributes.start || '1', 10);
                 return `${olPrefix}${element.children.map(child => `${'  '.repeat(listLevel)}${olCounter++}. ${processNode(child, listLevel + 1, inTable).trimStart()}`).join('\n')}\n\n`;
            case 'LI': return childrenMarkdown; 

            case 'BLOCKQUOTE': return `\n> ${childrenMarkdown.replace(/\n/g, '\n> ')}\n\n`;
            
            case 'PRE':
                 const codeChild = element.children.find(c => typeof c !== 'string' && c.tagName === 'CODE') as SimpleHtmlElement | undefined;
                 const langMatch = codeChild?.attributes.class?.match(/language-(\w+)/i); // Case-insensitive language match
                 const lang = langMatch ? langMatch[1] : '';
                 const preContent = element.children.map(c => {
                    if (typeof c === 'string') return c;
                    // For nested elements inside PRE (like SPANs from syntax highlighters), get their text content.
                    let text = "";
                    function getText(subNode: SimpleHtmlElement | string) {
                        if (typeof subNode === 'string') text += subNode;
                        else if (subNode.children) subNode.children.forEach(getText);
                    }
                    getText(c);
                    return text;
                 }).join('').trimEnd(); // Trim only trailing newlines/spaces
                 return `\n\`\`\`${lang}\n${preContent}\n\`\`\`\n\n`;
            case 'CODE':
                 if (element.parentElement?.tagName === 'PRE') return childrenMarkdown;
                 return `\`${childrenMarkdown}\``;
            
            case 'IMG':
                let src = element.attributes.src;
                const alt = element.attributes.alt || '';
                if (src && !src.startsWith('http') && !src.startsWith('data:image')) {
                    src = ''; 
                }
                return src ? `\n![${alt}](${src})\n` : '';
            
            case 'BR': return '\n';
            case 'HR': return '\n---\n\n';

            case 'TABLE':
                let tableMd = '\n';
                const tHead = element.children.find(c => typeof c !== 'string' && c.tagName === 'THEAD') as SimpleHtmlElement | undefined;
                const tBodyChildren = (element.children.find(c => typeof c !== 'string' && c.tagName === 'TBODY') as SimpleHtmlElement | undefined)?.children
                    || element.children.filter(c => typeof c !== 'string' && c.tagName === 'TR'); // Fallback to TRs directly under TABLE

                let headerCellsCount = 0;
                if (tHead) {
                    const headerRow = tHead.children.find(c => typeof c !== 'string' && c.tagName === 'TR') as SimpleHtmlElement | undefined;
                    if (headerRow) {
                        const thCells = headerRow.children.filter(c => typeof c !== 'string' && (c.tagName === 'TH' || c.tagName === 'TD')) as SimpleHtmlElement[];
                        if (thCells.length > 0) {
                            tableMd += `| ${thCells.map(th => processNode(th, 0, true).trim().replace(/\|/g, '\\|')).join(' | ')} |\n`;
                            tableMd += `| ${thCells.map(() => '---').join(' | ')} |\n`;
                            headerCellsCount = thCells.length;
                        }
                    }
                } else if (tBodyChildren.length > 0 && typeof tBodyChildren[0] !== 'string') { 
                    const firstRowCells = (tBodyChildren[0] as SimpleHtmlElement).children.filter(c => typeof c !== 'string' && (c.tagName === 'TD' || c.tagName === 'TH')) as SimpleHtmlElement[];
                     if (firstRowCells.length > 0) {
                        tableMd += `| ${firstRowCells.map(cell => processNode(cell, 0, true).trim().replace(/\|/g, '\\|')).join(' | ')} |\n`;
                        tableMd += `| ${firstRowCells.map(() => '---').join(' | ')} |\n`;
                        headerCellsCount = firstRowCells.length;
                        tBodyChildren.shift(); 
                     }
                }

                tBodyChildren.forEach(rowNode => {
                    if (typeof rowNode === 'string') return;
                    const cells = rowNode.children.filter(c => typeof c !== 'string' && (c.tagName === 'TD' || c.tagName === 'TH')) as SimpleHtmlElement[];
                    if (cells.length > 0) { 
                         tableMd += `| ${cells.map(cell => processNode(cell, 0, true).trim().replace(/\|/g, '\\|')).join(' | ')} `;
                         // Pad with empty cells if row has fewer cells than header
                         if (headerCellsCount > 0 && cells.length < headerCellsCount) {
                             tableMd += `${Array(headerCellsCount - cells.length).fill('| ').join('')}`;
                         }
                         tableMd += '|\n';
                    } else if (headerCellsCount > 0) { // Empty row, but ensure structure if headers exist
                        tableMd += `| ${Array(headerCellsCount).fill(' ').join(' | ')} |\n`;
                    }
                });
                return tableMd + (tableMd.trim() === '' ? '' : '\n'); 

            case 'TH': case 'TD': return childrenMarkdown.replace(/\n+/g, ' ').trim(); 
            
            case 'SUP': return `<sup>${childrenMarkdown}</sup>`;
            case 'SUB': return `<sub>${childrenMarkdown}</sub>`;
            case 'MARK': return `<mark>${childrenMarkdown}</mark>`;
            
            case 'SPAN': case 'FONT': 
                let styledContent = childrenMarkdown;
                const stylesToApply: string[] = [];
                if (element.style) {
                    if (element.style.color && element.style.color !== 'inherit') stylesToApply.push(`color: ${element.style.color};`);
                    if (element.style.backgroundColor && element.style.backgroundColor !== 'transparent' && element.style.backgroundColor !== 'rgba(0, 0, 0, 0)') stylesToApply.push(`background-color: ${element.style.backgroundColor};`);
                    if (element.style.fontSize && element.style.fontSize !== 'inherit') stylesToApply.push(`font-size: ${element.style.fontSize};`);
                    
                    if (element.style.textDecorationLine?.includes('underline') || element.style.textDecoration?.includes('underline')) {
                         styledContent = `<u>${styledContent}</u>`;
                    }
                    if (element.style.textDecorationLine?.includes('line-through') || element.style.textDecoration?.includes('line-through')) {
                         styledContent = `<s>${styledContent}</s>`;
                    }
                    if (element.style.fontWeight === 'bold' || parseInt(element.style.fontWeight, 10) >= 700) {
                         styledContent = `**${styledContent}**`;
                    }
                    if (element.style.fontStyle === 'italic') {
                         styledContent = `*${styledContent}*`;
                    }
                     if (element.style.verticalAlign === 'super') {
                        styledContent = `<sup>${styledContent}</sup>`;
                    } else if (element.style.verticalAlign === 'sub') {
                        styledContent = `<sub>${styledContent}</sub>`;
                    }
                }
                 if (element.tagName === 'FONT' && element.attributes.color && !stylesToApply.some(s => s.startsWith('color:'))) {
                     stylesToApply.push(`color: ${element.attributes.color};`);
                 }
                // FONT size attribute is tricky, usually 1-7, maps to specific pixel sizes.
                // Modern browsers typically convert this to font-size style anyway.

                if (stylesToApply.length > 0) {
                    return `<span style="${stylesToApply.join(' ')}">${styledContent}</span>`;
                }
                return styledContent;

            case 'DIV': 
                let divStyles = "";
                if (element.style?.textAlign && element.style.textAlign !== 'start' && element.style.textAlign !== 'left') {
                     divStyles += `text-align: ${element.style.textAlign};`;
                }
                // Potentially handle other div styles like float here
                // For simplicity, we'll use classes for float applied by toolbar

                if (divStyles) {
                    return `\n<div style="${divStyles.trim()}">\n${childrenMarkdown.trim()}\n</div>\n\n`;
                }
                return `\n${childrenMarkdown.trim()}\n\n`; // Treat as block with spacing

            default: 
                const blockTags = ['ADDRESS', 'ARTICLE', 'ASIDE', 'DETAILS', 'DIALOG', 'DD', 'DL', 'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'HEADER', 'HGROUP', 'MAIN', 'NAV', 'SECTION', 'SUMMARY', 'AUDIO', 'VIDEO', 'CANVAS', 'NOSCRIPT'];
                if (blockTags.includes(element.tagName) || element.style?.display === 'block') {
                    return `\n${childrenMarkdown.trim()}\n\n`;
                }
                return childrenMarkdown; // Default for unknown inline tags
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
        .replace(/<(\w+)>\s*<\/\1>/g, '') // Remove empty tags like <span></span>
        .replace(/^[\s\n]*/, '') 
        .replace(/[\s\n]*$/, ''); 
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
             // Ensure block starts on a new line if not already
            if (start > 0 && currentContent[start - 1] !== '\n') {
                 prefix = '\n' + prefix;
            }
            // Ensure block ends with a new line if not already followed by one
            if (end < currentContent.length && currentContent[end] !== '\n' && !suffix.endsWith('\n')) {
                 suffix = suffix + '\n';
            }
             // Add an extra newline after block elements for better separation, unless already present
            if (!suffix.endsWith('\n\n') && suffix.endsWith('\n')) {
                suffix += '\n';
            } else if (!suffix.endsWith('\n')) {
                suffix += '\n\n';
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
         // Avoid triple newlines if already two newlines present
        if (start > 1 && currentContent[start-1] === '\n' && currentContent[start-2] === '\n') prefixNewline = ''; 

        if (selectedText) { 
            const lines = selectedText.split('\n');
            const newLines = lines.map((line, index) => marker === '1.' ? `${index + 1}. ${line}` : `${marker} ${line}`);
            let textToInsert = newLines.join('\n');
            
            // Ensure the list starts on a new line relative to preceding content.
            if (prefixNewline && !currentContent.substring(0,start).endsWith('\n\n') && !currentContent.substring(0,start).endsWith('\n')) {
                 textToInsert = prefixNewline + textToInsert;
            } else if (!currentContent.substring(0,start).endsWith('\n') && start > 0) {
                textToInsert = '\n' + textToInsert;
            }


            const newText = `${currentContent.substring(0, start)}${textToInsert}${currentContent.substring(end)}`;
            onContentChange(newText);
            requestAnimationFrame(() => {
                textarea.focus();
                textarea.setSelectionRange(start + (textToInsert.startsWith('\n') ? 1:0), start + textToInsert.length);
            });
        } else { 
            const itemPrefix = marker === '1.' ? '1. ' : `${marker} `;
            insertText(prefixNewline + itemPrefix, 'List item', '\n', false, true);
        }
    }, [textareaRef, currentContent, onContentChange, insertText]);

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
        insertText(`\n<div style="text-align:${alignType};">\n`, 'aligned text', '\n</div>\n', true, true);
    }, [insertText]);
    
    const handleColor = () => {
        const color = prompt('Enter text color (e.g., red, #FF0000, rgb(255,0,0)):');
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

    const handleFloat = (floatType: 'left' | 'right') => {
        insertText(`\n<div style="float:${floatType}; margin-${floatType === 'left' ? 'right' : 'left'}: 1em; margin-bottom: 0.5em;">\n`, 'floating content', '\n</div>\n<div style="clear:both;"></div>\n', true, true);
    };

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border border-input rounded-t-md bg-background sticky top-0 z-10">
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Bold (Ctrl+B)" onClick={() => insertText('**', 'bold text', '**')}> <Bold className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Italic (Ctrl+I)" onClick={() => insertText('*', 'italic text', '*')}> <Italic className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Underline (Ctrl+U)" onClick={() => insertText('<u>', 'underlined text', '</u>')}> <Underline className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Strikethrough" onClick={() => insertText('<s>', 'strikethrough text', '</s>')}> <Strikethrough className="h-4 w-4" /> </Button>
            
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Link (Ctrl+K)" onClick={() => handlePromptAndInsert('Enter URL:', (url, selected) => ({ before: '[', defaultText: selected || 'Link Text', after: `](${url})`, replaceSelection: !!selected }))}> <LinkIcon className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Image" onClick={() => handlePromptAndInsert('Enter Image URL:', (url, selected) => ({ before: '\n![', defaultText: selected || 'Image Alt Text', after: `](${url})\n`, isBlock: true, replaceSelection: true }))}> <ImageIcon className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="YouTube Video" onClick={() => handlePromptAndInsert('Enter YouTube Video URL:', (url) => ({ before: '\n', defaultText: url, after: '\n', isBlock: true, replaceSelection: true }))}> <Youtube className="h-4 w-4" /> </Button>

            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Blockquote" onClick={() => insertText('\n> ', 'quoted text', '\n', true, true)}> <Quote className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Inline Code" onClick={() => insertText('`', 'code', '`')}> <Code className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Code Block (Preformatted)" onClick={() => insertText('\n```\n', 'code block', '\n```\n', true, true)}> <SquareCode className="h-4 w-4" /> </Button>
            
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

            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Float Left" onClick={() => handleFloat('left')}> <MoveLeft className="h-4 w-4" /> </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Float Right" onClick={() => handleFloat('right')}> <MoveRight className="h-4 w-4" /> </Button>
        </div>
    );
}

export { parseHtmlToSimpleStructure, simpleStructureToMarkdown, cleanupMarkdown };

