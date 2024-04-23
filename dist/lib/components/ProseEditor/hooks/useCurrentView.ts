import { useRef }                from "react"
import { EditorView }            from "prosemirror-view"
import { useProseEditorContext } from "./useProseEditorContext"

export function useCurrentView() {
   const {currentView}  = useProseEditorContext()
   const view           = useRef<EditorView>()
   if (currentView) view.current = currentView
   return view
}