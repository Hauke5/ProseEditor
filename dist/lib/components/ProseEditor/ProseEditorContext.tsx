'use client'
import { createContext, useEffect }         
                                 from "react";
import { EditorView }            from "prosemirror-view";
import { BaseProps }             from "@/lib/components/BaseProps";
import { useContextState }       
                                 from "@/lib/hooks/useContextState";
import { ErrorBoundarySuspense } from "@/lib/errors/ErrorBoundary";
import { useLog }                from "@/lib/hooks";


type InternalContext = {
   currentView:   EditorView|null
   views:         EditorView[]
}

export type ProsemirrorContext = InternalContext & {
   addView:    (view:EditorView) => void
   removeView: (view:EditorView) => void
}

export const prosemirrorContext = createContext<ProsemirrorContext|null>(null)


type ProsemirrorContextProps = BaseProps & {
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
export function ProsemirrorContext({children}:ProsemirrorContextProps) {
   const log                      = useLog(`ProsemirrorContext`)
   const {context, updateContext} = useContextState<InternalContext>({views:[], currentView:null})
   
   // update plugins with new view: dispatch empty transition
   useEffect(()=>{
      if (context.currentView) {
         log.info(`ProsemirrorContext view change dispatch`)
         context.currentView.dispatch(context.currentView.state.tr)
      }
   },[context.currentView])
   
   return <ErrorBoundarySuspense what={`ProsemirrorContext`}>
      <prosemirrorContext.Provider value={{...context, addView, removeView}}>
         {children}
      </prosemirrorContext.Provider>
   </ErrorBoundarySuspense>

   function addView(view:EditorView) {
      (view as any).__myID = `view_${Math.floor(100000*Math.random())}`
      const i = context.views.findIndex(v => v===view)
      log.info(`addView ${i} id: ${(view as any).__myID}`)
      updateContext({currentView:view, views:context.views.concat(view)})
   }

   function removeView(view:EditorView) {
      const i = context.views.findIndex(v => v===view)
      const views = context.views.filter(v => v!==view)
      const currentView = context.views.at(-1) ?? null
      const inew = context.views.findIndex(v => v===currentView)
      log.info(`removeView ${i}, new current is ${inew}`)
      updateContext({currentView, views})
   }
}
