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
import { v4 } from 'uuid'

export interface Comment {
  id: string
  content: string
  replies: Comment[]
  createdAt: Date
}

const getNewComment = (content: string): Comment => {
  return {
    id: `a${v4()}a`,
    content,
    replies: [],
    createdAt: new Date()
  }
}

interface GPTResponse {
  comments: string[]
}

declare global {
  interface Window {
    editor: Editor | null
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
  const [comments, setComments] = useState<Comment[]>([])
  const [last_api_call_content_length, setLastApiCallContentLength] = useState<Number>(200)
  const [api_in_progress, setApiInProgress] = useState<Boolean>(false)
  const [currentPrompt, setCurrentPrompt] = useState("")

  const mapComments = (contents: string[]) => {
    const newComments = contents.map(content => getNewComment(content))
    setComments(newComments)
  }

  const [collabState, setCollabState] = useState<WebSocketStatus>(
    provider ? WebSocketStatus.Connecting : WebSocketStatus.Disconnected,
  )

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
        let content_size = 0
        let text = ""

        content.forEach(async (node, pos) => {
          let content = node.content
          content_size += content.size
          if (content.size > 5) {
            text += '\n'
            text += content.content[0].text
          }
        })
        console.log(aiToken)
        if ((content_size > (last_api_call_content_length + 100) || content_size < (last_api_call_content_length - 100)) && !api_in_progress) {
          setApiInProgress(true)
          const comments = await analyzeWithGPT(text)
          mapComments(comments)
          setLastApiCallContentLength(content_size)
          setApiInProgress(false)
        }
      },
      extensions: [
        ...ExtensionKit({
          provider,
        }),
        CommentExtension.configure({
          HTMLAttributes: {
            class: "my-comment",
          }
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

  const analyzeWithGPT = async (paragraph: string): Promise<string[]> => {

    const apiKey = ""
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
            content: `${currentPrompt}. Limit your response to 3 questions.Return your response as a JSON array of strings in this format: {"questions": ["question1", "question2", ...]}. For example: {"questions": ["Where is the supporting evidence?"]}

            Text to analyze: "${paragraph}"`
          }],
          temperature: 0.7,
          max_tokens: 100
        })
      });

      const data = await response.json();
      try {
        const parsedResponse: GPTResponse = JSON.parse(data.choices[0].message.content);
        return parsedResponse.questions;
      } catch (parseError) {
        console.error('Error parsing GPT response as JSON:', parseError);
        return [data.choices[0].message.content];
      }
    } catch (error) {
      console.error('Error calling GPT API:', error);
      return [];
    }
  }

  return { 
    editor, 
    users, 
    collabState, 
    comments,
    setCurrentPrompt
  }
}
