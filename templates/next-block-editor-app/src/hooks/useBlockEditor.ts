import { useEffect, useRef, useState } from 'react'
import { useEditor, useEditorState } from '@tiptap/react'
import type { AnyExtension, Editor } from '@tiptap/core'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { TiptapCollabProvider, WebSocketStatus } from '@hocuspocus/provider'
import type { Doc as YDoc } from 'yjs'

import { ExtensionKit } from '@/extensions/extension-kit'
import { userColors, userNames } from '../lib/constants'
import { randomElement } from '../lib/utils'
import type { EditorUser } from '../components/BlockEditor/types'
import { initialContent } from '@/lib/data/initialContent'
import CommentExtension from "@sereneinserenade/tiptap-comment-extension";


declare global {
  interface Window {
    editor: Editor | null
  }
}
const analyzeWithGPT = async (paragraph: string, apiKey: string): Promise<string> => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{
          role: "user",
          content: `Critically analyze this paragraph and ONLY provide 2 brief questions (max 75 words total):
          "${paragraph}"`
        }],
        temperature: 0.7,
        max_tokens: 100
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling GPT API:', error);
    return '';
  }
}

export const useBlockEditor = ({
  aiToken,
  ydoc,
  provider,
  userId,
  userName = 'Maxi',
}: {
  aiToken?: string
  ydoc: YDoc | null
  provider?: TiptapCollabProvider | null | undefined
  userId?: string
  userName?: string
}) => {
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)

  const commentsSectionRef = useRef<HTMLDivElement | null>(null)

  const focusCommentWithActiveId = (id: string) => {
    if (!commentsSectionRef.current) return

    const commentInput = commentsSectionRef.current.querySelector<HTMLInputElement>(`input#${id}`)

    if (!commentInput) return

    commentInput.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    })
  }

  const [collabState, setCollabState] = useState<WebSocketStatus>(
    provider ? WebSocketStatus.Connecting : WebSocketStatus.Disconnected,
  )

  let paragraphIndexes: number[] = []

  const editor = useEditor(
    {
      immediatelyRender: true,
      shouldRerenderOnTransaction: false,
      autofocus: true,
      onCreate: ctx => {
        if (provider && !provider.isSynced) {
          provider.on('synced', () => {
            setTimeout(() => {
              if (ctx.editor.isEmpty) {
                ctx.editor.commands.setContent(initialContent)
              }
            }, 0)
          })
        } else if (ctx.editor.isEmpty) {
          ctx.editor.commands.setContent(initialContent)
          ctx.editor.commands.focus('start', { scrollIntoView: true })
        }
      },
      onUpdate: async ({ editor }) => {
        const content = editor.state.doc.content
        let all_ids: number[] = []
        content.forEach(async (node, pos) => {
          all_ids.push(node.attrs.id)
          if (node.type.name === 'paragraph' && !paragraphIndexes.includes(node.attrs.id)) {
            
            let content = node.content
            if (content.size > 50){
              if (!content.content[0].text.startsWith("\n") && content.content[0].text.endsWith(" ")) {

                paragraphIndexes.push(node.attrs.id)
                // Get paragraph text and analyze
                const paragraphText = content.content[0].text;
                const analysis = await analyzeWithGPT(paragraphText, aiToken);
                
                // Insert analysis as blockquote
                if (analysis) {
                  const { from, to } = editor.state.selection;
                  // editor.commands.insertContentAt(pos, `<my-comment>${analysis}</my-comment>`);
                  editor.commands.insertContentAt(pos, `<pre><code>${analysis}</code></pre>`);
                  editor.commands.setTextSelection({ from: from, to: to })
                }
              } 
            }
          }
        })
        
        paragraphIndexes.forEach(index => {
          if (!all_ids.includes(index)) {
            console.error(`Error: Paragraph index ${index} does not exist in the document.`)
          }
        })
      },
      extensions: [
        ...ExtensionKit({
          provider,
        }),
        CommentExtension.configure({
          HTMLAttributes: {
            class: "my-comment",
          },
          onCommentActivated: (commentId) => {
            setActiveCommentId(commentId);
      
            if (commentId) setTimeout(() => focusCommentWithActiveId(commentId));
          },
        }),
        provider && ydoc
          ? Collaboration.configure({
              document: ydoc,
            })
          : undefined,
        provider
          ? CollaborationCursor.configure({
              provider,
              user: {
                name: randomElement(userNames),
                color: randomElement(userColors),
              },
            })
          : undefined
      ].filter((e): e is AnyExtension => e !== undefined),
      editorProps: {
        attributes: {
          autocomplete: 'off',
          autocorrect: 'off',
          autocapitalize: 'off',
          class: 'min-h-full',
        },
      },
    },
    [ydoc, provider],
  )
  const users = useEditorState({
    editor,
    selector: (ctx): (EditorUser & { initials: string })[] => {
      if (!ctx.editor?.storage.collaborationCursor?.users) {
        return []
      }

      return ctx.editor.storage.collaborationCursor.users.map((user: EditorUser) => {
        const names = user.name?.split(' ')
        const firstName = names?.[0]
        const lastName = names?.[names.length - 1]
        const initials = `${firstName?.[0] || '?'}${lastName?.[0] || '?'}`

        return { ...user, initials: initials.length ? initials : '?' }
      })
    },
  })

  useEffect(() => {
    provider?.on('status', (event: { status: WebSocketStatus }) => {
      setCollabState(event.status)
    })
  }, [provider])

  window.editor = editor

  return { editor, users, collabState }
}
