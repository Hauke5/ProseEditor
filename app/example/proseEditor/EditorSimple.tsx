import { useRef, useState } 
                        from "react";
import { EditorView }   from "prosemirror-view";
import { ProseEditor, serialize }  
                        from "@/lib/components/ProseEditor/ProseEditor";
import styles           from './page.module.scss'



export function EditorSimple({initialText}:{initialText:string}) {
   const view  = useRef<EditorView>()
   const [markDown, setMarkdown] = useState('')

   const getMarkdown = ()=>{
      if (view.current) setMarkdown(serialize(view.current.state))
   }

   return <div className={styles.content}>
      <button onClick={getMarkdown}>Get Markdown</button>
      <div className={styles.card}>
         <ProseEditor className={styles.editor} newContent={initialText} newView={(newView:EditorView)=>view.current = newView}/>
      </div>
      <MarkdownMonitor markdown={markDown}/>
   </div>
}

function MarkdownMonitor({markdown}:{markdown:string}) {
   return <div className={styles.markdown}>
      <div className={styles.title}>Markdown:</div>
      <pre className={styles.text}>
         {markdown}
      </pre>
   </div>
}


export function InstructionsSimple() {
   return <div className={styles.instructions}>
      Edit the text below. You can use Markdown syntax (e.g. **bold**) and some keyboard shortcuts (e.g. CMD-b).<br/>
      Click on the <code>Get Markdown</code> button to extract the editor&apos;s content as a markdown string that will 
      be shown on the left bottom panel. 
   </div>
}

export const codeSimple = `function EditorSimple({initialText}:{initialText:string}) {
   const view  = useRef<EditorView>()
   const [markDown, setMarkdown] = useState('')

   const getMarkdown = ()=>{
      if (view.current) setMarkdown(serialize(view.current.state))
   }

   return <div className={styles.content}>
      <button onClick={getMarkdown}>Get Markdown</button>
      <div className={styles.card}>
         <ProseEditor className={styles.editor} newContent={initialText} newView={(newView:EditorView)=>view.current = newView}/>
      </div>
      <MarkdownMonitor markdown={markDown}/>
   </div>
}

function MarkdownMonitor({markdown}:{markdown:string}) {
   return <div className={styles.markdown}>
      <div className={styles.title}>Markdown:</div>
      <pre className={styles.text}>
         {markdown}
      </pre>
   </div>
}`