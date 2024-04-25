'use client'
import { useState } 
                  from 'react'
import styles     from './page.module.scss'
import { EditorSimple, InstructionsSimple, codeSimple } 
                  from './EditorSimple'
import { EditorWithContext, InstructionsWithContext, codeWithContext } 
                  from './EditorWithContext'
import { EditorWithPlugins, InstructionsWithPlugins, codeWithPlugins } from './EditorWithPlugins'


type Example = {
   name:          string
   Instructions:  ()=>JSX.Element,
   Component:     ({initialText}:{initialText:string})=>JSX.Element,
   code:          string
}

const examples:Example[] = [{
   name:'', Instructions: ()=><></>, Component: ()=><></>, code:''
},{
   name:    'Simple Editor',
   Instructions:  InstructionsSimple,
   Component:     EditorSimple,
   code:          codeSimple
},{
   name:    'Editor using Context',
   Instructions:  InstructionsWithContext,
   Component:     EditorWithContext,
   code:          codeWithContext
},{
   name:    'Editor with Plugins',
   Instructions:  InstructionsWithPlugins,
   Component:     EditorWithPlugins,
   code:          codeWithPlugins
}]

const initialText = `
## My Next Novel
*Once upon a time...*

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore 
et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut 
aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum 
dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui 
officia deserunt mollit anim id est laborum.
`


export default function ProseEditorPage() {
   const [app, setApp] = useState(0)
   const Component = examples[app].Component
   return <div className={styles.app}>
      <div className={styles.general}>
         <Intro />
         <Instructions />
      </div>
      <EditorApp />
   </div>

   function Intro() {
      return <>
         <h2>ProseEditor</h2>
         <div className={styles.intro}>Choose one the following Editor examples to start:</div>
         <div className={styles.examples}>
            {examples.map((ex, i) => ex.name && <button onClick={()=>setApp(i)} key={ex.name}>{ex.name}</button>)}
         </div>
      </>
   }

   function Instructions() {
      return <>
         <h3>{examples[app].name}</h3>
         <div>
            {examples[app].Instructions()}
         </div>
      </>
   }

   function EditorApp() {
      const columns = examples[app].code? styles.twoColumns : styles.oneColumn
      return <div className={`${styles.details} ${columns}`}>
         <Component initialText={initialText} />
         {examples[app].code && <div className={styles.appCode}>
            <div className={styles.frame}>
               <div className={styles.title}>Code:</div>
               <pre className={styles.code}>{examples[app].code}</pre>
            </div>
         </div>}
      </div>
   }
}
