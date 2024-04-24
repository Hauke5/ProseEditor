'use client'
import { useState } 
                  from 'react'
import styles     from './page.module.scss'
import { EditorSimple, InstructionsSimple, codeSimple } 
                  from './EditorSimple'
import { EditorWithContext, InstructionsWithContext, codeWithContext } 
                  from './EditorWithContext'


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
}]

const initialText = `
## My Next Novel
*Once upon a time...*

...your text here...
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
      return <div className={styles.details}>
         <Component initialText={initialText} />
         <div className={styles.appCode}>
            <div className={styles.frame}>
               <div className={styles.title}>Code:</div>
               <pre className={styles.code}>{examples[app].code}</pre>
            </div>
         </div>
      </div>
   }
}
