import { VarValueFn }   from '../plugins/variablesPlugin';



export function useVariableRules():{[name:string]:VarValueFn} {
   const time:VarValueFn = ({
      text:    () => timeFormat.format(new Date()),
      comment: `the time of last edit`
   })
   const date:VarValueFn = ({
      text:    () => dateFormat.format(new Date()),
      comment: `the date of last edit`
   })
   return {time, date}
}


const dateFormat = {
   format: (date:Date) => `${date.getFullYear()}${`${date.getMonth()+1}`.padStart(2,'0')}${`${date.getDate()}`.padStart(2,'0')}`
}

const timeFormat = {
   format: (date:Date) => `${`${date.getHours()}`.padStart(2,'0')}:${`${date.getMinutes()}`.padStart(2,'0')}:${`${date.getSeconds()}`.padStart(2,'0')}`
}
