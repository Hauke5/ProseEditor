import { EditorView }            from "prosemirror-view";
import { ChangedState, changedContentKey, changedSelectionKey } 
                                 from "../plugins/changedPlugin";
import { usePluginState }        from "./usePluginState";
import { useCurrentView }        from "./useCurrentView";


/** 
 * triggers a redraw when the active document changes.
 * If no `view` is provided, 
 */
export function useContentChange(view?:EditorView|null):ChangedState {
   const currentView = useCurrentView()
   view ??= currentView.current
   const state = usePluginState<ChangedState>(changedContentKey, view) ?? 0
   return state
}

/** triggers a redraw when the active document changes */
export function useSelectionChange(view?:EditorView|null):ChangedState   {
   const currentView = useCurrentView()
   view ??= currentView.current
   const state = usePluginState<ChangedState>(changedSelectionKey, view) ?? 0
   return state
}
