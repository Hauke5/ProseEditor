import { useRef }                from "react"
import { EditorView }            from "prosemirror-view"
import { useProseEditorContext } from "./useProseEditorContext"

export function useCurrentView() {
   const context = useProseEditorContext()
   const view = useRef<EditorView>()
   if (context)
      view.current = context.currentView ?? undefined
   else  
      throw Error(`useCurrentView requires ProsemirrorContext to be set by the calling function`)
   return view
}