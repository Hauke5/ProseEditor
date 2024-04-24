import { MutableRefObject, useContext, useRef }         
                        from "react"
import { ProseEditorContext, proseEditorContext }   
                        from "../ProseEditorContext"
import { EditorView }   from "prosemirror-view"
import { useLog } from "@/lib/hooks"

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
export function useProseEditorContext():ProseEditorContext {
   const log = useLog(`useProseEditorContext`)
   const context = useContext(proseEditorContext)
   if (!context) 
      log.error('useProsemirrorContext is called outside the context. The calling app is responsible for define `ProsemirrorContext`.')
   return context ?? {addView:()=>null, removeView:()=>null, currentView:null, views:[]}
}
