import { useEffect, useState }           
                              from "react";
import { ProseEditor, serialize }        
                              from "@/lib/components/ProseEditor/ProseEditor";
import { ProseEditorContext } from "@/lib/components/ProseEditor/ProseEditorContext";
import { ProseEditorMenu }    from "@/lib/components/ProseEditor/menu/ProseEditorMenu";
import { useContentChange }   from "@/lib/components/ProseEditor/hooks/useChange";
import { useCurrentEditorViewRef }     from "@/lib/components/ProseEditor/hooks/useCurrentEditorView";
import styles                 from './page.module.scss'



export function EditorWithContext({initialText}:{initialText:string}) {
   return <ProseEditorContext>
      <Editor initialText={initialText} />
   </ProseEditorContext>
}

function Editor({initialText}:{initialText:string}) {
   const viewRef                 = useCurrentEditorViewRef()
   const contentChanged          = useContentChange()
   const [markDown, setMarkdown] = useState('')

   useEffect(()=>{
      if (viewRef.current) setMarkdown(serialize(viewRef.current.state))
   },[contentChanged, viewRef.current])

   return <div className={styles.content}>
      <ProseEditorMenu className={styles.menu}/>
      <div className={styles.card}>
         <ProseEditor className={styles.editor} newContent={initialText}/>
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


export function InstructionsWithContext() {
   return <ul className={styles.instructions}>
      Edit the text below. It can be styles using the menu, using Markdown syntax (e.g. **bold**) and some keyboard shortcuts (e.g. CMD-b).<br/>
      Using <code>ProseEditorContext</code> enables the app to react to automatically detect...
      <li>changes to the <b>text content</b>, which triggers a <code>setMarkdown</code> call with the serialized latest content. The converted markdown text is shown in the 
      bottom left panel and automatically updated. See the <code>useEffect</code> code on the right. </li>
      <li>changes in the <b>text selection</b>, which allows the menu bar to reflect the current formatting</li>
   </ul>
}

export const codeWithContext = `function EditorWithContext({initialText}:{initialText:string}) {
   return <ProseEditorContext>
      <Editor initialText={initialText} />
   </ProseEditorContext>
}

function Editor({initialText}:{initialText:string}) {
   const view                    = useCurrentView()
   const contentChanged          = useContentChange()
   const [markDown, setMarkdown] = useState('')

   useEffect(()=>{
      if (view.current) setMarkdown(serialize(view.current.state))
   },[contentChanged, view.current])

   return <div className={styles.content}>
      <ProseEditorMenu className={styles.menu}/>
      <div className={styles.card}>
         <ProseEditor className={styles.editor} newContent={initialText}/>
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

`