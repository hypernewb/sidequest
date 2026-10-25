import type {Opportunity} from './opportunities.ts';
export function priceContext(o:Opportunity):Opportunity{
 if(o.kind!=='popup'||!['CIBONE','BEAMS collaborations'].includes(o.source))return o;
 // Shop announcements list merchandise and coupons alongside event information.
 // Preserve that evidence, but do not use it as the cost of attending the pop-up.
 return {...o,price:null,priceLabel:'Admission not stated; product prices in source',...(o.details?{details:{...o.details,priceCeiling:null}}:{})};
}
