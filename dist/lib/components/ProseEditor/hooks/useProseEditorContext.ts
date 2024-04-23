import { MutableRefObject, useContext, useRef }         
                        from "react"
import { ProsemirrorContext, prosemirrorContext }   
                        from "../ProseEditorContext"
import { EditorView }   from "prosemirror-view"

/** 
 * ## useProseEditorContext
 * provides the hooks to use `ProseEditorContext` in an app.
 * ### Hook usage: Create a `ProseEditor`
 * ```
 * function Component() {
 *    const {currentView, addView} = useProseEditorContext()
 *    return <Card>
 *       <Scrollable className={`${styles.narrative}`} hasHeader={showMenu}>
 *          {currentView && <NarrativeMenu view={currentView} className={styles.menu}/>}
 *          <ProseEditor className={styles.page} getView={setView} plugins={appPlugins()}/>
 *       </Scrollable>
 *    </Card>
 *
 *    function setView(view: EditorView) {
 *       log.info(`setView`)
 *       addView(view)
 *    }
 * }
 * ```
 * ### Hook usage: Creating a `ProseEditorMenu`
 * ```
 * function AppMenuBar() {
 *    const {currentView} = useProseEditorContext()
 *    return <ProseEditorMenu view={currentView} className={styles.menu}/>
 * }
 * ```
 * see {@link ProseEditorContext}
 */
export function useProseEditorContext():ProsemirrorContext {
   const context = useContext(prosemirrorContext)
   if (!context) throw Error("useProsemirrorContext is called outside the context. The calling app is responsible for define `ProsemirrorContext`.")
   return context
}


/**
 * **Uses Prosemirror Context!. Ensure that `ProseMirrorContexct` is set in the calling application.**
 * 
 * Retrieves and returns the `currentView` from the context.
 */
export function useCurrentView():MutableRefObject<EditorView | undefined> {
   const context = useProseEditorContext()
   const view = useRef<EditorView>()
   if (context)
      view.current = context.currentView ?? undefined
   else  
      throw Error(`useCurrentView requires ProsemirrorContext to be set by the calling function`)
   return view
}