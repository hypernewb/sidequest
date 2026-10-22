import {env} from 'cloudflare:workers';
import {connectionStatus} from '@/lib/fever-oauth';
export async function GET(req:Request){return Response.json(await connectionStatus(req,env),{headers:{'Cache-Control':'private, no-store'}});}
