import {env} from 'cloudflare:workers';
import {startPersonalFever} from '@/lib/fever-oauth';
export async function GET(req:Request){return startPersonalFever(req,env);}
