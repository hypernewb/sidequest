import {env} from 'cloudflare:workers';
import {disconnectPersonalFever} from '@/lib/fever-oauth';
export async function POST(req:Request){return disconnectPersonalFever(req,env);}
