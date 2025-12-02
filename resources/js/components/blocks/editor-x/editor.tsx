"use client"

import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { EditorState, SerializedEditorState, $getRoot, $insertNodes } from "lexical"
import { $generateNodesFromDOM } from "@lexical/html"
import { useEffect, useRef } from "react"

import { editorTheme } from "@/components/editor/themes/editor-theme"
import { TooltipProvider } from "@/components/ui/tooltip"

import { nodes } from "./nodes"
import { Plugins } from "./plugins"

// Plugin to update editor state when HTML prop changes
function UpdateHtmlPlugin({ 
  html 
}: { 
  html?: string 
}) {
  const [editor] = useLexicalComposerContext()
  const previousHtmlRef = useRef<string>()
  const isInitialMount = useRef(true)

  useEffect(() => {
    if (html && typeof window !== 'undefined') {
      // Skip initial mount (already set via initialConfig)
      if (isInitialMount.current) {
        isInitialMount.current = false
        previousHtmlRef.current = html
        return
      }
      
      // Only update if HTML changed
      if (previousHtmlRef.current !== html) {
        previousHtmlRef.current = html
        
        editor.update(() => {
          const root = $getRoot()
          root.clear()
          
          const parser = new DOMParser()
          const dom = parser.parseFromString(html, 'text/html')
          const nodes = $generateNodesFromDOM(editor, dom)
          $insertNodes(nodes)
        })
      }
    }
  }, [editor, html])

  return null
}

// Plugin to update editor state when prop changes (only for external changes, not user input)
function UpdateStatePlugin({ 
  editorSerializedState 
}: { 
  editorSerializedState?: SerializedEditorState 
}) {
  const [editor] = useLexicalComposerContext()
  const previousPropStateRef = useRef<string>()
  const isInitialMount = useRef(true)

  useEffect(() => {
    if (editorSerializedState) {
      const incomingStateString = JSON.stringify(editorSerializedState)
      
      // Skip initial mount (already set via initialConfig)
      if (isInitialMount.current) {
        isInitialMount.current = false
        previousPropStateRef.current = incomingStateString
        return
      }
      
      // Get current editor state
      const currentEditorState = editor.getEditorState().toJSON()
      const currentEditorStateString = JSON.stringify(currentEditorState)
      
      // Only update if:
      // 1. The incoming prop state is different from current editor state (external change)
      // 2. The incoming prop state is different from previous prop state (new external value)
      // This prevents updating when user types (which would match current editor state)
      if (incomingStateString !== currentEditorStateString && 
          previousPropStateRef.current !== incomingStateString) {
        previousPropStateRef.current = incomingStateString
        
        try {
          const editorState = editor.parseEditorState(editorSerializedState)
          editor.setEditorState(editorState)
        } catch (error) {
          console.error('Failed to set editor state:', error)
        }
      } else {
        // Update ref to track prop value even if we don't update
        previousPropStateRef.current = incomingStateString
      }
    }
  }, [editor, editorSerializedState])

  return null
}

const editorConfig: InitialConfigType = {
  namespace: "Editor",
  theme: editorTheme,
  nodes,
  onError: (error: Error) => {
    console.error(error)
  },
}

export function Editor({
  editorState,
  editorSerializedState,
  html,
  onChange,
  onSerializedChange,
}: {
  editorState?: EditorState
  editorSerializedState?: SerializedEditorState
  html?: string
  onChange?: (editorState: EditorState) => void
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void
}) {
  return (
    <div className="bg-background overflow-hidden rounded-lg border shadow">
      <LexicalComposer
        initialConfig={{
          ...editorConfig,
          ...(editorState ? { editorState } : {}),
          ...(html && !editorState && !editorSerializedState && typeof window !== 'undefined'
            ? { 
                editorState: (editor) => {
                  const root = $getRoot()
                  root.clear()
                  const parser = new DOMParser()
                  const dom = parser.parseFromString(html, 'text/html')
                  const nodes = $generateNodesFromDOM(editor, dom)
                  $insertNodes(nodes)
                }
              }
            : {}),
          ...(editorSerializedState && !editorState && !html
            ? { 
                editorState: (editor) => editor.parseEditorState(editorSerializedState)
              }
            : {}),
        }}
      >
        <TooltipProvider>
          {html && <UpdateHtmlPlugin html={html} />}
          {editorSerializedState && !html && <UpdateStatePlugin editorSerializedState={editorSerializedState} />}
          <Plugins />

          <OnChangePlugin
            ignoreSelectionChange={true}
            onChange={(editorState) => {
              onChange?.(editorState)
              // Mark that we're updating from user input to prevent UpdateStatePlugin from interfering
              const serialized = editorState.toJSON()
              onSerializedChange?.(serialized)
            }}
          />
        </TooltipProvider>
      </LexicalComposer>
    </div>
  )
}
