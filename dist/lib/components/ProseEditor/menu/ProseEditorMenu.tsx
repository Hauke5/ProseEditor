import { useEffect, useRef, useState }   
                                 from 'react';
import { EditorView }            from 'prosemirror-view';
import { mdiFormatListNumbered } from '@mdi/js';
import { Dialog, OpenDialog }    from '@/lib/components/Dialog';
import { Menu, MenuItem, MenuItemSpec, menuSeparator }   
                                 from '@/lib/components/Menu/Menu';
import { BaseProps }             from '@/lib/components/BaseProps';
import { useSelectionChange }    from '../hooks/useChange';
import styles                    from './menuPopup.module.scss'
import { MenuItemSpecs, menuItemSpecs }
                                 from './menuItemSpecs';
import { useProseEditorContext } from '../hooks/useProseEditorContext';
import { useCurrentView }        from '../hooks/useCurrentView';


type ProseEditorMenuProps = BaseProps & {
   items?:  MenuItem[]
}
export function ProseEditorMenu({items, ...props}:ProseEditorMenuProps) {
   const view                      = useCurrentView()
   const [menuItems, setMenuItems] = useState<MenuItem[]>([])
   const openDialog                = useRef<OpenDialog>()
   const {currentView}             = useProseEditorContext()
   const change                    = useSelectionChange(currentView??undefined)

   useEffect(()=>{
      if (view.current) setMenuItems(items ?? defaultMenu(false, view.current, openDialog.current))
   },[view.current, items])
   return <>
      <Menu items={menuItems} className={styles.narrativeMenu} {...props} key={`_${change}`}/>
      <Dialog open={open=>openDialog.current=open} className={styles.popover}/>
   </>
}

export function defaultMenu(compressed=false, view:EditorView, openDialog?:OpenDialog) {
   const items = menuItemSpecs(view, openDialog)
   return compressed ? [
      items.undo(), items.redo(),
      menuSeparator('ver'),
      textSubmenu(items), 
      items.link(),
      menuSeparator('ver'),
      blockTypeSubmenu(items),
      menuSeparator('ver'),
      listSubmenu(items),
   ] : [
      items.undo(), items.redo(),
      menuSeparator('ver'),
      items.bold(), items.italic(), items.underline(), items.strikethrough(), items.code(), items.super(), items.sub(), items.mark(),
      items.link(),
      menuSeparator('ver'),
      blockTypeSubmenu(items),
      menuSeparator('ver'),
      listSubmenu(items),
   ]
}


function blockTypeSubmenu(items:MenuItemSpecs):MenuItemSpec {
   return {
      hint:          'Plain, Headings, Codeblock',
      // icon:          mdiFormatHeaderPound,
      label:         'Block...',
      subItems:      [items.paragraph(), ...Array(6).fill(1).map((a, i) => items.heading(i+1)), items.blockQuote(), items.codeBlock()]
   }
}
function textSubmenu(items:MenuItemSpecs):MenuItemSpec {
   return {
      hint:          'Font style',
      // icon:          mdiFormatItalic,
      label:         'Text...',
      subItems:      [items.bold(false), items.italic(false), items.underline(false), items.strikethrough(false), items.code(false), items.super(false), items.sub(false), items.mark(false)]
   }
}
function listSubmenu(items:MenuItemSpecs):MenuItemSpec {
   return {
      hint:          'List styles',
      icon:          mdiFormatListNumbered,
      label:         'List...',
      subItems:      [items.bulletList(), items.orderedList(), /*items.toDoList(),*/ items.indentList(), items.outdentList()]
   }
}