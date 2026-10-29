import {env} from 'cloudflare:workers';
export function GET(){
 // This is deliberately a browser credential, restricted by website and API in
 // Google Cloud. Never substitute a server key or expose other environment data.
 return Response.json({browserKey:env.GOOGLE_MAPS_BROWSER_KEY||null},{headers:{'Cache-Control':'private, max-age=300'}});
}
