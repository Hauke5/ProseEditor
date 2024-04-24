import { ProseEditor }  from "@/lib/components/ProseEditor/ProseEditor";
import styles           from './page.module.scss'



export function EditorSimple({initialText}:{initialText:string}) {
   return <div className={styles.card}>
      <ProseEditor className={styles.editor} newContent={initialText}/>
   </div>
}


export function InstructionsSimple() {
   return <div className={styles.instructions}>
      Edit the text below. You can use Markdown syntax (e.g. **bold**) and some keyboard shortcuts (e.g. CMD-b)
   </div>
}

export const codeSimple = `function EditorSimple({initialText}:{initialText:string}) {
   return <div className={styles.card}>
      <ProseEditor className={styles.editor} newContent={initialText}/>
   </div>
}`