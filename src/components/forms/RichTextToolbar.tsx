
"use client";

import React, { useState, RefObject } from 'react';
import {
    Bold, Italic, Link as LinkIcon, List, ListOrdered, Quote, Code, SmilePlus, Image as ImageIcon, Strikethrough
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useTheme } from 'next-themes'; // If using next-themes for dark mode

interface RichTextToolbarProps {
    textareaRef: RefObject<HTMLTextAreaElement>;
    onContentChange: (newContent: string) => void; // Callback to update parent's state
    currentContent: string; // Receive current content
}

export function RichTextToolbar({ textareaRef, onContentChange, currentContent }: RichTextToolbarProps) {
    const [linkUrl, setLinkUrl] = useState('');
    const { resolvedTheme } = useTheme(); // Get current theme (light/dark) if using next-themes

    const insertText = (before: string, defaultText: string, after: string = '', isBlock: boolean = false) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = currentContent.substring(start, end) || defaultText;
        let newText = '';

        if (isBlock) {
            // Add newlines before and after for block elements
            const prefix = currentContent.substring(0, start).endsWith('\n') || start === 0 ? '' : '\n';
            const suffix = currentContent.substring(end).startsWith('\n') || end === currentContent.length ? '' : '\n';
            newText = `${currentContent.substring(0, start)}${prefix}${before}${selectedText}${after}${suffix}${currentContent.substring(end)}`;
        } else {
             newText = `${currentContent.substring(0, start)}${before}${selectedText}${after}${currentContent.substring(end)}`;
        }

        onContentChange(newText); // Update parent state

        // Wait for state update and then set selection
        requestAnimationFrame(() => {
            if (textarea) {
                const newCursorPos = start + before.length;
                textarea.focus();
                // If we inserted default text, select it
                if (selectedText === defaultText && defaultText !== '') {
                    textarea.setSelectionRange(newCursorPos, newCursorPos + defaultText.length);
                } else {
                    // Otherwise, just place cursor after inserted text
                    textarea.setSelectionRange(start + before.length + selectedText.length + after.length, start + before.length + selectedText.length + after.length);
                }
            }
        });
    };

    const insertList = (marker: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedLines = currentContent.substring(start, end).split('\n');
        const isAlreadyList = selectedLines.every(line => line.trim().startsWith(marker + ' '));

        let processedLines;
        if (isAlreadyList) {
            // Remove marker
            processedLines = selectedLines.map(line => line.replace(new RegExp(`^\\s*\\${marker}\\s?`), ''));
        } else {
             // Add marker
             let counter = 1; // For ordered lists
             processedLines = selectedLines.map(line => {
                 const prefix = marker === '1.' ? `${counter++}. ` : `${marker} `;
                 // Avoid adding marker to empty lines within selection unless it's the only line
                 return (line.trim() === '' && selectedLines.length > 1) ? '' : prefix + line;
             });
        }


        const prefixContent = currentContent.substring(0, start);
        const suffixContent = currentContent.substring(end);
        const requiresPrefixNewline = start > 0 && !prefixContent.endsWith('\n\n') && !prefixContent.endsWith('\n');
        const requiresSuffixNewline = end < currentContent.length && !suffixContent.startsWith('\n\n') && !suffixContent.startsWith('\n');

        const newText = `${prefixContent}${requiresPrefixNewline ? '\n' : ''}${processedLines.join('\n')}${requiresSuffixNewline ? '\n' : ''}${suffixContent}`;

        onContentChange(newText);

         requestAnimationFrame(() => {
             if (textarea) {
                 textarea.focus();
                 // We can't easily predict selection after multi-line changes, so just place cursor at end
                 textarea.setSelectionRange(end, end);
             }
         });
    };

    const insertEmoji = (emojiData: EmojiClickData) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const emoji = emojiData.emoji;

        const newText = `${currentContent.substring(0, start)}${emoji}${currentContent.substring(end)}`;
        onContentChange(newText);

        requestAnimationFrame(() => {
            if (textarea) {
                const newCursorPos = start + emoji.length;
                textarea.focus();
                textarea.setSelectionRange(newCursorPos, newCursorPos);
            }
        });
    };

    const handleInsertLink = () => {
        const url = prompt('Enter the URL:', 'https://');
        if (url) {
            insertText('[', 'Link Text', `](${url})`);
        }
    };
     const handleInsertImage = () => {
        const url = prompt('Enter the Image URL:', 'https://');
         if (url) {
            // Alt text is often optional in markdown, use URL as placeholder
            insertText('![', 'Image Alt Text', `](${url})`, true); // Insert as block
        }
    };


    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border border-input rounded-t-md bg-background sticky top-0 z-10">
             <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Bold (Ctrl+B)" onClick={() => insertText('**', 'bold text', '**')}>
                <Bold className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Italic (Ctrl+I)" onClick={() => insertText('*', 'italic text', '*')}>
                <Italic className="h-4 w-4" />
            </Button>
             <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Strikethrough" onClick={() => insertText('~~', 'strikethrough text', '~~')}>
                <Strikethrough className="h-4 w-4" />
            </Button>
             <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Link (Ctrl+K)" onClick={handleInsertLink}>
                <LinkIcon className="h-4 w-4" />
            </Button>
             <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Image" onClick={handleInsertImage}>
                <ImageIcon className="h-4 w-4" />
            </Button>
             <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Blockquote" onClick={() => insertText('> ', 'quoted text', '', true)}>
                <Quote className="h-4 w-4" />
            </Button>
             <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Code" onClick={() => insertText('`', 'code', '`')}>
                <Code className="h-4 w-4" />
            </Button>
             <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Bulleted List" onClick={() => insertList('-')}>
                <List className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Numbered List" onClick={() => insertList('1.')}>
                <ListOrdered className="h-4 w-4" />
            </Button>

            <Popover>
                <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="icon" className="h-7 w-7" title="Emoji">
                        <SmilePlus className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-0" side="bottom" align="start">
                    <EmojiPicker
                        onEmojiClick={insertEmoji}
                        autoFocusSearch={false}
                         // Adapt theme based on next-themes (optional)
                        theme={resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT}
                        skinTonesDisabled
                        lazyLoadEmojis
                        searchDisabled // Keep it simple
                        // categories={[ // Optionally limit categories
                        //     {category: Categories.SMILEYS_PEOPLE, name: 'Smileys & People'},
                        //     {category: Categories.ANIMALS_NATURE, name: 'Animals & Nature'},
                        //     {category: Categories.FOOD_DRINK, name: 'Food & Drink'},
                        //     {category: Categories.TRAVEL_PLACES, name: 'Travel & Places'},
                        //     {category: Categories.ACTIVITIES, name: 'Activities'},
                        // ]}
                         />
                </PopoverContent>
            </Popover>
        </div>
    );
}
