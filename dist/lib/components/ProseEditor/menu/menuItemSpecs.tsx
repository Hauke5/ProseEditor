import { useId }                 from 'react'
import { mdiCodeJson, mdiFormatIndentDecrease, mdiFormatIndentIncrease, 
         mdiFormatListBulletedSquare, mdiFormatListNumbered, mdiFormatSubscript, mdiFormatSuperscript, 
         mdiLink, mdiMarker, mdiOrderBoolAscendingVariant, mdiRedoVariant, mdiUndoVariant } 
                                 from '@mdi/js'
import { EditorState }           from 'prosemirror-state'
import { undo, redo }            from 'prosemirror-history'
import { EditorView }            from 'prosemirror-view'
import { MenuItemSpec }          from '@/lib/components/Menu/Menu'
import { DialogConfig, ItemsLiteral, OpenDialog }         
                                 from '@/lib/components/Dialog/DialogTypes'
import { Icon }                  from '@/lib/components/Icon'
import styles                    from './menu.module.scss'
import { bold, link, italic, underline, strike, code, sub, sup, mark }            
                                 from '../pm/marks'
import { blockQuote, codeBlock, bulletList, orderedList, todoList, heading, paragraph }            
                                 from '../pm/nodes'
import { isNodeActive }          from '../pm/nodes/common'
import { ItemCommand }           from '../pm/common'

type MenuActions = {
   isActive:      ItemCommand
   isDisabled?:   ItemCommand
   action:        ItemCommand
}

export type MenuItemSpecs = {
   [key:string]:(...params:any[]) => MenuItemSpec
}

export const menuItemSpecs = (view:EditorView, openDialog?:OpenDialog):MenuItemSpecs => {
   return {
      bold: (short=true)=> ({
         hint:          'Bold\n',
         label:         short? 'B' : 'Bold', 
         classNameLabel:styles.boldButton,
         hook:          getItemHook(view, {
            action:     bold.commands.toggle,
            isActive:   bold.commands.isActive,
         })
      }) ,
      italic: (short=true)=> ({
         hint:          'Italic\n',
         label:         short? 'I' : 'Italic', 
         classNameLabel:styles.italicButton,
         hook:          getItemHook(view, {
            action:     italic.commands.toggle,
            isActive:   italic.commands.isActive,
         })
      }),
      underline: (short=true)=> ({
         hint:          'Underline\n',
         label:         short? 'U' : 'Underline', 
         classNameLabel:styles.underlineButton,
         hook:          getItemHook(view, {
            action:     underline.commands.toggle,
            isActive:   underline.commands.isActive,
         })
      }),
      strikethrough: (short=true)=> ({
         hint:          'Strike through\n',
         label:         short? 'S' : 'Strike', 
         classNameLabel:styles.strikeButton,
         hook:          getItemHook(view,{
            action:     strike.commands.toggle,
            isActive:   strike.commands.isActive,
         })
      }),
      super: (short=true)=> ({
         hint:          'Superscript\n',
         icon:          short? mdiFormatSuperscript : undefined,
         label:         short? undefined : <span><sup>super</sup>-script</span>,
         hook:          getItemHook(view, {
            action:     sup.commands.toggle,
            isActive:   sup.commands.isActive,
         })
      }),
      sub: (short=true)=> ({
         hint:          'Subscript\n',
         icon:          short? mdiFormatSubscript : undefined,
         label:         short? undefined : <span><sub>sub</sub>-script</span>,
         hook:          getItemHook(view, {
            action:     sub.commands.toggle,
            isActive:   sub.commands.isActive,
         })
      }),
      mark: (short=true)=> ({
         hint:          'Mark\n',
         // className:     styles.mark,
         label:         short? <Icon mdi={mdiMarker} size={17} pre={true} className={styles.mark}/> : <mark>Mark</mark>,
         classNameLabel:styles.markButton,
         hook:          getItemHook(view, {
            action:     mark.commands.toggle,
            isActive:   mark.commands.isActive,
         })
      }),
      link: ()=> ({
         hint:          'Link\n',
         icon:          mdiLink, 
         hook:          getLinkHook(view, openDialog)
      }),
      code: (short=true)=> ({
         hint:          'Code\n',
         icon:          short? mdiCodeJson : undefined,
         label:         short? undefined : 'Code',
         classNameLabel:styles.codeButton,
         hook:          getItemHook(view, {
            action:     code.commands.toggle,
            isActive:   code.commands.isActive,
         }),
      }),      
      codeBlock: ()=> ({
         hint:          'Code Block',
         // icon:          mdiCodeBlockBraces,
         label:         <pre className={styles.pre}>Code Block</pre>,
         hook:          getItemHook(view, {
            action:     codeBlock.commands.toggle,
            isActive:   (state: EditorState) => isNodeActive(codeBlock.name)(state),
         }),
         isDisabled:    () => false
      }),      
      blockQuote: ()=> ({
         hint:          'Blockquote',
         // icon:          mdiFormatQuoteClose,
         label:         'Block Quote',
         classNameLabel:styles.blockQuote,
         hook:          getItemHook(view, {
            action:     blockQuote.commands.toggle,
            isActive:   blockQuote.commands.isActive,
         }),
         isDisabled:    () => false
      }),      
      bulletList: ()=> ({
         hint:          'bulleted list',
         label:         'Bullet List',
         icon:          mdiFormatListBulletedSquare,
         hook:          getItemHook(view, {
            action:     bulletList.commands.toggle,
            isActive:   bulletList.commands.isActive,
         })
      }),      
      orderedList: ()=> ({
         hint:          'ordered list\n',
         label:         'Ordered List',
         icon:          mdiFormatListNumbered,
         hook:          getItemHook(view, {
            action:     orderedList.commands.toggle,
            isActive:   orderedList.commands.isActive,
         })
      }),      
      toDoList: ()=> ({
         hint:          'to do list\n',
         label:         'To Do List',
         icon:          mdiOrderBoolAscendingVariant,
         hook:          getItemHook(view, {
            action:     todoList.commands.toggle,
            isActive:   todoList.commands.isActive,
         })
      }),      
      indentList: ()=> ({
         hint:          'list indent increase\n',
         label:         'Indent List',
         icon:          mdiFormatIndentIncrease,
         hook:          getItemHook(view, {
            action:     bulletList.commands.toggle,
            isActive:   ()=>false,
            isDisabled: ()=>(state:EditorState)=>!bulletList.commands.isActive(state)
         })
      }),      
      outdentList: ()=> ({
         hint:          'list indent decrease\n',
         label:         'Outdent List',
         icon:          mdiFormatIndentDecrease,
         hook:          getItemHook(view, {
            action:     bulletList.commands.toggle,
            isActive:   ()=>false,
            isDisabled: ()=>(state:EditorState)=>!bulletList.commands.isActive(state)
         })
      }),      
      undo: ()=> ({
         hint:          'Undo\n',
         icon:          mdiUndoVariant,
         hook:          getHistoryHook(view, {
            action:     undo,
            isActive:   () => false
         })
      }),
      redo: ()=> ({
         hint:          'Redo\n',
         icon:          mdiRedoVariant,
         hook:          getHistoryHook(view, {
            action:     redo,
            isActive:   () => false
         })
      }),
      heading: (level:number) => ({
         hint:          `Heading ${level}`,
         label:         `Heading ${level}`, 
         className:     styles[`h${level}Menu`],
         // classNameLabel:`h${level}`,
         hook:          getItemHook(view, {
            action:     heading.commands.toggle(level),
            isActive:   heading.commands.isActive(level),
         })
      }),
      paragraph: ()=> ({
         hint:          'Paragraph',
         label:         <span className={styles.codeButton}>Plain Paragraph</span>, 
         hook:          getItemHook(view, {
            action:        paragraph.commands.toggle,
            isActive:      paragraph.commands.isActive,
         }),
         isDisabled:    () => false
      })
   }
}



