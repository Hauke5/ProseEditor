'use server'
import fs from '@/lib/fileAPI/fsUtil'

const md = fs.readTextFileSync('./lib/components/ProseEditor/Readme.md')

export const readme = async () => md
