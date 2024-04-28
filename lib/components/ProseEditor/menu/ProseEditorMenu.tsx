import { useEffect, useRef, useState }   
                                 from 'react';
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
import { useCurrentEditorViewRef }        from '../hooks/useCurrentEditorView';


type ProseEditorMenuProps = BaseProps & {
   items?:  MenuItem[]
}
export function ProseEditorMenu({items, ...props}:ProseEditorMenuProps) {
   const [menuItems, setMenuItems] = useState<MenuItem[]>([])
   const openDialog                = useRef<OpenDialog>()
   const {currentView}             = useProseEditorContext()
   const change                    = useSelectionChange(currentView??undefined)
   const defaultItems              = useDefaultMenu(false, openDialog.current)

   useEffect(()=>{
      setMenuItems(items ?? defaultItems)
   },[items, defaultItems.length])
   return <>
      <Menu items={menuItems} className={styles.narrativeMenu} {...props} key={`_${change}`}/>
      <Dialog open={open=>openDialog.current=open} className={styles.popover}/>
   </>
}

/**
 * return a list of standard menu items for use in `ProseEditorMenu`.
 * @param compressed (default=false): if `true`, items are organized in pulldown menus for a more compressed display
 * @param openDialog use
 * @returns 
 */
export function useDefaultMenu(compressed=false, openDialog?:OpenDialog):MenuItem[] {
   const viewRef  = useCurrentEditorViewRef()
   if (!viewRef.current) return []
   const items = menuItemSpecs(viewRef.current, openDialog)
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