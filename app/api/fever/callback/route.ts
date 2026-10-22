import {env} from 'cloudflare:workers';
import {completePersonalFever} from '@/lib/fever-oauth';
export async function GET(req:Request){return completePersonalFever(req,env);}
