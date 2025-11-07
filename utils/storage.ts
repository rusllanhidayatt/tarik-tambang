export const STORAGE_KEY = 'tt_datasource_v2'
export type Row = {
id: string
no: number
question: string
answer: string
timeSec: number
keyword?: string
}
export function loadData(): Row[]{
try{
const raw = localStorage.getItem(STORAGE_KEY)
if(!raw) return []
return JSON.parse(raw)
}catch(e){ return [] }
}
export function saveData(arr: Row[]){
localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
}