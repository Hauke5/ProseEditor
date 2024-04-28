'use client'
import { createContext, useRef }         
                                 from "react";
import { BaseProps }             from "@/lib/components/BaseProps";
import { useContextState }       
                                 from "@/lib/hooks/useContextState";
import { ErrorBoundarySuspense } from "@/lib/errors/ErrorBoundary";
import { useLog }                from "@/lib/hooks";
import { EditorView }            from "./ProseEditor";


type InternalContext = {
   currentView:   EditorView|null
   views:         EditorView[]
}

export type ProseEditorContext = InternalContext & {
   addView:    (view:EditorView) => void
   removeView: (view:EditorView) => void
}

export const proseEditorContext = createContext<ProseEditorContext|null>(null)


type ProseEditorContextProps = BaseProps & {
}
/**
 * ## ProsemirrorContext
 * provides a context convenience implementation. This context is not used by default within the `Narrative`
 * package. Rather, it is intended to be used on the app level. An example use might look like this:
 * ### Context Definition, e.g. in `layout.tsx`:
 * ```
 * export default function NarrativeLayout({children}:LayoutProps) {
 *   return <ProsemirrorContext>
 *      <NarrativeTitleBar />
 *      {children}
 *   </ProsemirrorContext>
 * }
 * ```
 * ### Context usage: Create a `NarrativeEditor`
 * ```
 * function Component() {
 *    const {currentView, addView} = useProsemirrorContext()
 *    return <Card>
 *       <Scrollable className={`${styles.narrative}`} hasHeader={showMenu}>
 *          {currentView && <NarrativeMenu view={currentView} className={styles.menu}/>}
 *          <NarrativeEditor className={styles.page} getView={setView} plugins={appPlugins()}/>
 *       </Scrollable>
 *    </Card>
 *
 *    function setView(view: EditorView) {
 *       log.info(`setView`)
 *       addView(view)
 *    }
 * }
 * ```
 * ### Context usage: Creating a `NarrativeMenu`
 * ```
 * function AppMenuBar() {
 *    const {currentView} = useProsemirrorContext()
 *    return <NarrativeMenu view={currentView} className={styles.menu}/>
 * }
 * ```
 */
export function ProseEditorContext({children}:ProseEditorContextProps) {
   const log               = useLog(`ProsemirrorContext`)
   const currentView       = useRef<EditorView|null>(null)
   const views             = useRef<EditorView[]>([])
   const {updateContext}   = useContextState<{}>({})
      
   return <ErrorBoundarySuspense what={`ProsemirrorContext`}>
      <proseEditorContext.Provider value={{currentView:currentView.current, views:views.current, addView, removeView}}>
         {children}
      </proseEditorContext.Provider>
   </ErrorBoundarySuspense>

   function addView(newView:EditorView) {
      const i = views.current.findIndex(v => v===newView)
      views.current.push(newView)
      log.debug(()=>`addView ${i<0?'new':'existing'} id: ${(newView as any).__myID} of ${views.current.length} views: [${viewsList()}]`)
      setActiveView()
      updateContext({})
   }

   function removeView(oldView:EditorView) {
      const i = views.current.findIndex(v => v===oldView)
      if (i<0) {
         log.warn(`removeView: did not find view ${(oldView as any).__myID} in [${viewsList()}]`)
         return
      }
      views.current = views.current.filter(v=>v.__myID!==oldView.__myID)
      setActiveView()
      const inew = views.current.findIndex(v => v===currentView.current)
      log.debug(()=>`removeView ${i}, id=${(oldView as any).__myID}, new current is ${inew} of ${views.current.length}: [${viewsList()}]`)
      updateContext({})
   }

   function setActiveView() {
      currentView.current = views.current.find(v=>v.hasFocus()) ?? null
   }

   function viewsList() {
      return views.current.map((v:any)=> v.__myID).join(', ')
   }
}
