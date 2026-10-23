import {getOfficial} from '@/lib/official-scan';
export async function GET(){try{return Response.json(await getOfficial(),{headers:{'Cache-Control':'private, no-store'}});}catch{return Response.json({error:'The official sources could not be checked. Try again shortly.'},{status:503,headers:{'Cache-Control':'private, no-store'}});}}
