import { useEffect, useRef, useState } 
                        from 'react';
import { EditorView }   from 'prosemirror-view';
import { Dialog, OpenDialog }   
                        from '@/lib/components/Dialog';
import { Menu }         from '@/lib/components/Menu/Menu';
import { defaultMenu }  from './ProseEditorMenu';
import styles           from '../styles/proseEditor.module.scss'


export type OpenPopup = (xpos:number, ypos:number)=>Promise<void>

interface ProseEditorPopupMenuProps {
   open:    (openDialog:(xpos:number, ypos:number)=>Promise<void>)=>void
   view:    EditorView,
}
export function ProseEditorPopupMenu({open, view}:ProseEditorPopupMenuProps) {
   const [menuStyle, setMenuStyle]  = useState({})
   const openDialog        = useRef<OpenDialog>()
   const popupMenu         = useRef<HTMLDialogElement>(null)

   useEffect(()=>{   
      // run once to provide opening hook
      open(openPopupMenu)
   },[])

   return <>
      <dialog ref={popupMenu} onClick={closePopupMenu} style={menuStyle} className={styles.popupMenu}>
         <Menu items={defaultMenu(false, view, openDialog.current)} theme={'dark'}/>
      </dialog>
      <Dialog open={open => openDialog.current=open}/>
   </>

   async function openPopupMenu(xpos:number, ypos:number) {
      popupMenu.current?.showModal()
      setMenuStyle({top:`${ypos-40}px`, left:`${xpos}px`})
   }
   function closePopupMenu() {
      popupMenu.current?.close()
   }


}

