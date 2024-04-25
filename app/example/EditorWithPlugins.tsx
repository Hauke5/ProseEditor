import { Plugin }             from "prosemirror-state";
import { ProseEditor, ProseEditorContext, VariableDefs, foldingHeadingPlugin, foldingTagPlugin, 
   tocPlugin, useTOCRule, useVariableRules, useWordCountRule, variablesPlugin, wordCountPlugin } 
                              from "@/lib/components/ProseEditor";
import styles                 from './page.module.scss'
import { readme }             from './readme'
import pluginStyles           from './pluginStyles.module.scss'
import { useEffect, useState } from "react";


export function EditorWithPlugins() {
   const [content, setContent] = useState('')
   useEffect(()=>{
      readme().then(setContent)
   },[])
   return <ProseEditorContext>
      <Editor initialText={content}/>
   </ProseEditorContext>
}

function Editor({initialText}:{initialText:string}) {
   const varRules       = useVariableRules()
   const wordCountRule  = useWordCountRule()
   const tocRule        = useTOCRule()
   return <div className={styles.card}>
      <ProseEditor className={`${styles.editor} ${styles.border}`} newContent={initialText} plugins={appPlugins}/>
   </div>

   function appPlugins():Plugin<any>[] {
      const rules:VariableDefs = Object.assign({}, varRules, wordCountRule, tocRule)
      return [
         foldingHeadingPlugin(),
         wordCountPlugin({show:true, className:pluginStyles.wordCount}),
         foldingTagPlugin(),
         tocPlugin(),
         variablesPlugin(rules),
      ]
   }   
}



export function InstructionsWithPlugins() {
   return <ul className={styles.instructions}>
      Edit the text below. It can be styles using the menu, using Markdown syntax (e.g. **bold**) and some keyboard shortcuts (e.g. CMD-b).<br/>
      Using <code>ProseEditorContext</code> enables the app to react to automatically detect...
      <li>changes to the <b>text content</b>, which triggers a <code>setMarkdown</code> call with the serialized latest content. The converted markdown text is shown in the 
      bottom left panel and automatically updated. See the <code>useEffect</code> code on the right. </li>
      <li>changes in the <b>text selection</b>, which allows the menu bar to reflect the current formatting</li>
   </ul>
}

export const codeWithPlugins = ''