function getItemHook(view:EditorView, item:MenuActions) {
   return (desc:MenuItemSpec):MenuItemSpec => {
      desc.action = () => {
         if (view?.dispatch && item.action?.(view.state, view.dispatch, view)) view.focus();
      }
      desc.isActive = () => (view.state && item.isActive?.(view.state))? true : false

      if (desc.isDisabled===undefined) 
         desc.isDisabled = ()=> !(view.editable && item.action?.(view.state))
      return desc
   }
}


function getHistoryHook(view:EditorView, item:MenuActions) {
   return (desc:MenuItemSpec):MenuItemSpec => {
      desc.action = () => {
         if (view?.dispatch) item.action?.(view.state, view.dispatch, view)
      }
      desc.isActive   = ()=>false
      desc.isDisabled = ()=>false
      return desc
   }
}


const DlgKeys = {
   Text: 'Text',
   Link: 'Link',

   SetLinkButton: 'Set',
}

const linkDlg = (text:string, href=''):DialogConfig => ({
   title: `Add Link:`,
   items:[
      // {[DlgKeys.Text]:{type:'text',   initial:text,  label: 'Text:' },
      {[DlgKeys.Link]:  {type:'text',   initial:href,  label: 'Link:' }},
   ],
   buttons:[
      {[DlgKeys.SetLinkButton]: {disable:disabledSetButton}},
   ]
})

function disabledSetButton(values:ItemsLiteral) {
   return (values[DlgKeys.Text].value as string).length>0? false : true
}


function getLinkHook(view:EditorView, openDialog?:OpenDialog) {
   return (desc:MenuItemSpec):MenuItemSpec => {
      const id = useId()
      desc.id = id
      if (!view) return desc

      const {href, text} = link.queryLinkAttrs(view.state)

      desc.action =     () => text? doDialog() : undefined
      desc.isDisabled = () => text?false:true
   
      async function doDialog() {
         const results = await openDialog?.(linkDlg(text, href))
         if (results?.actionName === DlgKeys.SetLinkButton) {
            // const linkText = results.values.get(DlgKeys.Text) as string
            const linkURL  = results.items[DlgKeys.Link].value as string
            if (view.dispatch) {
               if (!link.commands.isActive(view.state)) {
                  link.commands.createLink(linkURL)(view.state, view.dispatch, view)
               } else {
                  link.commands.updateLink(linkURL)(view.state, view.dispatch, view)
               }
            }
         }
      }
      return desc 
   }     
}
  
export function isMarkActive(name:string):(state: EditorState)=>boolean {
   return (state: EditorState) => {
      const markType = state.schema.marks[name] ;
      if (!markType) throw Error(`markType ${name} not found`);
      let {from, $from, to, empty} = state.selection
      return empty 
         ? !!markType.isInSet(state.storedMarks || $from.marks())
         : state.doc.rangeHasMark(from, to, markType)
      }
}
