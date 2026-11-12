import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { PKPass } from 'passkit-generator';
import QRCode from 'qrcode';

const colors = {forest:'rgb(22, 62, 53)',blue:'rgb(36, 77, 114)',plum:'rgb(100, 65, 92)',charcoal:'rgb(51, 59, 64)'};
export function validatePass(input) {
 if (!input || typeof input !== 'object') throw new Error('Pass details are required.');
 for(const [key,max] of [['title',48],['holder',60],['reference',40]]) {
  if(typeof input[key] !== 'string' || input[key].length>max || /[\x00-\x1f\x7f]/.test(input[key])) throw new Error(`Invalid ${key}.`);
 }
 if (!input.title.trim()) throw new Error('A pass name is required.');
 if(typeof input.payload!=='string' || !input.payload.length || Buffer.byteLength(input.payload,'utf8')>1800 || input.payload.includes('\0')) throw new Error('QR content must contain 1 to 1,800 bytes.');
 if(!Object.hasOwn(colors,input.color) || !['fuel','membership','other'].includes(input.category)) throw new Error('Invalid pass type or color.');
 return {title:input.title.trim(),holder:input.holder.trim(),reference:input.reference.trim(),payload:input.payload,color:input.color,category:input.category};
}
export function loadWalletConfig(env=process.env) {
 const keys=['PASS_TYPE_IDENTIFIER','APPLE_TEAM_IDENTIFIER','PASS_CERT_PATH','PASS_KEY_PATH','APPLE_WWDR_PATH'];
 if(keys.some(key=>!env[key])) return null;
 return {passTypeIdentifier:env.PASS_TYPE_IDENTIFIER,teamIdentifier:env.APPLE_TEAM_IDENTIFIER,organizationName:env.PASS_ORGANIZATION || 'PocketPass',certificates:{signerCert:readFileSync(env.PASS_CERT_PATH),signerKey:readFileSync(env.PASS_KEY_PATH),wwdr:readFileSync(env.APPLE_WWDR_PATH),signerKeyPassphrase:env.PASS_KEY_PASSPHRASE || undefined}};
}
export async function createPass(input,config) {
 const data=validatePass(input);
 // Self-contained brand icon, generated locally without any remote service.
 const icon=await QRCode.toBuffer('PocketPass',{width:87,margin:1,color:{dark:'#163e35',light:'#ffffff'}});
 const pass=new PKPass({'icon.png':icon,'icon@2x.png':icon,'icon@3x.png':icon},config.certificates,{formatVersion:1,passTypeIdentifier:config.passTypeIdentifier,teamIdentifier:config.teamIdentifier,organizationName:config.organizationName,serialNumber:randomUUID(),description:data.title,logoText:'PocketPass',foregroundColor:'rgb(255, 255, 255)',labelColor:'rgb(207, 224, 193)',backgroundColor:colors[data.color],sharingProhibited:true});
 pass.type='generic';
 pass.primaryFields.push({key:'title',label:data.category==='fuel'?'FUEL QR':'QR PASS',value:data.title});
 if(data.holder)pass.secondaryFields.push({key:'holder',label:'PASS HOLDER',value:data.holder});
 if(data.reference)pass.auxiliaryFields.push({key:'reference',label:'REFERENCE',value:data.reference});
 pass.backFields.push({key:'notice',label:'About this pass',value:'Personal copy of an existing QR code. Acceptance is determined by the original issuer. Keep the original available. This is not a payment card or an official identity document.'});
 pass.setBarcodes({format:'PKBarcodeFormatQR',message:data.payload,messageEncoding:'utf-8'});
 return pass.getAsBuffer();
}
