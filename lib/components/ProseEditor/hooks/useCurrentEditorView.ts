import { MutableRefObject, useRef }                
                                 from "react"
import { EditorView }            from "prosemirror-view"
import { useProseEditorContext } from "./useProseEditorContext"


/**
 * Returns a reference to the current editor view, i.e. the view that currently has the focus. Use `viewRef.current` to get the view itself.
 * Using a reference helps avoid a common trap when using a stale view within a closure in the calling component.
 */
export function useCurrentEditorViewRef():MutableRefObject<EditorView | null> {
   const context = useProseEditorContext()
   const view = useRef<EditorView|null>(null)
   if (!context) throw Error(`useCurrentView requires ProsemirrorContext to be set by the calling function`)
   
   view.current = context.views.filter(view => view.hasFocus())[0] ?? null
   return view
}