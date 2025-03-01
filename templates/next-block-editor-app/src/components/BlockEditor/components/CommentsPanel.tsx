import React, { useState } from 'react'
import type { Comment } from '@/hooks/useBlockEditor'

interface CommentsPanelProps {
  comments: Comment[]
  onPromptChange: (prompt: string) => void
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({ comments, onPromptChange }) => {
  const [prompt, setPrompt] = useState(
    "Imagine you are a capable undergraduate student. However, you do not know the topic of the text in depth, you act as a Rubber duck reading the text for the first time. Ask an in-depth, detailed and specific question that is raised when you read the text, and a question about what might follow the text."
  )

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value)
    onPromptChange(e.target.value)
  }

  return (
    <div className="w-[30%] h-full border-l border-gray-200 bg-white overflow-y-auto flex flex-col">
      <div className="flex-1 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">AI Questions</h2>
        <p className="text-sm text-gray-600 mb-4">
          As you type, it automatically updates the questions it raises, without needing explicit prompting - every 100 characters requests are sent. 
        </p>
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{comment.content}</p>
              <div className="mt-2 text-xs text-gray-500">
                {new Date(comment.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-6 border-t border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Prompt
        </label>
        <textarea
          value={prompt}
          onChange={handlePromptChange}
          className="w-full p-3 border border-gray-300 rounded-md text-sm min-h-[150px]"
          rows={8}
        />
      </div>
    </div>
  )
} 